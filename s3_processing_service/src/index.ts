import { Elysia } from "elysia";
import { startS3Cron } from "./cron/s3.cron";
import { s3Routes } from "./routes/s3.routes";

const app = new Elysia()
  .get("/", () => "S3 Processing Service is running")
  .use(s3Routes)
  .listen(3005); // Port 3005 for S3 service

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// Start the cron job
startS3Cron();
