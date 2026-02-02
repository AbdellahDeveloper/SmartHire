import { Elysia, sse, t } from 'elysia'
import {
    bulkCreateCandidates,
    createCandidate,
    createCandidateFromPdfUrl,
    getCandidateById,
    getDocumentType
} from '../handlers/candidate.handler'
import { mcpAuth } from '../lib/mcp-auth.middleware'

export const candidateRoutes = new Elysia({ prefix: '/candidates' })
    .use(mcpAuth)

    .get('/:id', ({ params: { id }, companyId }) => getCandidateById(id))

    .post('/', ({ body, companyId }) => {
        const { file, jobId, updateIfExists } = body
        return createCandidate(file, companyId!, jobId, updateIfExists === 'true' || updateIfExists === true)
    }, {
        body: t.Object({
            file: t.File(),
            companyId: t.Optional(t.String()),
            jobId: t.Optional(t.String()),
            updateIfExists: t.Optional(t.Union([t.Boolean(), t.String()]))
        })
    })

    .post('/from-url', ({ body, companyId }) => {
        const { url, jobId, updateIfExists } = body
        return createCandidateFromPdfUrl(url, companyId!, jobId, updateIfExists === 'true' || updateIfExists === true)
    }, {
        body: t.Object({
            url: t.String(),
            companyId: t.Optional(t.String()),
            jobId: t.Optional(t.String()),
            updateIfExists: t.Optional(t.Union([t.Boolean(), t.String()]))
        })
    })

    .post('/document-type', ({ body }) => {
        const { file } = body
        return getDocumentType(file)
    }, {
        body: t.Object({
            file: t.File()
        })
    })

    .post('/bulk', async function* ({ body, companyId }) {
        const { files, jobId, updateIfExists, background } = body
        const filesArray = Array.isArray(files) ? files : [files]
        const isUpdate = updateIfExists === 'true' || updateIfExists === true
        const isBackground = background === 'true' || background === true

        if (isBackground) {
            (async () => {
                console.log(`[BACKGROUND] Starting bulk processing for ${filesArray.length} files ${companyId ? `for company ${companyId}` : ""}...`);
                for await (const chunk of bulkCreateCandidates(filesArray, companyId!, jobId, isUpdate)) {
                    if (chunk.event === 'result') {
                        console.log(`[BACKGROUND] Result for #${chunk.data.index}: ${chunk.data.status} - ${chunk.data.fullName || chunk.data.message}`);
                    }
                }
                console.log(`[BACKGROUND] Bulk processing complete.`);
            })().catch(err => console.error(`[BACKGROUND] Error in background bulk processing:`, err));

            yield sse({ event: "info", data: { message: "Bulk processing started in background" } });
            return;
        }

        for await (const chunk of bulkCreateCandidates(filesArray, companyId!, jobId, isUpdate)) {
            yield sse(chunk)
        }
    }, {
        body: t.Object({
            files: t.Union([t.File(), t.Array(t.File())]),
            companyId: t.Optional(t.String()),
            jobId: t.Optional(t.String()),
            updateIfExists: t.Optional(t.Union([t.Boolean(), t.String()])),
            background: t.Optional(t.Union([t.Boolean(), t.String()]))
        })
    })


