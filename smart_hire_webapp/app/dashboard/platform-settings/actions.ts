"use server";

import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

const LLMSettingsSchema = z.object({
    provider: z.string().min(1, "Provider is required"),
    apiKey: z.string().min(1, "API Key is required"),
    modelName: z.string().min(1, "Model Name is required"),
    baseUrl: z.string().optional(),
});

type LLMSettings = z.infer<typeof LLMSettingsSchema>;

export async function getSystemSettings() {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) return null;

    return {
        provider: settings.llmProvider,
        modelName: settings.llmModel || "",
        baseUrl: settings.llmBaseUrl || "",
        // We don't return the API key for security, but we know it's there
        hasApiKey: !!settings.llmApiKey
    };
}

export async function updateSystemSettings(data: LLMSettings) {
    // 1. Validate the data with Zod
    const validatedData = LLMSettingsSchema.parse(data);

    // 2. Validate LLM Connectivity & Tool Calling (Same as setup)
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
            prompt: "Test connectivity and tool calling. Answer with 'OK' if you can see the tool.",
            tools: {
                "check-system": tool({
                    description: "check-system",
                    inputSchema: z.object({}),
                    execute: async () => ({ status: "online" })
                })
            },
            stopWhen: stepCountIs(2)
        });
    } catch (error) {
        console.error("LLM Validation Failed:", error);
        throw new Error(`LLM Verification Failed: ${(error as Error).message}`);
    }

    // 3. If validation passed, save the settings
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) throw new Error("System settings not found");

    return await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
            llmProvider: validatedData.provider,
            llmApiKey: encrypt(validatedData.apiKey),
            llmModel: validatedData.modelName,
            llmBaseUrl: validatedData.baseUrl,
        }
    });
}
