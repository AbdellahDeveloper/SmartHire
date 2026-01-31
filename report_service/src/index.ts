import { Elysia } from "elysia";
import { reportRoutes } from "./routes/report.routes";

const app = new Elysia()
  .onError(({ code, error }) => {
    console.error(`[ELYSIA ERROR] ${code}:`, error);
    return { success: false, error: (error as any).message || 'Unknown error' };
  })
  .get("/", () => ({ status: "Report Service is running", timestamp: new Date().toISOString() }))
  .group("/api", (app) => app.use(reportRoutes))
  .listen(3005);

console.log(
  `🦊 Report Service is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
