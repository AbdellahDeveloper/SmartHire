import { Elysia } from 'elysia';
import { startEmailCron } from './cron/email.cron';
import { mailRoutes } from './routes/mail.routes';

const app = new Elysia()
  .onError(({ code, error }) => {
    console.error(`[ELYSIA ERROR] ${code}:`, error);
    return { success: false, error: (error as any).message || 'Unknown error' };
  })
  .get('/', ({ }) => 'Email Processing Service is running')
  .use(mailRoutes)
  .listen({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3005,
    maxRequestBodySize: 1024 * 1024 * 50
  })

console.log(
  `🦊 Email Processing Service is running at ${app.server?.hostname}:${app.server?.port}`
)

// Start the cron job
startEmailCron()

export type App = typeof app
