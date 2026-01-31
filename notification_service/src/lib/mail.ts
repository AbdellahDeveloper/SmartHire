import nodemailer from "nodemailer";
import { decrypt } from "./crypto";
import { prisma } from "./prisma";

export async function getTransporter(companyId?: string, forceAdmin: boolean = false) {
    // Helper to get admin SMTP from DB
    const getAdminConfig = async () => {
        const settings = await prisma.systemSettings.findMany({
            where: {
                key: {
                    in: ["admin_smtp_host", "admin_smtp_port", "admin_smtp_user", "admin_smtp_pass"]
                }
            }
        });

        const config: any = {};
        settings.forEach(s => {
            if (s.key) config[s.key] = s.value;
        });

        if (config.admin_smtp_host && config.admin_smtp_user && config.admin_smtp_pass) {
            return {
                host: config.admin_smtp_host,
                port: parseInt(config.admin_smtp_port || "587"),
                secure: config.admin_smtp_port === "465",
                auth: {
                    user: config.admin_smtp_user,
                    pass: decrypt(config.admin_smtp_pass),
                },
            };
        }

        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_PORT === "465",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        };
    };

    if (forceAdmin || !companyId) {
        const adminConfig = await getAdminConfig();
        return {
            transporter: nodemailer.createTransport(adminConfig),
            sender: adminConfig.auth.user || ""
        };
    }

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
            smtpServer: true,
            smtpPort: true,
            smtpEmail: true,
            smtpPassword: true,
        }
    });

    if (company?.smtpServer && company?.smtpPort && company?.smtpEmail && company?.smtpPassword) {
        try {
            return {
                transporter: nodemailer.createTransport({
                    host: company.smtpServer,
                    port: company.smtpPort,
                    secure: company.smtpPort === 465,
                    auth: {
                        user: company.smtpEmail,
                        pass: decrypt(company.smtpPassword),
                    },
                }),
                sender: company.smtpEmail
            };
        } catch (error) {
            console.error("Failed to create company transporter, falling back to admin:", error);
        }
    }

    const adminConfig = await getAdminConfig();
    return {
        transporter: nodemailer.createTransport(adminConfig),
        sender: adminConfig.auth.user || ""
    };
}
