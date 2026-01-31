import { createOpenAI } from '@ai-sdk/openai';
import CryptoJS from 'crypto-js';
import prisma from './prisma';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

function decrypt(ciphertext: string): string {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText) {
            return ciphertext;
        }
        return originalText;
    } catch (e) {
        return ciphertext;
    }
}

export async function getModel() {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) {
        throw new Error("System settings not found in database. Please complete the setup.");
    }

    const { llmProvider, llmModel, llmApiKey, llmBaseUrl } = settings;
    const apiKey = decrypt(llmApiKey || "");

    switch (llmProvider) {
        case 'openai':
        case 'custom':
            const openaiProvider = createOpenAI({
                apiKey,
                baseURL: llmBaseUrl || undefined,
            });
            return openaiProvider(llmModel || 'gpt-5-nano');

        default:
            const fallbackProvider = createOpenAI({
                apiKey,
                baseURL: llmBaseUrl || undefined,
            });
            return fallbackProvider(llmModel || 'gpt-5-nano');
    }
}
