import { Elysia, t } from "elysia";
import { startNotificationCron } from "./cron/notification.cron";
import { notificationHandler } from "./handlers/notification.handler";
import { mcpAuth } from "./lib/mcp-auth.middleware";

const app = new Elysia()
  .use(mcpAuth)
  .get("/", () => "Notification Service is running")
  .post("/notify/bulk-complete", async ({ body, companyId }) => {
    return await notificationHandler.notifyBulkUploadComplete({ body: { ...body as any, companyId: companyId! } });
  }, {
    body: t.Object({
      userId: t.String(),
      count: t.Number(),
      status: t.String()
    })
  })
  .get("/meeting-decision", async ({ query }) => {
    const { meetingId, action, matchId } = query;
    if (!meetingId || !action) return "Invalid request";
    if (action !== "accept" && action !== "reject") return "Invalid action";

    const result = await notificationHandler.handleMeetingDecision(meetingId, action);
    if (result.success) {
      return `
        <html>
          <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f4f9;">
            <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              <h1 style="color: #2563eb;">Action Successful</h1>
              <p style="color: #555;">The ${action} email has been sent to the candidate.</p>
              ${matchId ? `<p style="color: #888; font-size: 12px; margin-top: 10px;">Reference: ${matchId}</p>` : ''}
              <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background-color: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Close Window</button>
            </div>
          </body>
        </html>
      `;
    } else {
      return `Error: ${result.message}`;
    }
  }, {
    query: t.Object({
      meetingId: t.String(),
      action: t.String(),
      matchId: t.Optional(t.String())
    })
  })
  .listen(3015);

console.log(
  `🚀 Notification Service is running at ${app.server?.hostname}:${app.server?.port}`
);

// Start Cron Jobs
startNotificationCron();
