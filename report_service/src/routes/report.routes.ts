import { Elysia, t } from 'elysia';
import { generateContract, generateMatchingReport } from '../handlers/report.handler';
import { mcpAuth } from '../lib/mcp-auth.middleware';

export const reportRoutes = new Elysia({ prefix: '/reports' })
    .use(mcpAuth)
    .post('/contract', ({ body, companyId }) => generateContract({ ...body as any, companyId: companyId! }), {
        body: t.Object({
            candidateId: t.String(),
            jobId: t.Optional(t.String()),
            jobDescription: t.Optional(t.String()),
            date: t.String()
        })
    })
    .post('/matching', ({ body, companyId }) => generateMatchingReport({ ...body as any, companyId: companyId! }), {
        body: t.Object({
            jobId: t.String(),
            matchResults: t.Array(t.Any())
        })
    });
