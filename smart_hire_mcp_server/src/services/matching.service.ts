import { createServiceClient } from "./base.service.js";

const MATCHING_SERVICE_URL = process.env.MATCHING_SERVICE_URL || "http://localhost:3004/api";
const client = createServiceClient(MATCHING_SERVICE_URL, 60000);

export const matchingService = {
    matchCandidates: (data: any) => client.post("/matching/match", data),
};
