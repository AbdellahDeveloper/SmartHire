import { Elysia, t } from 'elysia'
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
