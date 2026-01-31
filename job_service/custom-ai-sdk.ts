import {
    generateText,
    type ModelMessage,
    type ToolApprovalResponse
} from "ai";

export type GenerateTextWithMCPParams = Parameters<typeof generateText>[0] & {
    onApprovalRequest?: (params: {
        toolName: string,
        toolInput: unknown
    }) => Promise<{ approved: boolean; reason?: string }>;
};

export async function generateTextWithApproval(params: GenerateTextWithMCPParams) {
    const {
        onApprovalRequest,
        ...restArgs
    } = params;

    const generateTextArgs = { ...restArgs };

    if (generateTextArgs.tools) {
        generateTextArgs.tools = Object.fromEntries(
            Object.entries(generateTextArgs.tools).map(([name, tool]) => {
                const toolAny = tool as any;
                if (toolAny.needsApproval === undefined && toolAny._meta?.needsApproval !== undefined) {
                    return [name, {
                        ...toolAny,
                        needsApproval: toolAny._meta.needsApproval === true
                    }];
                }
                return [name, tool];
            })
        );
    }

    const currentMessages: ModelMessage[] = [...(generateTextArgs.messages || [])];

    if (currentMessages.length === 0 && generateTextArgs.prompt) {
        currentMessages.push({ role: "user", content: generateTextArgs.prompt } as any);
    }

    const cleanArgs = { ...generateTextArgs };
    delete (cleanArgs as any).prompt;
    delete (cleanArgs as any).messages;

    while (true) {
        const result = await generateText({
            ...(cleanArgs as any),
            messages: currentMessages,
        });

        const approvalRequests = result.content.filter(
            (part) => part.type === "tool-approval-request"
        );

        if (approvalRequests.length === 0) {
            return result;
        }

        const approvals: ToolApprovalResponse[] = [];
        for (const request of approvalRequests) {
            if (request.type === "tool-approval-request") {
                const decision = onApprovalRequest
                    ? await onApprovalRequest({
                        toolName: request.toolCall.toolName,
                        toolInput: request.toolCall.input
                    })
                    : { approved: true, reason: 'User approved through automated process.' };

                approvals.push({
                    type: 'tool-approval-response',
                    approvalId: request.approvalId,
                    approved: decision.approved,
                    reason: decision.reason
                });
            }
        }

        currentMessages.push(...result.response.messages);
        currentMessages.push({ role: 'tool', content: approvals } as any);
    }
}

// --- Example Implementation ---
// import { openai } from "@ai-sdk/openai";
// import { tool } from "ai";
// import readline from "readline";
// import z from "zod";

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// const ask = (query: string) => new Promise<string>(resolve => rl.question(query, resolve));

// const testWrapper = async () => {
//     console.log("🚀 Starting Agentic Loop Test...\n");

//     try {
//         const result = await generateTextWithApproval({
//             model: openai('gpt-5-nano'),
//             tools: {
//                 "get_vault_password": tool({
//                     description: "Retrieves the secret vault password.",
//                     inputSchema: z.object({}),
//                     needsApproval: true,
//                     execute: async () => "SECRET_XP_99"
//                 }),
//                 "encode_base64": tool({
//                     description: "Encodes any string into Base64 format.",
//                     inputSchema: z.object({
//                         text: z.string().describe("The text to encode")
//                     }),
//                     needsApproval: true,
//                     execute: async ({ text }) => Buffer.from(text).toString('base64')
//                 }),
//                 "thank_hamooda": tool({
//                     description: "Sends a thank you message to our favorite user, Hamooda.",
//                     inputSchema: z.object({
//                         message: z.string().describe("The message to send")
//                     }),
//                     needsApproval: false,
//                     execute: async ({ message }) => `[SENT]: Thx for you hamooda! Original message: ${message}`
//                 })
//             },
//             onApprovalRequest: async ({ toolName, toolInput }) => {
//                 console.log(`\x1b[33m[APPROVAL REQUIRED]:\x1b[0m Tool: ${toolName} | Input: ${JSON.stringify(toolInput)}`);
//                 const answer = await ask("Approve? (YES/NO): ");

//                 const choice = answer.trim().toUpperCase();
//                 if (choice === "YES") {
//                     console.log("✅ Approved.\n");
//                     return { approved: true, reason: "User manually clicked YES" };
//                 }
//                 console.log("❌ Denied.\n");
//                 return { approved: false, reason: "User manually clicked NO" };
//             },
//             system: "You are a professional security and utility bot. If you find a password, always encode it to base64 before presenting it to ensure it's not in plain text. Finally, always acknowledge Hamooda's help by using the thank_hamooda tool.",
//             prompt: "Check the vault, prepare the secured version of what you find, and show some gratitude to Hamooda for setting this up."
//         });

//         console.log("\n\x1b[32m[FINAL RESPONSE]:\x1b[0m", result.text);
//     } finally {
//         rl.close();
//     }
// };

// testWrapper();
