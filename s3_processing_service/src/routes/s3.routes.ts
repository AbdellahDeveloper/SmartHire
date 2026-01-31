import { Elysia, t } from "elysia";
import { prisma } from "../db";
import { mcpAuth } from "../mcp-auth.middleware";

export const s3Routes = new Elysia({ prefix: "/s3" })
    .use(mcpAuth)
    .post("/credentials", async ({ body, set, companyId }) => {
        try {
            const credential = await prisma.s3Credential.create({
                data: {
                    endpoint: body.endpoint,
                    region: body.region,
                    accessKey: body.accessKey,
                    secretKey: body.secretKey,
                    bucket: body.bucket,
                    companyId: companyId!,
                    lastChecked: body.lastChecked ? new Date(body.lastChecked) : new Date(0)
                }
            });
            return { success: true, data: credential };
        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            endpoint: t.String(),
            region: t.String(),
            accessKey: t.String(),
            secretKey: t.String(),
            bucket: t.String(),
            lastChecked: t.Optional(t.String())
        })
    })
    .get("/credentials", async ({ companyId }) => {
        return await prisma.s3Credential.findMany({
            where: { companyId: companyId! }
        });
    });
