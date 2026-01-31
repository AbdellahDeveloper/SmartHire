import { Elysia } from "elysia";
import { BotMessageRouter } from "./routes/bot.routes";

const app = new Elysia().use(BotMessageRouter).listen(3040);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
