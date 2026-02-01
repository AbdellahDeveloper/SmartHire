"use server";

import { auth } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { ImapFlow } from "imapflow";
import { headers } from "next/headers";
import nodemailer from "nodemailer";

export async function updateTeamsConversationIds(companyId: string, teamsIds: string[]) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
            return { success: false, error: "Unauthorized" };
        }

        const company = await prisma.company.update({
            where: { id: companyId },
            data: {
                microsoftTeamsIds: teamsIds,
            }
        });
        return { success: true, company };
    } catch (error: any) {
        console.error("Failed to update teams conversation IDs:", error);
        return { success: false, error: error.message || "Failed to update teams conversation IDs" };
    }
}

export async function getMeetingConnection(companyId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
            return { success: false, error: "Unauthorized" };
        }

        const connection = await prisma.meetingConnection.findFirst({
            where: { companyId: companyId }
        });
        return { success: true, connection };
    } catch (error: any) {
        console.error("Failed to get meeting connection:", error);
        return { success: false, error: error.message || "Failed to get meeting connection" };
    }
}

export async function revokeMeetingConnection(companyId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
            return { success: false, error: "Unauthorized" };
        }

        await prisma.meetingConnection.deleteMany({
            where: { companyId: companyId }
        });
        return { success: true };
    } catch (error: any) {
        console.error("Failed to revoke meeting connection:", error);
        return { success: false, error: error.message || "Failed to revoke meeting connection" };
    }
}

export async function updateSMTPSettings(companyId: string, data: {
    smtpServer: string;
    smtpPort: number;
    smtpEmail: string;
    smtpPassword?: string;
}) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
            return { success: false, error: "Unauthorized" };
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { smtpPassword: true }
        });

        const passwordToUse = data.smtpPassword || (company?.smtpPassword ? decrypt(company.smtpPassword) : "");

        if (!passwordToUse) {
            return { success: false, error: "SMTP Password is required for validation" };
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
            return { success: false, error: `SMTP Validation failed: ${error.message}` };
        }

        const updated = await prisma.company.update({
            where: { id: companyId },
            data: {
                smtpServer: data.smtpServer,
                smtpPort: data.smtpPort,
                smtpEmail: data.smtpEmail,
                smtpPassword: data.smtpPassword ? encrypt(data.smtpPassword) : undefined,
            }
        });

        return { success: true, company: updated };
    } catch (error: any) {
        console.error("Failed to update SMTP settings:", error);
        return { success: false, error: error.message || "Failed to update SMTP settings" };
    }
}

export async function updateIMAPSettings(companyId: string, data: {
    imapServer: string;
    imapPort: number;
    imapEmail: string;
    imapPassword?: string;
}) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
            return { success: false, error: "Unauthorized" };
        }

        const existing = await prisma.userMail.findFirst({
            where: { companyId: companyId }
        });

        const passwordToUse = data.imapPassword || (existing?.password ? decrypt(existing.password) : "");

        if (!passwordToUse) {
            return { success: false, error: "IMAP Password is required for validation" };
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
            return { success: false, error: `IMAP Validation failed: ${error.message}` };
        }

        let result;
        if (existing) {
            result = await prisma.userMail.update({
                where: { id: existing.id },
                data: {
                    server: data.imapServer,
                    port: data.imapPort,
                    email: data.imapEmail,
                    password: data.imapPassword ? encrypt(data.imapPassword) : undefined,
                }
            });
        } else {
            result = await prisma.userMail.create({
                data: {
                    companyId: companyId,
                    server: data.imapServer,
                    port: data.imapPort,
                    email: data.imapEmail,
                    password: encrypt(passwordToUse),
                }
            });
        }
        return { success: true, mail: result };
    } catch (error: any) {
        console.error("Failed to update IMAP settings:", error);
        return { success: false, error: error.message || "Failed to update IMAP settings" };
    }
}

