import { planner } from "../services/planner/planner.service";
import { commandReq, messageReq } from "../types/bot";
import { Formatter } from "../services/formatter/formatter.service";
import { prisma } from "../utils/prisma";
import { runCommand } from "../services/commandExecuter/command.service";
import { cardFactory } from "../services/formatter/cardFactory";
import { GetTokenFromCid } from "../models/auth";
import { sse, status } from "elysia";
import { wait } from "../utils/utils";

export async function messageHandler(receivedMessage: messageReq) {
  console.log("GOT NEW MSG");

  // //auth layer
  let token;
  // token = await GetTokenFromCid(receivedMessage.conversationId);
  token = (
    await prisma.company.findFirst({
      where: {},
    })
  )?.mcpToken;

  if (!token) {
    return "[FINAL_DATA:] PLS create a company form the ADMIN UI";
  }

  // [TODO]
  // detach all the Attachments and store them and then pass them as a URL
  // it needs to validates if they are of supported formate (.pdf .txt )
  // extract attachments and store them In S3

  // save the message To context DB
  await prisma.chatContext.create({
    data: {
      conversationId: receivedMessage.conversationId,
      isSendByUser: true,
      message: receivedMessage.message,
    },
  });

  // Call the Planner in a streaming format
  return status(
    200,
    new ReadableStream({
      async start(controller) {
        const sendStatusUpdate = (text: string) => {
          controller.enqueue(text);
          // [TODO] add delay
        };

        let output: {
          needsApproval: boolean;
          cardType?: string;
          data: any;
        };
        sendStatusUpdate("AI is Reading Your Message...");
        output = await planner(
          token,
          receivedMessage.conversationId,
          receivedMessage.message,
          [],
          sendStatusUpdate,
        );
        await wait(300);
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
            conversationId: receivedMessage.conversationId,
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

export async function commandHandler(commandMessage: commandReq) {
  let token;
  // token = await GetTokenFromCid(receivedMessage.conversationId);
  token = (
    await prisma.company.findFirst({
      where: {},
    })
  )?.mcpToken;

  if (!token) {
    return "[FINAL_DATA:] PLS create a company form the ADMIN UI";
  }

  return await runCommand(
    token,
    commandMessage.conversationId,
    commandMessage.commandId,
    commandMessage.payload,
  );
}
