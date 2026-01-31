"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay, subMonths } from "date-fns";
import { headers } from "next/headers";


export async function getDashboardData(companyId?: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const lastMonth = subMonths(now, 1);

    const whereClause = companyId ? { companyId } : {};

    const [
        activeJobs,
        totalCandidates,
        meetingsToday,
        activeJobsLastMonth,
        totalCandidatesLastMonth,
        recentActivity,
        totalCompanies,
        companies
    ] = await Promise.all([
        // current stats
        prisma.job.count({ where: { ...whereClause, status: "open" } }),
        prisma.candidate.count({ where: whereClause }),
        prisma.meeting.count({
            where: {
                ...whereClause,
                startTime: { gte: todayStart, lte: todayEnd }
            }
        }),

        // last month stats for comparison
        prisma.job.count({
            where: {
                ...whereClause,
                status: "open",
                createdAt: { lte: lastMonth }
            }
        }),
        prisma.candidate.count({
            where: {
                ...whereClause,
                createdAt: { lte: lastMonth }
            }
        }),

        // recent activity
        prisma.$transaction([
            prisma.matchResult.findMany({
                where: whereClause,
                take: 5,
                orderBy: { id: "desc" },
                include: { matchSession: true }
            }),
            prisma.candidate.findMany({
                where: whereClause,
                take: 5,
                orderBy: { createdAt: "desc" }
            }),
            prisma.job.findMany({
                where: whereClause,
                take: 5,
                orderBy: { createdAt: "desc" }
            })
        ]),

        // Only needed for admin
        !companyId ? prisma.company.count() : Promise.resolve(0),
        // Fetch all companies to map names for admins
        !companyId ? prisma.company.findMany({ select: { id: true, name: true } }) : Promise.resolve([])
    ]);

    const companyMap = new Map((companies as any[]).map(c => [c.id, c.name]));

    // Format recent activity
    const formattedActivity = [
        ...recentActivity[0].map((res: any) => ({
            type: "match",
            title: `New match for session ${res.sessionId}`,
            time: res.matchSession.createdAt,
            description: companyId ? `Candidate scored ${res.score}%` : `[${companyMap.get(res.companyId) || "Unknown"}] Candidate scored ${res.score}%`
        })),
        ...recentActivity[1].map((cand: any) => ({
            type: "candidate",
            title: `New candidate: ${cand.fullName}`,
            time: cand.createdAt,
            description: companyId ? `Applied for ${cand.currentJobTitle}` : `[${companyMap.get(cand.companyId) || "Unknown"}] Applied for ${cand.currentJobTitle}`
        })),
        ...recentActivity[2].map((job: any) => ({
            type: "job",
            title: `New job posted: ${job.title}`,
            time: job.createdAt,
            description: companyId ? `${job.location} | ${job.workMode}` : `[${companyMap.get(job.companyId) || "Unknown"}] ${job.location} | ${job.workMode}`
        }))
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);

    return {
        stats: {
            activeJobs: {
                value: activeJobs,
                change: activeJobsLastMonth > 0 ? Math.round(((activeJobs - activeJobsLastMonth) / activeJobsLastMonth) * 100) : 0
            },
            totalCandidates: {
                value: totalCandidates,
                change: totalCandidatesLastMonth > 0 ? Math.round(((totalCandidates - totalCandidatesLastMonth) / totalCandidatesLastMonth) * 100) : 0
            },
            meetingsToday: {
                value: meetingsToday,
                change: 0
            },
            totalCompanies: !companyId ? {
                value: totalCompanies,
                change: 0
            } : undefined
        },
        recentActivity: formattedActivity
    };
}


export async function uploadCandidates(formData: FormData) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {

        return { success: false, error: "Unauthorized" };
    }

    // Auth if admin OR has companyId
    const user = session.user as any;
    if (user.role !== 'admin' && !user.companyId) {
        return { success: false, error: "Unauthorized" };
    }
    formData.append("background", true.toString());
    const candidateServiceUrl = process.env.CANDIDATE_SERVICE_URL;
    if (!candidateServiceUrl) {
        return { success: false, error: "CANDIDATE_SERVICE_URL is not configured" };
    }

    if (user.companyId) {
        formData.append("companyId", user.companyId);
    }

    try {
        const response = await fetch(`${candidateServiceUrl}/candidates/bulk`, {
            method: "POST",
            body: formData,
        });


        if (!response.ok) {
            const error = await response.text();
            return { success: false, error: error || "Failed to upload candidates" };
        }

        return { success: true, message: "Upload request forwarded successfully" };
    } catch (error: any) {
        console.error("Error forwarding upload:", error);
        return { success: false, error: error.message || "An unexpected error occurred" };
    }
}
