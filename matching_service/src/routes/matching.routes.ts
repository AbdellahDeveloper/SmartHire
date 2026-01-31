import { Elysia, t } from "elysia";
import { findBestCandidates } from "../handlers/matching.handler";
import { mcpAuth } from "../lib/mcp-auth.middleware";

export const matchingRoutes = new Elysia({ prefix: "/matching" })
    .use(mcpAuth)

    .post("/match", async ({ body, companyId }) => {
        return findBestCandidates({ ...body, companyId: companyId! } as any);
    }, {
        body: t.Object({
            jobId: t.Optional(t.String()),
            jobDescription: t.Optional(t.String()),
            limit: t.Optional(t.Number()),
            strictness: t.Optional(t.String()),
            excludedSkills: t.Optional(t.Array(t.String()))
        })
    });
