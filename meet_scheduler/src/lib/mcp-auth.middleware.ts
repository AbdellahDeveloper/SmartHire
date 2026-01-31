import { Elysia } from 'elysia'
import { prisma } from './prisma'

export const mcpAuth = (app: Elysia) =>
    app.derive(async ({ request, set }) => {
        const authHeader = request.headers.get('Authorization')

        if (!authHeader) {
            return { companyId: null }
        }

        const token = authHeader.replace('Bearer ', '').trim()

        try {
            const company = await prisma.company.findUnique({
                where: { mcpToken: token },
                select: { id: true, name: true }
            })

            if (!company) {
                return { companyId: null, companyName: null }
            }

            return {
                companyId: company.id,
                companyName: company.name
            }
        } catch (error) {
            console.error('[MCP AUTH ERROR]', error)
            return { companyId: null, companyName: null }
        }
    })
        .onBeforeHandle(({ companyId, set, request }) => {
            const url = new URL(request.url)
            if (url.pathname === '/' || url.pathname === '/api' || url.pathname.startsWith('/callback')) return;

            if (!companyId) {
                set.status = 401
                return { success: false, error: 'Unauthorized: Invalid or missing MCP Token' }
            }
        })
