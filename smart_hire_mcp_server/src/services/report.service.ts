import { MatchResult } from "../tools/matching.types.js";
import { createServiceClient } from "./base.service.js";

const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || "http://localhost:3005/api";
const client = createServiceClient(REPORT_SERVICE_URL, 120000);

export const reportService = {
    generateContract: (data: { candidateId: string; jobId?: string; jobDescription?: string; date: string }) =>
        client.post("/reports/contract", data),
    generateMatchingReport: (data: { jobId: string; matchResults: MatchResult[] }) =>
        client.post("/reports/matching", data),
};
