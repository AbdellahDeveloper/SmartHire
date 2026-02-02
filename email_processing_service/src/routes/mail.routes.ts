import { Elysia, t } from 'elysia'
import { processEmailAccount } from '../cron/email.cron'
import { prisma } from '../db'
import { mcpAuth } from '../mcp-auth.middleware'

export const mailRoutes = new Elysia({ prefix: '/mail' })
    .use(mcpAuth)
    .post('/addUserMail', async ({ body, companyId }) => {
        const { server, port, email, password } = body

        const userMail = await prisma.userMail.create({
            data: {
                server,
                port,
                email,
                password,
                companyId: companyId!,
                lastChecked: new Date()
            }
        })

        return {
            success: true,
            data: userMail
        }
    }, {
        body: t.Object({
            server: t.String(),
            port: t.Number(),
            email: t.String(),
            password: t.String()
        })
    })
    .post("/sync", async ({ companyId, set }) => {
        try {
            const accounts = await prisma.userMail.findMany({
                where: { companyId: companyId! }
            });

            if (accounts.length === 0) {
                set.status = 404;
                return { success: false, error: "No email accounts found for this company" };
            }

            for (const account of accounts) {
                await processEmailAccount(account, true);
            }

            return { success: true, message: "Email Sync completed" };
        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    })
