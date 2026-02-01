"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { headers } from "next/headers";

export async function getMCPConfig(companyId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
            return { success: false, error: "Unauthorized" };
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { mcpToken: true }
        });

        const hostHeader = await headers();
        const host = hostHeader.get("host") || "127.0.0.1";
        const serverIp = process.env.MCP_SERVER_IP || host.split(":")[0];

        return {
            success: true,
            token: company?.mcpToken || null,
            serverIp
        };
    } catch (error: any) {
        console.error("Failed to get MCP config:", error);
        return { success: false, error: error.message || "Failed to get MCP configuration" };
    }
}

export async function regenerateMCPToken(companyId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
            return { success: false, error: "Unauthorized" };
        }

        const newToken = crypto.randomBytes(12).toString("hex"); // 24 characters

        await prisma.company.update({
            where: { id: companyId },
            data: {
                mcpToken: newToken
            }
        });

        return { success: true, token: newToken };
    } catch (error: any) {
        console.error("Failed to regenerate MCP token:", error);
        return { success: false, error: error.message || "Failed to regenerate MCP token" };
    }
}
