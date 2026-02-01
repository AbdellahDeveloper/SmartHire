import axios from "axios";
import {
  ActivityLike,
  ConversationReference,
  MessageActivity,
  SentActivity,
} from "@microsoft/teams.api";
import { App } from "@microsoft/teams.apps";
const decoder = new TextDecoder("utf-8");

export function main() {
  const app = new App({
    clientId: process.env.CLIENT_ID || "",
    clientSecret:
      process.env.CLIENT_SECRET || "",
    tenantId: process.env.TENANT_ID || "",
  });

  app.on("install.add", async ({ send, activity }) => {
    await send("Here is your conservation ID : " + activity.conversation.id);
  });

  app.on("message", async ({ send, activity }) => {
    const conversationId = activity.conversation.id;
    console.log(conversationId, "DID SEND A Message");
    let processingOrder = 1;

    // ignore typing messages
    if (activity.type !== "message") return;

    if (activity.value) {
      // send a command :
      const cmdResponse = await axios.post(
        process.env.INTERFACE_URL + "/onCommand",
        {
          conversationId,
          commandId: activity.value.data.key,
          payload: activity.value,
        },
        { responseType: "stream" },
      );
    } else {
      // send a message :
      const messageResponse = await axios.post(
        process.env.INTERFACE_URL + "/onMessage",
        {
          conversationId,
          message: activity.text,
          attachments: activity.attachments,
          userId: activity.from.id,
        },
        { responseType: "stream" },
      );

      let finalData: string | null = null;
      let AId = "";
      messageResponse.data.on("data", async (chunk: string) => {
        const text = chunk.toString().trim();
        let NewAId: string;
        if (text.startsWith("[FINAL_DATA::]")) {
          NewAId = await streamUpdates(
            send,
            processingOrder,
            "Processing",
            AId || undefined,
          );
          const json = text.replace("[FINAL_DATA::]", "");
          finalData = JSON.parse(json);
        } else if (text.startsWith("[FINAL_DATA:]")) {
          NewAId = await streamUpdates(
            send,
            processingOrder,
            "Processing",
            AId || undefined,
          );
          finalData = text.replace("[FINAL_DATA:]", "");
        } else {
          // console.log("🔄 Progress:", text);
          NewAId = await streamUpdates(
            send,
            processingOrder,
            text,
            AId || undefined,
          );
        }
        processingOrder++;
        AId = AId || NewAId;
      });

      messageResponse.data.on("end", async () => {
        const c = await new Promise((res) => {
          const c = setInterval(() => {
            if (AId) res(c);
          }, 300);
        });
        clearInterval(c as any);

        await streamFinish(
          send,
          finalData || "Sorry. No message has been Generated!",
          AId,
        );
      });
    }
  });

  // app.on("install.add") // to store user - conversation ID
  app.start(3978).then((_) => console.log("started"));

  // streaming functions
  type SendFunc = (
    activity: ActivityLike,
    conversationRef?: ConversationReference,
  ) => Promise<SentActivity>;
  async function streamUpdates(
    send: SendFunc,
    order: number,
    status: string,
    activityId?: string,
  ) {
    const s = await send({
      type: "typing",
      text: status,
      entities: [
        {
          type: "streaminfo",
          streamId: activityId,
          streamType: "informative",
          streamSequence: order || undefined,
        },
      ],
      channelData: {
        streamId: activityId,
        streamType: "informative",
        streamSequence: order || undefined,
      },
    });

    return s.id;
  }
  async function streamFinish(
    send: SendFunc,
    message: string | any,
    activityId?: string,
  ) {
    if (typeof message === "string") {
      const s = await send({
        type: "message",
        text: message,
        entities: [
          {
            type: "streaminfo",
            streamId: activityId,
            streamType: "final",
          },
        ],
        channelData: {
          streamId: activityId,
          streamType: "final",
        },
      });

      return s.id;
    }
    const s = await send({
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: message,
        },
      ],
      entities: [
        {
          type: "streaminfo",
          streamId: activityId,
          streamType: "final",
        },
      ],
      channelData: {
        streamId: activityId,
        streamType: "final",
      },
    });

    return s.id;
  }
}
