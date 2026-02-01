"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function verifyToken(email: string, token: string) {
    const verification = await prisma.verification.findFirst({
        where: {
            identifier: email,
            value: token,
            expiresAt: { gte: new Date() }
        }
    });

    return !!verification;
}

export async function setupInitialPassword(email: string, token: string, password: string) {
    try {
        const verification = await prisma.verification.findFirst({
            where: {
                identifier: email,
                value: token,
                expiresAt: { gte: new Date() }
            }
        });

        if (!verification) {
            return { success: false, error: "Invalid or expired token" };
        }

        const company = await prisma.company.findUnique({
            where: { email }
        });

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        // Use Better Auth to create the user with password
        // Better Auth will handle hashing
        await auth.api.signUpEmail({
            body: {
                email: company.email,
                password: password,
                name: company.name,
                role: "company",
                companyId: company.id
            },
            headers: await headers()
        });

        // Delete the token
        await prisma.verification.delete({
            where: { id: verification.id }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Failed to setup initial password:", error);
        return { success: false, error: error.message || "Failed to setup initial password" };
    }
}
