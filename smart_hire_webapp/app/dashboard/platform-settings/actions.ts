"use server";

import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, tool } from "ai";
import { z } from "zod";

const SystemSettingsSchema = z.object({
    llm: z.object({
        provider: z.string().min(1, "Provider is required"),
        apiKey: z.string().min(1, "API Key is required"),
        modelName: z.string().min(1, "Model Name is required"),
        baseUrl: z.string().optional(),
    }),
    smtp: z.object({
        host: z.string().min(1, "SMTP Host is required"),
        port: z.number().int(),
        user: z.string().min(1, "SMTP User is required"),
        password: z.string().optional(),
        from: z.string().min(1, "From email is required"),
    }).optional()
});

export async function getSystemSettings() {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) return null;

    return {
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
    };
}

export async function updateSystemSettings(data: z.infer<typeof SystemSettingsSchema>) {
    // 1. Validate the data
    const validatedData = SystemSettingsSchema.parse(data);

    // 2. Validate LLM Connectivity
    try {
        let model;
        const { provider, apiKey, modelName, baseUrl } = validatedData.llm;

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
                    inputSchema: z.void(),
                    execute: async () => {
                        return { secret: "Welcome_TO_SMARTHIRE" };
                    }
                }),
            },
            prompt: "Call the tool and give me the secret only.",
        });
    } catch (error) {
        console.error("LLM Validation Failed:", error);
        throw new Error(`LLM Verification Failed: ${(error as Error).message}`);
    }

    // 3. Save the settings
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) throw new Error("System settings not found");

    const updateData: any = {
        llmProvider: validatedData.llm.provider,
        llmApiKey: encrypt(validatedData.llm.apiKey),
        llmModel: validatedData.llm.modelName,
        llmBaseUrl: validatedData.llm.baseUrl,
    };

    if (validatedData.smtp) {
        updateData.smtpHost = validatedData.smtp.host;
        updateData.smtpPort = validatedData.smtp.port;
        updateData.smtpUser = validatedData.smtp.user;
        updateData.smtpFrom = validatedData.smtp.from;
        updateData.smtpConfigured = true;
        if (validatedData.smtp.password) {
            updateData.smtpPassword = encrypt(validatedData.smtp.password);
        }
    }

    return await prisma.systemSettings.update({
        where: { id: settings.id },
        data: updateData
    });
}

