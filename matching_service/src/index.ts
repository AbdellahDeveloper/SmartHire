import { Elysia } from "elysia";
import { matchingRoutes } from "./routes/matching.routes";

const app = new Elysia()
  .group("/api", (app) => app.use(matchingRoutes))
  .get("/", () => ({ status: "online", service: "matching_service" }))
  .listen(3004);

console.log(
  `🦊 Matching Service is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
