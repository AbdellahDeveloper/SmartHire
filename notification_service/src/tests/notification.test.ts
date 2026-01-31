import { describe, expect, it, mock } from "bun:test";

// Mocking prisma
mock.module("../lib/prisma", () => ({
    prisma: {
        meeting: {
            findMany: async () => [
                { id: "1", summary: "Mock Meeting", startTime: new Date(Date.now() + 1800000), meetLink: "http://meet.com" }
            ]
        },
        job: {
            findMany: async () => [
                { id: "job-1", title: "Stale Job", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: "open" }
            ],
            findFirst: async () => ({ id: "job-1", title: "Latest Job" })
        },
        matchSession: {
            findFirst: async () => ({ id: "session-1", jobId: "job-1" })
        },
        matchResult: {
            findMany: async () => [
                { id: "res-1", score: 90, candidateId: "cand-1", sessionId: "session-1" }
            ]
        }
    }
}));

// Mocking email
mock.module("../lib/email", () => ({
    sendNotification: async () => {
        console.log("Mock Email Sent");
        return { success: true };
    }
}));

import { notificationHandler } from "../handlers/notification.handler";

describe("Notification Service Tests", () => {
    it("should process bulk upload completion notification", async () => {
        const result = await notificationHandler.notifyBulkUploadComplete({
            body: { userId: "user-1", count: 10, status: "Finished" }
        });
        expect(result.success).toBe(true);
    });
});
