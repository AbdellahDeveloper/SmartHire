import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { decrypt } from './crypto';
import { prisma } from './prisma';

export async function getModel() {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) {
        throw new Error("System settings not found. Please complete the setup.");
    }

    const { llmProvider, llmModel, llmApiKey, llmBaseUrl } = settings;
    const apiKey = decrypt(llmApiKey || "");
    const modelName = llmModel || "";

    switch (llmProvider) {
        case "openai":
            return createOpenAI({ apiKey })(modelName || "gpt-5-nano");
        case "google":
            return createGoogleGenerativeAI({ apiKey })(modelName || "gemini-1.5-flash");
        case "anthropic":
            return createAnthropic({ apiKey })(modelName || "claude-3-haiku-20240307");
        case "custom":
            if (!llmBaseUrl) throw new Error("Base URL is required for custom provider");
            return createOpenAICompatible({
                name: "custom",
                apiKey,
                baseURL: llmBaseUrl,
            })(modelName || "model-id");
        default:
            // Fallback to OpenAI
            return createOpenAI({ apiKey })(modelName || "gpt-5-nano");
    }
}
