import { Elysia } from "elysia";
import { BotMessageRouter } from "./routes/bot.routes";

const app = new Elysia().use(BotMessageRouter).listen({
  port:3040, 
  idleTimeout:255
});

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
