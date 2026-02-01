import nodemailer from "nodemailer";
import { decrypt } from "./crypto";
import { prisma } from "./prisma";

export async function getTransporter(companyId?: string, forceAdmin: boolean = false) {
    const getAdminConfig = async () => {
        const settings = await prisma.systemSettings.findFirst({
            where: { isSetupComplete: true }
        });

        if (!settings || !settings.smtpHost) {
            console.error("Admin SMTP not configured");
            return {
                host: "",
                port: 587,
                secure: false,
                auth: { user: "", pass: "" },
            };
        }

        return {
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            secure: settings.smtpPort === 465,
            auth: {
                user: settings.smtpUser || "",
                pass: settings.smtpPassword ? decrypt(settings.smtpPassword) : "",
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
