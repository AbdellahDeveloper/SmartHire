"use server";

import { prisma } from "@/lib/prisma";

export async function getLogs(role: string, companyId?: string, filters?: { query?: string, type?: string, startDate?: Date, endDate?: Date, companyId?: string }) {
    const where: any = {};
    if (role !== "admin" && companyId) {
        where.companyId = companyId;
    } else if (role === "admin" && filters?.companyId) {
        where.companyId = filters.companyId;
    }

    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [results, reports, meetings, serviceLogs] = await Promise.all([
        (!filters?.type || filters.type === "MATCH_RESULT") ? prisma.matchResult.findMany({
            where: where,
            include: {
                matchSession: true
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        }) : Promise.resolve([]),
        (!filters?.type || filters.type === "MATCH_REPORT") ? prisma.matchingReport.findMany({
            where: where,
            orderBy: { createdAt: 'desc' },
            take: 100
        }) : Promise.resolve([]),
        (!filters?.type || filters.type === "MEETING") ? prisma.meeting.findMany({
            where: where,
            orderBy: { createdAt: 'desc' },
            take: 100
        }) : Promise.resolve([]),
        (!filters?.type || filters.type === "SERVICE_LOG") ? prisma.serviceLog.findMany({
            where: where,
            orderBy: { createdAt: 'desc' },
            take: 100
        }) : Promise.resolve([])
    ]);

    // Format logs into a unified structure
    const formattedResults = results.map(r => ({
        id: r.id,
        type: "MATCH_RESULT",
        title: "Candidate Matched",
        description: `Candidate scored ${r.score.toFixed(1)}%`,
        date: r.createdAt,
        details: r.analysis,
        companyId: r.companyId
    }));

    const formattedReports = reports.map(r => ({
        id: r.id,
        type: "MATCH_REPORT",
        title: "Matching Report Generated",
        description: `Report available for download`,
        date: r.createdAt,
        details: { url: r.url, bucket: r.bucket, s3Key: r.s3Key },
        companyId: r.companyId
    }));

    const formattedMeetings = meetings.map(m => ({
        id: m.id,
        type: "MEETING",
        title: "Meeting Scheduled",
        description: m.summary,
        date: m.createdAt,
        details: {
            startTime: m.startTime,
            endTime: m.endTime,
            meetLink: m.meetLink,
            description: m.description
        },
        companyId: m.companyId
    }));

    const formattedServiceLogs = serviceLogs.map(s => ({
        id: s.id,
        type: "SERVICE_LOG",
        title: `${s.service} ${s.action === 'MANUAL' ? 'Manual Sync' : 'Cron Job'}`,
        description: s.message,
        date: s.createdAt,
        details: {
            service: s.service,
            action: s.action,
            status: s.status,
            fileName: s.fileName
        },
        companyId: s.companyId
    }));

    let allLogs = [...formattedResults, ...formattedReports, ...formattedMeetings, ...formattedServiceLogs];

    // Final in-memory filter for query if prisma didn't handle it well for json
    if (filters?.query) {
        const q = filters.query.toLowerCase();
        allLogs = allLogs.filter(log =>
            log.title.toLowerCase().includes(q) ||
            log.description.toLowerCase().includes(q) ||
            JSON.stringify(log.details).toLowerCase().includes(q)
        );
    }

    return allLogs.sort((a, b) => b.date.getTime() - a.date.getTime());
}
