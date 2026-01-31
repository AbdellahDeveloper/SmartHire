import { ModelMessage } from "ai";
import { prisma } from "../utils/prisma";

export async function saveMessage(Cid: string) {}

export async function getContext(
  Cid: string,
  limit = 10,
): Promise<ModelMessage[]> {
  const prevMessages = await prisma.chatContext.findMany({
    where: {
      conversationId: Cid,
    },
    orderBy: {
      sentAt: "desc",
    },
    take: limit,
  });
  prevMessages.reverse();
  const res = prevMessages.map(
    (msg) =>
      ({
        content: msg.message || "",
        role: msg.isSendByUser ? "user" : "assistant",
      }) as ModelMessage,
  );
  return res;
}
