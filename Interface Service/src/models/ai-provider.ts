import { createOpenAI, openai } from "@ai-sdk/openai";
import CryptoJS from "crypto-js";
import { prisma } from "../utils/prisma";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-secret-key"; // Mouad: expect that ENCRYPTION_KEY will be in env variables
function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export async function getModel() {
  const settings = await prisma.systemSettings.findFirst();
  if (!settings) {
    throw new Error(
      "System settings not found in database. Please complete the setup.",
    );
  }

  const { llmProvider, llmModel, llmApiKey, llmBaseUrl } = settings;

  const apiKey = decrypt(llmApiKey || "");

  switch (llmProvider) {
    case "openai":
    case "custom":
      const openaiProvider = createOpenAI({
        apiKey,
        baseURL: llmBaseUrl || undefined,
      });
      return openaiProvider(llmModel || "gpt-4.1-nano");

    default:
      const fallbackProvider = createOpenAI({
        apiKey,
        baseURL: llmBaseUrl || undefined,
      });
      return fallbackProvider(llmModel || "gpt-4.1-nano");
  }
}
