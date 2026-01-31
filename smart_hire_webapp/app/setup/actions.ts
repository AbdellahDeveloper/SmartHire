"use server";

import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, stepCountIs, tool } from "ai";
import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { z } from "zod";

export async function testLLM(provider: string, apiKey: string, modelName?: string, baseUrl?: string) {
    try {
        let model;
        if (provider === "openai") {
            model = createOpenAI({ apiKey })(modelName || "gpt-5-nano");
        } else if (provider === "google") {
            model = createGoogleGenerativeAI({ apiKey })(modelName || "gemini-1.5-flash");
        } else if (provider === "anthropic") {
            model = createAnthropic({ apiKey })(modelName || "claude-3-haiku-20240307");
        } else if (provider === "custom") {
            if (!baseUrl) throw new Error("Base URL is required for custom provider");
            model = createOpenAICompatible({
                name: "custom",
                apiKey,
                baseURL: baseUrl,
            })(modelName || "model-id");
        } else {
            throw new Error("Invalid provider");
        }

        const { text } = await generateText({
            model,
            prompt: "I want you to act as a code generator. Generate a code for me using get-code tool. Answer ONLY with the code.",
            tools: {
                "get-code": tool({
                    description: "get-code",
                    inputSchema: z.object({}),
                    execute: async () => {
                        return { code: "SMART HIRE" };
                    }
                })
            },
            stopWhen: stepCountIs(5)
        });

        return { success: true, message: `Connected! Response: ${text.substring(0, 20)}...` };
    } catch (error) {
        return { success: false, message: (error as Error).message };
    }
}

interface SMTPConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
}

export async function testSMTP(config: SMTPConfig) {
    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });

        await transporter.verify();
        return { success: true, message: "SMTP Connection successful!" };
    } catch (error) {
        return { success: false, message: (error as Error).message };
    }
}

interface SetupData {
    adminBase: {
        username: string;
        email: string;
        password: string;
    };
    llm: {
        provider: string;
        apiKey: string;
        modelName?: string;
        baseUrl?: string;
    };
    smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
    };
}

export async function completeSetup(data: SetupData) {
    try {
        const { adminBase, llm, smtp } = data;

        if (!smtp.host || !smtp.user || !smtp.pass) {
            throw new Error("SMTP configuration is required.");
        }

        // 1. Create the Admin User using BetterAuth
        try {
            await auth.api.signUpEmail({
                body: {
                    email: adminBase.email,
                    password: adminBase.password,
                    name: adminBase.username,
                    role: "admin",
                },
                headers: await headers()
            });
        } catch (error) {
            console.error("Failed to create admin user:", error);
            throw new Error("Failed to create admin user. Please try again.");
        }

        // 2. Create the system settings
        const encryptedLLMKey = encrypt(llm.apiKey);

        const adminSettings = [
            { key: "admin_smtp_host", value: smtp.host },
            { key: "admin_smtp_port", value: smtp.port.toString() },
            { key: "admin_smtp_user", value: smtp.user },
            { key: "admin_smtp_pass", value: encrypt(smtp.pass) }
        ];

        await Promise.all([
            prisma.systemSettings.create({
                data: {
                    llmProvider: llm.provider,
                    llmApiKey: encryptedLLMKey,
                    llmBaseUrl: llm.baseUrl,
                    isSetupComplete: true,
                    smtpConfigured: !!smtp.host,
                    llmModel: llm.modelName,
                },
            }),
            ...adminSettings.map(s => prisma.systemSettings.create({ data: s }))
        ]);

        return { success: true };
    } catch (error) {
        console.error("Setup error:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function isSetupFinished() {
    try {
        const settings = await prisma.systemSettings.findFirst();
        return !!settings?.isSetupComplete;
    } catch {
        return false;
    }
}
