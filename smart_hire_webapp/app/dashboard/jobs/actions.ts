"use server";

import { prisma } from "@/lib/prisma";

export async function getJobs(filters: {
    companyId?: string;
    q?: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.companyId) {
        where.companyId = filters.companyId;
    }
    if (filters.q) {
        where.OR = [
            { title: { contains: filters.q, mode: 'insensitive' } },
            { description: { contains: filters.q, mode: 'insensitive' } },
            { skills: { has: filters.q } }
        ];
    }
    if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.job.count({ where })
    ]);

    return {
        jobs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}

export async function getAllCompanies() {
    return await prisma.company.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });
}

export async function deleteJob(jobId: string) {
    return await prisma.job.delete({
        where: { id: jobId }
    });
}

interface JobCreationData {
    title: string;
    seniorityLevel: string;
    domain: string;
    industry?: string;
    location: string;
    workMode: string;
    employmentType: string;
    salaryMin: string;
    salaryMax: string;
    salaryCurrency?: string;
    description: string;
    responsibilities?: string;
    educationLevel?: string;
    skills: string; // comma separated
    niceToHaveSkills?: string; // comma separated
}

export async function createJob(companyId: string, data: JobCreationData) {
    return await prisma.job.create({
        data: {
            companyId,
            title: data.title,
            seniorityLevel: data.seniorityLevel,
            domain: data.domain,
            industry: data.industry || "Technology",
            location: data.location,
            workMode: data.workMode,
            employmentType: data.employmentType,
            salaryMin: parseFloat(data.salaryMin),
            salaryMax: parseFloat(data.salaryMax),
            salaryCurrency: data.salaryCurrency || "USD",
            description: data.description,
            responsibilities: data.responsibilities,
            educationLevel: data.educationLevel,
            skills: data.skills.split(",").filter(s => s.trim() !== "").map((s: string) => s.trim()),
            niceToHaveSkills: data.niceToHaveSkills ? data.niceToHaveSkills.split(",").filter(s => s.trim() !== "").map((s: string) => s.trim()) : [],
            status: "open"
        }
    });
}
