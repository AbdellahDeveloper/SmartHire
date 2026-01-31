import { Elysia, t } from 'elysia'
import {
    createJob,
    createJobFromUrl,
    deleteJob,
    duplicateJob,
    getJobById,
    listJobs,
    updateJob
} from '../handlers/job.handler'
import { mcpAuth } from '../lib/mcp-auth.middleware'

const jobPayload = t.Object({
    title: t.String(),
    seniority_level: t.Enum({
        junior: 'junior',
        mid: 'mid',
        senior: 'senior',
        lead: 'lead',
        staff: 'staff',
        principal: 'principal'
    }),
    domain: t.String(),
    industry: t.String(),
    location: t.String(),
    work_mode: t.Enum({
        remote: 'remote',
        hybrid: 'hybrid',
        onsite: 'onsite'
    }),
    employment_type: t.Enum({
        full_time: 'full-time',
        part_time: 'part-time',
        contract: 'contract',
        internship: 'internship'
    }),
    salary_min: t.Optional(t.Number()),
    salary_max: t.Optional(t.Number()),
    salary_currency: t.Optional(t.String()),
    description: t.String(),
    responsibilities: t.Optional(t.String()),
    education_level: t.Optional(t.String()),
    skills: t.Optional(t.Array(t.String())),
    nice_to_have_skills: t.Optional(t.Array(t.String())),
    status: t.Optional(t.Enum({
        open: 'open',
        closed: 'closed',
        archived: 'archived'
    }))
})

export const jobRoutes = new Elysia({ prefix: '/jobs' })
    .use(mcpAuth)

    .get('/', ({ query, companyId }) => listJobs({ ...query, companyId: companyId! }), {
        query: t.Object({
            status: t.Optional(t.String()),
            q: t.Optional(t.String()),
            page: t.Optional(t.Numeric()),
            limit: t.Optional(t.Numeric()),
            startDate: t.Optional(t.String()),
            endDate: t.Optional(t.String())
        })
    })
    .get('/:id', ({ params: { id }, companyId }) => getJobById(id, companyId!))

    .post('/', ({ body, companyId }) => createJob({ ...body, companyId: companyId! }), {
        body: jobPayload
    })
    .post('/from-pdf-url', ({ body, companyId }) => createJobFromUrl(body.url, companyId!), {
        body: t.Object({
            url: t.String({ format: 'uri' })
        })
    })
    .patch('/:id', ({ params: { id }, body, companyId }) => updateJob(id, companyId!, body as any), {
        body: t.Partial(jobPayload)
    })
    .delete('/:id', ({ params: { id }, companyId }) => deleteJob(id, companyId!))
    .post('/:id/duplicate', ({ params: { id }, companyId }) => duplicateJob(id, companyId!))
