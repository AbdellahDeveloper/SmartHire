import { generateText, Output } from 'ai'
import { getModel } from '../lib/ai-provider'
import prisma from '../lib/prisma'
import { jobAIRequestSchema, type JobAIRequest, type JobOffer } from '../models/job.schema'

export const createJob = async (data: any) => {
    console.log('[Job Service] Creating new job:', data.title)
    try {
        const job = await prisma.job.create({
            data: {
                companyId: data.companyId,
                title: data.title,
                seniorityLevel: data.seniority_level,
                domain: data.domain,
                industry: data.industry,
                location: data.location,
                workMode: data.work_mode,
                employmentType: data.employment_type,
                salaryMin: data.salary_min ?? 0,
                salaryMax: data.salary_max ?? 0,
                salaryCurrency: data.salary_currency || 'USD',
                description: data.description,
                responsibilities: data.responsibilities ?? null,
                educationLevel: data.education_level ?? null,
                skills: data.skills || [],
                niceToHaveSkills: data.nice_to_have_skills || [],
                status: data.status || 'open'
            }
        })
        return { success: true, message: 'Job created', jobId: job.id, job }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export const extractJobData = async (file?: File, text?: string): Promise<{ success: boolean; data?: JobAIRequest; message?: string }> => {
    console.log('[Job Service] Extracting job data from', file ? 'PDF file' : 'text')
    try {
        let content: any[] = []

        if (file) {
            const buffer = await file.arrayBuffer()
            content.push({
                type: 'file' as const,
                data: new Uint8Array(buffer),
                mediaType: 'application/pdf'
            })
        } else if (text) {
            content.push({
                type: 'text' as const,
                text
            })
        } else {
            return { success: false, message: 'Either file or text must be provided' }
        }

        const model = await getModel()

        const { output: extractedData } = await generateText({
            model,
            output: Output.object({ schema: jobAIRequestSchema }),
            system: 'You are an HR expert. Extract job details into the specified structured format. Follow the field descriptions closely.',
            messages: [{ role: 'user', content }]
        })

        return { success: true, data: extractedData }
    } catch (error: any) {
        console.error("AI Extraction Error:", error);
        return { success: false, message: `Extraction failed: ${error.message}` }
    }
}

export const createJobFromUrl = async (url: string, companyId: string) => {
    console.log('[Job Service] Creating job from URL:', url)
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch job description from URL')

        const blob = await response.blob()
        const file = new File([blob], 'job_description.pdf', { type: 'application/pdf' })

        const extraction = await extractJobData(file)
        if (!extraction.success || !extraction.data) {
            return { success: false, message: extraction.message || 'Failed to extract job data' }
        }

        return await createJob({ ...extraction.data, companyId })
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export const listJobs = async (filters: {
    status?: string;
    q?: string;
    companyId?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
}) => {
    console.log('[Job Service] Listing all jobs with filters:', JSON.stringify(filters))
    try {
        const page = Number(filters.page) || 1
        const limit = Number(filters.limit) || 10
        const skip = (page - 1) * limit

        const where: any = {}
        if (filters.status) {
            where.status = filters.status
        }
        if (filters.companyId) {
            where.companyId = filters.companyId
        }
        if (filters.q) {
            where.OR = [
                { title: { contains: filters.q, mode: 'insensitive' } },
                { description: { contains: filters.q, mode: 'insensitive' } },
                { skills: { has: filters.q } }
            ]
        }

        if (filters.startDate || filters.endDate) {
            where.createdAt = {}
            if (filters.startDate) {
                where.createdAt.gte = new Date(filters.startDate)
            }
            if (filters.endDate) {
                where.createdAt.lte = new Date(filters.endDate)
            }
        }

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.job.count({ where })
        ])

        return {
            success: true,
            count: jobs.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            jobs
        }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export const getJobById = async (id: string, companyId: string) => {
    console.log('[Job Service] Getting job by ID:', id, 'for company:', companyId)
    try {
        const job = await prisma.job.findFirst({
            where: { id, companyId }
        })
        if (!job) return { success: false, message: 'Job not found or access denied' }
        return { success: true, job }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export const updateJob = async (id: string, companyId: string, data: Partial<JobOffer>) => {
    console.log('[Job Service] Updating job ID:', id, 'for company:', companyId)
    try {
        const updateData: any = {}
        // ... (data mapping remains same)
        if (data.title) updateData.title = data.title
        if (data.seniority_level) updateData.seniorityLevel = data.seniority_level
        if (data.domain) updateData.domain = data.domain
        if (data.industry) updateData.industry = data.industry
        if (data.location) updateData.location = data.location
        if (data.work_mode) updateData.workMode = data.work_mode
        if (data.employment_type) updateData.employmentType = data.employment_type
        if (data.salary_min !== undefined) updateData.salaryMin = data.salary_min
        if (data.salary_max !== undefined) updateData.salaryMax = data.salary_max
        if (data.salary_currency) updateData.salaryCurrency = data.salary_currency
        if (data.description) updateData.description = data.description
        if (data.responsibilities) updateData.responsibilities = data.responsibilities
        if (data.education_level) updateData.educationLevel = data.education_level
        if (data.skills) updateData.skills = data.skills
        if (data.nice_to_have_skills) updateData.niceToHaveSkills = data.nice_to_have_skills
        if (data.status) updateData.status = data.status

        const job = await prisma.job.update({
            where: { id, companyId },
            data: updateData
        })
        return { success: true, job }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export const deleteJob = async (id: string, companyId: string) => {
    console.log('[Job Service] Archiving/Deleting job ID:', id, 'for company:', companyId)
    try {
        const job = await prisma.job.update({
            where: { id, companyId },
            data: { status: 'archived' }
        })
        return { success: true, message: 'Job archived', jobId: job.id }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export const duplicateJob = async (id: string, companyId: string) => {
    console.log('[Job Service] Duplicating job ID:', id, 'for company:', companyId)
    try {
        const sourceJob = await prisma.job.findFirst({
            where: { id, companyId }
        })
        if (!sourceJob) return { success: false, message: 'Source job not found or access denied' }

        const { id: _, createdAt: __, updatedAt: ___, ...data } = sourceJob
        const newJob = await prisma.job.create({
            data: {
                ...data,
                title: `${sourceJob.title} (Copy)`,
                status: 'open'
            }
        })
        return { success: true, message: 'Job duplicated', jobId: newJob.id, job: newJob }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}
