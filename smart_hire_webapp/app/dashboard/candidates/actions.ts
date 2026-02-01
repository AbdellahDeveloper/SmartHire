"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getCandidates(params: {
    query?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
}) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || (session.user as any).role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const { query, startDate, endDate, page = 1, pageSize = 10 } = params;

        const skip = (page - 1) * pageSize;

        const where: any = {};

        if (query) {
            where.OR = [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { country: { contains: query, mode: 'insensitive' } },
                { fullName: { contains: query, mode: 'insensitive' } }
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const [candidates, totalCount] = await Promise.all([
            prisma.candidate.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.candidate.count({ where })
        ]);

        return {
            success: true,
            candidates,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page
        };
    } catch (error: any) {
        console.error("Failed to fetch candidates:", error);
        return { success: false, error: error.message || "Failed to fetch candidates" };
    }
}
