import { openai } from "@ai-sdk/openai";
import { GetTools, ToolNameToDescription } from "./planner.tools";
import { ModelMessage, type ToolApprovalResponse } from "ai";

import { generateText, hasToolCall, stepCountIs, tool } from "ai";
import { MAX_ITERATIONS, MAX_RETRIES, SystemPrompt } from "./planner.config";
import { getContext } from "../../models/context";
import { prisma } from "../../utils/prisma";
import { getModel } from "../../models/ai-provider";

export async function planner(
  token: string,
  cId: string,
  message: string,
  attachments: { summaryOfWhatItIs: string; url: string }[],
  sendStatusUpdate: (text: string) => void,
  context?: ModelMessage[],
): Promise<{
  needsApproval: boolean;
  cardType?: string;
  data: any;
}> {
  // get the context of prev msgs
  const contextMessages = await getContext(cId);
  const messages: ModelMessage[] = !context
    ? [
        ...contextMessages,
        {
          role: "user",
          content:
            `HR say : ${message}` +
            (attachments.length
              ? `\n and included these attachments : ${attachments.map((att) => `\n\n - ${att.summaryOfWhatItIs} \nand the url : ${att.url}`).join()} `
              : ""),
        },
      ]
    : context;

  if (!message)
    return {
      needsApproval: false,
      data: "no message found",
    };
  console.log("starting AI");

  const response = await generateText({
    model: await getModel(),
    maxRetries: MAX_RETRIES,
    onStepFinish: (s) => {
      console.log(s?.toolCalls);
      sendStatusUpdate(
        "[step completed] " + s?.toolCalls
          ? s?.toolCalls[s?.toolCalls?.length - 1]?.toolName?.replaceAll("_"," ")
          : "",
      );
      // console.log("[step completed]", s.toolCalls); // we stream updates from here in a condition that we didnt hit the time out
    },
    stopWhen: stepCountIs(MAX_ITERATIONS),
    system: SystemPrompt,
    messages,
    providerOptions: {
      openai: {
        reasoningEffort: "minimal",
        // serviceTier :"priority"
      },
    },
    tools: await GetTools(token),
  });

  const approvalRequests = [];

  for (const part of response.content) {
    if (part.type === "tool-approval-request") {
      approvalRequests.push({
        approvalId: part.approvalId,
        toolName: part.toolCall.toolName,
      });
    }
  }

  if (approvalRequests.length) {
    const approveId = (
      await prisma.commands.create({
        data: {
          action: "APPROVE_ACTION",
          context: JSON.stringify([...message, ...response.response.messages]),
          ApprovalIds: approvalRequests.map((c) => c.approvalId).join(";"),
        },
      })
    ).id;
    const rejectionId = (
      await prisma.commands.create({
        data: {
          action: "REJECT_ACTION",
          context: JSON.stringify([...message, ...response.response.messages]), // i know its dump
          ApprovalIds: approvalRequests.map((c) => c.approvalId).join(";"),
        },
      })
    ).id;

    return {
      needsApproval: true,
      cardType: "approvalCard",
      data: {
        approveId,
        rejectionId,
        toolNames: approvalRequests.map(
          (a) => ToolNameToDescription[a.toolName],
        ),
      },
    };
  }

  const approvals: ToolApprovalResponse[] = [];

  for (const part of response.content) {
    // response.toolCalls[0].toolName to get tool name
    if (part.type === "tool-approval-request") {
      const response: ToolApprovalResponse = {
        type: "tool-approval-response",
        approvalId: part.approvalId,
        approved: true,
        reason: "User confirmed the command", // Optional context for the model
      };
      approvals.push(response);
    }
  }

  // // add approvals to messages
  messages.push({ role: "tool", content: approvals });
  return {
    needsApproval: false,
    data: response.output,
  };
  // return the structured response and data ready to me saved to DB and to be passed to to formatter
}

// export type GenerateTextWithMCPParams = Parameters<typeof generateText>[0] & {
//     onApprovalRequest?: (params: {
//         approvalId: string;
//         toolName: string;
//         toolInput: unknown;
//     }) => Promise<{ approved: boolean; reason?: string }>;
// };

// export async function generateTextWithApproval(params: GenerateTextWithMCPParams) {
//     const {
//         onApprovalRequest,
//         ...restArgs
//     } = params;

//     const generateTextArgs = { ...restArgs };

//     if (generateTextArgs.tools) {
//         generateTextArgs.tools = Object.fromEntries(
//             Object.entries(generateTextArgs.tools).map(([name, tool]) => {
//                 const toolAny = tool as any;
//                 if (toolAny.needsApproval === undefined && toolAny._meta?.needsApproval !== undefined) {
//                     return [name, {
//                         ...toolAny,
//                         needsApproval: toolAny._meta.needsApproval === true
//                     }];
//                 }
//                 return [name, tool];
//             })
//         );
//     }

//     const currentMessages: ModelMessage[] = [...(generateTextArgs.messages || [])];

//     if (currentMessages.length === 0 && generateTextArgs.prompt) {
//         currentMessages.push({ role: "user", content: generateTextArgs.prompt } as any);
//     }

//     const cleanArgs = { ...generateTextArgs };
//     delete (cleanArgs as any).prompt;
//     delete (cleanArgs as any).messages;

//     while (true) {
//         const result = await generateText({
//             ...(cleanArgs as any),
//             messages: currentMessages,
//         });

//         const approvalRequests = result.content.filter(
//             (part) => part.type === "tool-approval-request"
//         );

//         if (approvalRequests.length === 0) {
//             return result;
//         }

//         const approvals: ToolApprovalResponse[] = [];
//         for (const request of approvalRequests) {
//             if (request.type === "tool-approval-request") {
//                 const decision = onApprovalRequest
//                     ? await onApprovalRequest({
//                         approvalId: request.approvalId,
//                         toolName: request.toolCall.toolName,
//                         toolInput: request.toolCall.input
//                     })
//                     : { approved: true, reason: 'User approved through automated process.' };

//                 approvals.push({
//                     type: 'tool-approval-response',
//                     approvalId: request.approvalId,
//                     approved: decision.approved,
//                     reason: decision.reason
//                 });
//             }
//         }

//         currentMessages.push(...result.response.messages);
//         currentMessages.push({ role: 'tool', content: approvals } as any);
//     }
// }
