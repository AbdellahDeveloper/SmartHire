"use server";

import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, tool } from "ai";
import { z } from "zod";

const LLMSettingsSchema = z.object({
    provider: z.string().min(1, "Provider is required"),
    apiKey: z.string().min(1, "API Key is required"),
    modelName: z.string().min(1, "Model Name is required"),
    baseUrl: z.string().optional(),
});

const SMTPSettingsSchema = z.object({
    host: z.string().min(1, "SMTP Host is required"),
    port: z.number().int(),
    user: z.string().min(1, "SMTP User is required"),
    password: z.string().optional(),
    from: z.string().min(1, "From email is required"),
});

export async function getSystemSettings() {
    try {
        const settings = await prisma.systemSettings.findFirst();
        if (!settings) return { success: true, settings: null };

        return {
            success: true,
            settings: {
                llm: {
                    provider: settings.llmProvider,
                    modelName: settings.llmModel || "",
                    baseUrl: settings.llmBaseUrl || "",
                    hasApiKey: !!settings.llmApiKey
                },
                smtp: {
                    host: settings.smtpHost || "",
                    port: settings.smtpPort || 587,
                    user: settings.smtpUser || "",
                    from: settings.smtpFrom || "",
                    hasPassword: !!settings.smtpPassword
                }
            }
        };
    } catch (error: any) {
        console.error("Failed to get system settings:", error);
        return { success: false, error: error.message || "Failed to get system settings" };
    }
}

export async function updateLLMSettings(data: z.infer<typeof LLMSettingsSchema>) {
    try {
        const validatedData = LLMSettingsSchema.parse(data);

        try {
            let model;
            const { provider, apiKey, modelName, baseUrl } = validatedData;

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

            await generateText({
                model,
                tools: {
                    getSecret: tool({
                        description: "Here you find the secret",
                        inputSchema: z.object({}),
                        execute: async () => {
                            return { secret: "Welcome_TO_SMARTHIRE" };
                        }
                    }),
                },
                prompt: "Call the tool and give me the secret only.",
            });
        } catch (error) {
            console.error("LLM Validation Failed:", error);
            return { success: false, error: `LLM Verification Failed: ${(error as Error).message}` };
        }

        const settings = await prisma.systemSettings.findFirst();
        if (!settings) return { success: false, error: "System settings not found" };

        await prisma.systemSettings.update({
            where: { id: settings.id },
            data: {
                llmProvider: validatedData.provider,
                llmApiKey: encrypt(validatedData.apiKey),
                llmModel: validatedData.modelName,
                llmBaseUrl: validatedData.baseUrl,
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update LLM settings:", error);
        return { success: false, error: error.message || "Failed to update LLM settings" };
    }
}

export async function updateSMTPSettings(data: z.infer<typeof SMTPSettingsSchema>) {
    try {
        const validatedData = SMTPSettingsSchema.parse(data);

        const settings = await prisma.systemSettings.findFirst();
        if (!settings) return { success: false, error: "System settings not found" };

        const updateData: any = {
            smtpHost: validatedData.host,
            smtpPort: validatedData.port,
            smtpUser: validatedData.user,
            smtpFrom: validatedData.from,
            smtpConfigured: true,
        };

        if (validatedData.password) {
            updateData.smtpPassword = encrypt(validatedData.password);
        }

        await prisma.systemSettings.update({
            where: { id: settings.id },
            data: updateData
        });

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update SMTP settings:", error);
        return { success: false, error: error.message || "Failed to update SMTP settings" };
    }
}
