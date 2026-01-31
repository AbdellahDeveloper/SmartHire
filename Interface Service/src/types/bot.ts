import { t } from "elysia";

export type messageReq = {
  conversationId: string;
  message: string;
  attachments: string[];
  userId: string;
};

export const messageReqSchema = {
  body: t.Object({
    conversationId: t.String(),
    message: t.String(),
    attachments: t.Any(),
    userId: t.String(),
  }),
};

export type commandReq = {
  conversationId: string;
  commandId: string;
  payload: any;
};

export const CommandReqSchema = {
  body: t.Object({
    conversationId: t.String(),
    command: t.String(),
    payload: t.Any(),
  }),
};
