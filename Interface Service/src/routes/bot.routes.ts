import { Elysia } from "elysia";
import { commandHandler, messageHandler } from "../controllers/bot.controller";
import { CommandReqSchema, messageReqSchema } from "../types/bot";

export const BotMessageRouter = new Elysia().post(
  "/onMessage", // get any messages sent by the HR
  ({ body }) => messageHandler(body),
  messageReqSchema,
);

export const BotCommandRouter = new Elysia().post(
  "/onCommand", // get any messages sent by the HR
  ({ body }) => commandHandler(body),
  CommandReqSchema,
);
