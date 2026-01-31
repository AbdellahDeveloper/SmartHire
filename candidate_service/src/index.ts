import { Elysia } from 'elysia';
import { mcpAuth } from './lib/mcp-auth.middleware';
import { candidateRoutes } from './routes/candidate.routes';

const app = new Elysia()
    .use(mcpAuth)
    .onError(({ code, error }) => {
        console.error(`[ELYSIA ERROR] ${code}:`, error);
        return { success: false, error: (error as any).message || 'Unknown error' };
    })
    .get('/', () => 'OK')
    .group('/api', (app) => app.use(candidateRoutes))
    .listen({
        port: 3002,
        maxRequestBodySize: 1024 * 1024 * 50
    })

console.log(
    `🦊 Candidate Service is running at ${app.server?.hostname}:${app.server?.port}`
)

export type App = typeof app
