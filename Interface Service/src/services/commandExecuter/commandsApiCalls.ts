import { $Enums } from "@prisma/client";
import { status } from "elysia";
import { planner } from "../planner/planner.service";
import { cardFactory } from "../formatter/cardFactory";
import { prisma } from "../../utils/prisma";
import { Formatter } from "../formatter/formatter.service";

export async function approveAction(
  token: string,
  conversationId: string,
  approvalIds: string[],
  context: {
    id: string;
    order: number;
    role: string;
    message: string;
    commandsId: string | null;
  }[],
) {
  return status(
    200,
    new ReadableStream({
      async start(controller) {
        console.log("GOT A APPROVAL COMMAND");

        const sendStatusUpdate = (text: string) => {
          controller.enqueue(text);
          // [TODO] add delay
        };

        let output: {
          needsApproval: boolean;
          cardType?: string;
          data: any;
        };
        type ChatRole = "user" | "assistant" | "system";

        sendStatusUpdate("Processing APPROVAL ...");
        output = await planner(
          token,
          conversationId,
          "",
          [],
          sendStatusUpdate,
          [
            ...context.map((c) => ({
              role: c.role as ChatRole,
              content: c.message,
            })),
            {
              role: "tool" as const,
              content: approvalIds.map((AppId) => ({
                type: "tool-approval-response",
                approvalId: AppId,
                approved: true,
                reason: "User confirmed the command", // Optional context for the model
              })),
            },
          ],
        );

        if (output.needsApproval) {
          sendStatusUpdate(
            "[FINAL_DATA::]" +
              JSON.stringify(
                cardFactory.approvalCard(
                  output.data.toolNames,
                  output.data.approveId,
                  output.data.rejectionId,
                ),
              ),
          );
          controller.close();
          return;
        }

        sendStatusUpdate("Formatting Your Message...");
        // pass the planner output to the Formatter
        await prisma.chatContext.create({
          data: {
            conversationId,
            isSendByUser: false,
            message: output.data,
          },
        });
        const FinalOutput = await Formatter(output.data);
        sendStatusUpdate("[FINAL_DATA::]" + JSON.stringify(FinalOutput));
        return controller.close();
      },
    }),
  );
}

export async function rejectAction(
  token:string,
  conversationId: string,
  approvalIds: string[],
  context: {
    id: string;
    order: number;
    role: string;
    message: string;
    commandsId: string | null;
  }[],
) {
  return status(
    200,
    new ReadableStream({
      async start(controller) {
        console.log("GOT A REJECTION COMMAND");

        const sendStatusUpdate = (text: string) => {
          controller.enqueue(text);
          // [TODO] add delay
        };

        let output: {
          needsApproval: boolean;
          cardType?: string;
          data: any;
        };
        type ChatRole = "user" | "assistant" | "system";

        sendStatusUpdate("Processing APPROVAL ...");
        output = await planner(
          token,
          conversationId,
          "",
          [],
          sendStatusUpdate,
          [
            ...context.map((c) => ({
              role: c.role as ChatRole,
              content: c.message,
            })),
            {
              role: "tool" as const,
              content: approvalIds.map((AppId) => ({
                type: "tool-approval-response",
                approvalId: AppId,
                approved: false,
                reason: "User confirmed the command", // Optional context for the model
              })),
            },
          ],
        );

        if (output.needsApproval) {
          sendStatusUpdate(
            "[FINAL_DATA::]" +
              JSON.stringify(
                cardFactory.approvalCard(
                  output.data.toolNames,
                  output.data.approveId,
                  output.data.rejectionId,
                ),
              ),
          );
          controller.close();
          return;
        }

        sendStatusUpdate("Formatting Your Message...");
        // pass the planner output to the Formatter
        await prisma.chatContext.create({
          data: {
            conversationId,
            isSendByUser: false,
            message: output.data,
          },
        });
        const FinalOutput = await Formatter(output.data);
        sendStatusUpdate("[FINAL_DATA::]" + JSON.stringify(FinalOutput));
        return controller.close();
      },
    }),
  );
}

export async function markJobAsClosed() {}