export async function updateS3Settings(companyId: string, data: {
    s3Bucket: string;
    s3AccessKey: string;
    s3SecretKey?: string;
    s3Region: string;
    s3Endpoint?: string;
}) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
            return { success: false, error: "Unauthorized" };
        }

        const existing = await prisma.s3Credential.findFirst({
            where: { companyId: companyId }
        });

        const secretToUse = data.s3SecretKey || (existing?.secretKey ? decrypt(existing.secretKey) : "");

        if (!secretToUse) {
            console.error(`S3 validation failed: No secret key provided or found for company ${companyId}`);
            return {
                success: false,
                error: existing ? "S3 Secret Key is required (type it again if you haven't yet)" : "S3 Secret Key is required for first-time setup"
            };
        }

        try {
            const client = new S3Client({
                region: data.s3Region,
                endpoint: data.s3Endpoint || undefined,
                credentials: {
                    accessKeyId: data.s3AccessKey,
                    secretAccessKey: secretToUse,
                },
                forcePathStyle: !!data.s3Endpoint,
            });

            await client.send(new HeadBucketCommand({ Bucket: data.s3Bucket }));
        } catch (error: any) {
            console.error("S3 Validation details:", error);
            return { success: false, error: `S3 Validation failed, Invalid credentials or bucket` };
        }

        let result;
        if (existing) {
            result = await prisma.s3Credential.update({
                where: { id: existing.id },
                data: {
                    bucket: data.s3Bucket,
                    accessKey: data.s3AccessKey,
                    secretKey: data.s3SecretKey ? encrypt(data.s3SecretKey) : undefined,
                    region: data.s3Region,
                    endpoint: data.s3Endpoint,
                }
            });
        } else {
            result = await prisma.s3Credential.create({
                data: {
                    companyId: companyId,
                    bucket: data.s3Bucket,
                    accessKey: data.s3AccessKey,
                    secretKey: encrypt(secretToUse),
                    region: data.s3Region,
                    endpoint: data.s3Endpoint || "",
                }
            });
        }
        return { success: true, s3: result };
    } catch (error: any) {
        console.error("Failed to update S3 settings:", error);
        return { success: false, error: error.message || "Failed to update S3 settings" };
    }
}

export async function getCompanySettings(companyId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "company" || (session.user as any).companyId !== companyId) {
            return { success: false, error: "Unauthorized" };
        }

        const [company, imap, s3] = await Promise.all([
            prisma.company.findUnique({ where: { id: companyId } }),
            prisma.userMail.findFirst({ where: { companyId } }),
            prisma.s3Credential.findFirst({ where: { companyId } })
        ]);

        if (!company) return { success: false, error: "Company not found" };

        return {
            success: true,
            settings: {
                ...company,
                imapServer: imap?.server,
                imapPort: imap?.port,
                imapEmail: imap?.email,
                s3Bucket: s3?.bucket,
                s3AccessKey: s3?.accessKey,
                s3Region: s3?.region,
                s3Endpoint: s3?.endpoint,
            }
        };
    } catch (error: any) {
        console.error("Failed to get company settings:", error);
        return { success: false, error: error.message || "Failed to get company settings" };
    }
}

export async function connectMeetingAccount() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const user = session.user as any;
        const companyId = user.companyId;

        if (!companyId) {
            return { success: false, error: "User has no associated company" };
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { mcpToken: true }
        });

        if (!company?.mcpToken) {
            return { success: false, error: "MCP Token not found for this company. Please complete MCP integration first." };
        }

        const res = await fetch(`${process.env.MEET_SCHEDULER_IP}/connect-meeting-account`, {
            headers: {
                "Authorization": `Bearer ${company.mcpToken}`
            }
        });

        if (!res.ok) {
            const errorData = await res.json();
            return { success: false, error: errorData.error || "Failed to connect meeting account" };
        }

        const data = await res.json();
        return { success: true, ...data };
    } catch (error: any) {
        console.error("Failed to connect meeting account:", error);
        return { success: false, error: error.message || "Failed to connect meeting account" };
    }
}
