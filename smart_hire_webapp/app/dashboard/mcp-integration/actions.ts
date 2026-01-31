"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { headers } from "next/headers";

export async function getMCPConfig(companyId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
        throw new Error("Unauthorized");
    }

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { mcpToken: true }
    });

    const host = (await headers()).get("host") || "127.0.0.1";
    const serverIp = process.env.MCP_SERVER_IP || host.split(":")[0];

    return {
        token: company?.mcpToken || null,
        serverIp
    };
}

export async function regenerateMCPToken(companyId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
        throw new Error("Unauthorized");
    }

    const newToken = crypto.randomBytes(12).toString("hex"); // 24 characters

    await prisma.company.update({
        where: { id: companyId },
        data: {
            mcpToken: newToken
        }
    });

    return newToken;
}
