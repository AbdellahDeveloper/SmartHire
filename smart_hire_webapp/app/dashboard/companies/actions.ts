"use server";

import { getTransporter } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { headers } from "next/headers";

export async function getCompanies() {
    return await prisma.company.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

interface CompanyData {
    companyName: string;
    email: string;
}

export async function addCompanyAccount(data: CompanyData) {
    try {
        const headerList = await headers();
        const host = headerList.get("host");
        const protocol = host?.includes("localhost") ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        // 0. Check if user or company with this email already exists
        const existingCompany = await prisma.company.findUnique({
            where: { email: data.email }
        });
        if (existingCompany) {
            return { success: false, error: "A company with this email already exists." };
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            return { success: false, error: "A user with this email already exists." };
        }

        // 1. Generate temporary token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

        // 2. Create company profile in a transaction
        const company = await prisma.$transaction(async (tx) => {
            const mcpToken = crypto.randomBytes(12).toString("hex"); // 24 characters
            const c = await tx.company.create({
                data: {
                    name: data.companyName,
                    email: data.email,
                    microsoftTeamsIds: [],
                    mcpToken: mcpToken,
                }
            });

            // Store verification token
            await tx.verification.create({
                data: {
                    id: crypto.randomUUID(),
                    identifier: data.email,
                    value: token,
                    expiresAt,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });

            return c;
        });

        // 3. Send email via getTransporter
        const { transporter, sender } = await getTransporter(undefined, true);

        const setupUrl = `${baseUrl}/setup-password?token=${token}&email=${encodeURIComponent(data.email)}`;

        await transporter.sendMail({
            from: `"SmartHire" <${sender}>`,
            to: data.email,
            subject: "Welcome to SmartHire - Complete Your Registration",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #3b82f6;">Welcome to SmartHire</h1>
                    <p>Hello ${data.companyName},</p>
                    <p>Your company account has been created on SmartHire. To get started, please set up your password by clicking the button below:</p>
                    <a href="${setupUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Set Up Password</a>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">Automated message from SmartHire Platform</p>
                </div>
            `,
        });

        return { success: true, company };
    } catch (error: any) {
        console.error("Failed to add company account:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}

export async function deleteCompany(id: string) {
    try {
        // Manually delete related records if they don't have Cascade Delete in MongoDB
        // In our schema, we should ensure these are cleaned up.
        await prisma.$transaction([
            prisma.job.deleteMany({ where: { companyId: id } }),
            prisma.candidate.deleteMany({ where: { companyId: id } }),
            prisma.matchSession.deleteMany({ where: { companyId: id } }),
            prisma.matchResult.deleteMany({ where: { companyId: id } }),
            prisma.meeting.deleteMany({ where: { companyId: id } }),
            prisma.meetingConnection.deleteMany({ where: { companyId: id } }),
            prisma.matchingReport.deleteMany({ where: { companyId: id } }),
            prisma.userMail.deleteMany({ where: { companyId: id } }),
            prisma.s3Credential.deleteMany({ where: { companyId: id } }),
            prisma.user.deleteMany({ where: { companyId: id } }),
            prisma.company.delete({ where: { id } })
        ]);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete company:", error);
        return { success: false, error: error.message || "Failed to delete company" };
    }
}
