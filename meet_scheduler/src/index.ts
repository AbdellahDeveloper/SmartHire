import { cors } from "@elysiajs/cors";
import { html } from "@elysiajs/html";
import { Elysia } from "elysia";
import { authHandler, meetingHandler } from "./handlers/meetings.handler";
import { mcpAuth } from "./lib/mcp-auth.middleware";

const app = new Elysia()
  .use(cors())
  .use(html())
  .use(mcpAuth)
  .get("/", () => "Meet Scheduler API is running")
  .get("/connect-meeting-account", ({ companyId }) => { console.log(companyId); return authHandler.getAuthUrl({ companyId: companyId! }) })
  .get("/callback", async ({ query }) => {
    try {
      return await authHandler.handleCallback({ query: query as any });
    } catch (error: any) {
      return { error: error.message };
    }
  })
  .post("/schedule-meeting", async ({ body, companyId, companyName }) => {
    try {
      return await meetingHandler.scheduleMeeting({ body, companyId: companyId!, companyName: companyName! });
    } catch (error: any) {
      return { error: error.message };
    }
  })
  .post("/schedule-meeting/:id", async ({ params, body, companyId, companyName }) => {
    try {
      return await meetingHandler.scheduleMeeting({ params: params as { id: string }, body, companyId: companyId!, companyName: companyName! });
    } catch (error: any) {
      return { error: error.message };
    }
  })
  .listen(3012);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
