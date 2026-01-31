import { createServiceClient } from "./base.service.js";

const CANDIDATE_SERVICE_URL = process.env.CANDIDATE_SERVICE_URL || "http://localhost:3002/api";
const client = createServiceClient(CANDIDATE_SERVICE_URL);

export const candidateService = {
    getCandidate: (id: string | number) => client.get(`/candidates/${id}`),
    createFromPdfUrl: (url: string, jobId?: string, updateIfExists?: boolean) =>
        client.post(`/candidates/from-url`, { url, jobId, updateIfExists }),
};
