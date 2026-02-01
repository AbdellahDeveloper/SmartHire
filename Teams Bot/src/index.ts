import { Elysia } from "elysia";
import { NotificationHandler } from "./server/notify";
import { main as _ } from "./bot/teamsBot";
import axios from "axios";
_();
const app = new Elysia()
  .use(NotificationHandler)
  .listen(3333);

console.log(
  `server is running at ${app.server?.hostname}:${app.server?.port}`,
);
