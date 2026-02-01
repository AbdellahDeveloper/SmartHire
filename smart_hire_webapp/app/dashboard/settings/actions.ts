"use server";

import { auth } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { ImapFlow } from "imapflow";
import { headers } from "next/headers";
import nodemailer from "nodemailer";

export async function updateTeamsConversationIds(companyId: string, teamsIds: string[]) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
        throw new Error("Unauthorized");
    }

    return await prisma.company.update({
        where: { id: companyId },
        data: {
            microsoftTeamsIds: teamsIds,
        }
    });
}

export async function getMeetingConnection(companyId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
        throw new Error("Unauthorized");
    }

    return await prisma.meetingConnection.findFirst({
        where: { companyId: companyId }
    });
}

export async function revokeMeetingConnection(companyId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
        throw new Error("Unauthorized");
    }

    return await prisma.meetingConnection.deleteMany({
        where: { companyId: companyId }
    });
}

export async function updateSMTPSettings(companyId: string, data: {
    smtpServer: string;
    smtpPort: number;
    smtpEmail: string;
    smtpPassword?: string;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
        throw new Error("Unauthorized");
    }

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { smtpPassword: true }
    });

    const passwordToUse = data.smtpPassword || (company?.smtpPassword ? decrypt(company.smtpPassword) : "");

    if (!passwordToUse) {
        throw new Error("SMTP Password is required for validation");
    }

    try {
        const transporter = nodemailer.createTransport({
            host: data.smtpServer,
            port: data.smtpPort,
            secure: data.smtpPort === 465,
            auth: {
                user: data.smtpEmail,
                pass: passwordToUse,
            },
        });
        await transporter.verify();
    } catch (error: any) {
        throw new Error(`SMTP Validation failed: ${error.message}`);
    }

    return await prisma.company.update({
        where: { id: companyId },
        data: {
            smtpServer: data.smtpServer,
            smtpPort: data.smtpPort,
            smtpEmail: data.smtpEmail,
            smtpPassword: data.smtpPassword ? encrypt(data.smtpPassword) : undefined,
        }
    });
}

export async function updateIMAPSettings(companyId: string, data: {
    imapServer: string;
    imapPort: number;
    imapEmail: string;
    imapPassword?: string;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
        throw new Error("Unauthorized");
    }

    const existing = await prisma.userMail.findFirst({
        where: { companyId: companyId }
    });

    const passwordToUse = data.imapPassword || (existing?.password ? decrypt(existing.password) : "");

    if (!passwordToUse) {
        throw new Error("IMAP Password is required for validation");
    }

    const client = new ImapFlow({
        host: data.imapServer,
        port: data.imapPort,
        secure: true,
        auth: {
            user: data.imapEmail,
            pass: passwordToUse,
        },
        logger: false
    });

    try {
        await client.connect();
        await client.logout();
    } catch (error: any) {
        throw new Error(`IMAP Validation failed: ${error.message}`);
    }

    if (existing) {
        return await prisma.userMail.update({
            where: { id: existing.id },
            data: {
                server: data.imapServer,
                port: data.imapPort,
                email: data.imapEmail,
                password: data.imapPassword ? encrypt(data.imapPassword) : undefined,
            }
        });
    } else {
        return await prisma.userMail.create({
            data: {
                companyId: companyId,
                server: data.imapServer,
                port: data.imapPort,
                email: data.imapEmail,
                password: encrypt(passwordToUse),
            }
        });
    }
}

export async function updateS3Settings(companyId: string, data: {
    s3Bucket: string;
    s3AccessKey: string;
    s3SecretKey?: string;
    s3Region: string;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
        throw new Error("Unauthorized");
    }

    const existing = await prisma.s3Credential.findFirst({
        where: { companyId: companyId }
    });

    const secretToUse = data.s3SecretKey || (existing?.secretKey ? decrypt(existing.secretKey) : "");

    if (!secretToUse) {
        throw new Error("S3 Secret Key is required for validation");
    }

    try {
        // @ts-ignore
        const bucket = Bun.s3(data.s3Bucket, {
            accessKeyId: data.s3AccessKey,
            secretAccessKey: secretToUse,
            region: data.s3Region,
        });
        await bucket.exists(".smarthire-check");
    } catch (error: any) {
        throw new Error(`S3 Validation failed: ${error.message || "Invalid credentials or bucket"}`);
    }

    if (existing) {
        return await prisma.s3Credential.update({
            where: { id: existing.id },
            data: {
                bucket: data.s3Bucket,
                accessKey: data.s3AccessKey,
                secretKey: data.s3SecretKey ? encrypt(data.s3SecretKey) : undefined,
                region: data.s3Region,
                endpoint: `https://s3.${data.s3Region}.amazonaws.com`, // Default for AWS
            }
        });
    } else {
        return await prisma.s3Credential.create({
            data: {
                companyId: companyId,
                bucket: data.s3Bucket,
                accessKey: data.s3AccessKey,
                secretKey: encrypt(secretToUse),
                region: data.s3Region,
                endpoint: `https://s3.${data.s3Region}.amazonaws.com`,
            }
        });
    }
}

export async function getCompanySettings(companyId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
        throw new Error("Unauthorized");
    }

    const [company, imap, s3] = await Promise.all([
        prisma.company.findUnique({ where: { id: companyId } }),
        prisma.userMail.findFirst({ where: { companyId } }),
        prisma.s3Credential.findFirst({ where: { companyId } })
    ]);

    if (!company) return null;

    return {
        ...company,
        imapServer: imap?.server,
        imapPort: imap?.port,
        imapEmail: imap?.email,
        s3Bucket: s3?.bucket,
        s3AccessKey: s3?.accessKey,
        s3Region: s3?.region,
    };
}

export async function connectMeetingAccount() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const user = session.user as any;
    const companyId = user.companyId;

    if (!companyId) {
        throw new Error("User has no associated company");
    }

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { mcpToken: true }
    });

    if (!company?.mcpToken) {
        throw new Error("MCP Token not found for this company. Please complete MCP integration first.");
    }

    const res = await fetch(`${process.env.MEET_SCHEDULER_IP}/connect-meeting-account`, {
        headers: {
            "Authorization": `Bearer ${company.mcpToken}`
        }
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to connect meeting account");
    }

    return await res.json();
}
