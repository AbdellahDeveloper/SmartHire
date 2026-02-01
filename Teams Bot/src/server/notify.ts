import Elysia from "elysia";
import { sendNotification } from "./NotificationLogic/notification";
import { Attachment, CardFactory, MessageFactory } from "botbuilder";

export const NotificationHandler = new Elysia().post(
  "/notify",
  async ({ body }: any) => {
    console.log("GOT NOTIFICATION : ", body.message);

    await sendNotification(
      {
        activityId: body.id + "|0000001", // witch activity ID
        bot: {
          id: process.env.BOT_ID || "",
          name: process.env.BOT_NAME || "ABM_bot",
        },
        //@ts-ignore // its working trust me!
        conversation: {
          id: body.id, // why this is erroring
        },
        channelId: "webchat",
        serviceUrl: "https://webchat.botframework.com/",
      },
      body.message,
    );
    return { status: "success" };
  },
);
