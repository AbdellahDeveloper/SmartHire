import { matchingService } from "../services/matching.service.js";
import { handleServiceError } from "../services/base.service.js";

export const matchingToolDefinitions = [
    {
        name: "match_candidates_by_jobid",
        description: "Rank candidates against an existing job using its ID (recommended when you have a job ID)",
        inputSchema: {
            type: "object",
            properties: {
                jobId: { type: "string", description: "The ID of the job to match candidates against" },
                limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
                strictness: { type: "string", enum: ["flexible", "balanced", "strict"], default: "balanced" },
            },
            required: ["jobId"],
        },
    },
    {
        name: "match_candidates_by_job_description",
        description: "Rank candidates against a raw text job description (use this if the job is not yet saved)",
        inputSchema: {
            type: "object",
            properties: {
                jobDescription: { type: "string", description: "The raw text of the job description" },
                limit: { type: "number", minimum: 1, maximum: 50, default: 10 },
                strictness: { type: "string", enum: ["flexible", "balanced", "strict"], default: "balanced" },
            },
            required: ["jobDescription"],
        },
    },
];

export const handleMatchingTools = async (name: string, args: any) => {
    try {
        let response;
        switch (name) {
            case "match_candidates_by_jobid":
            case "match_candidates_by_job_description":
                response = await matchingService.matchCandidates(args);
                break;
            default:
                return null;
        }
        return {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
    } catch (error) {
        return handleServiceError(error);
    }
};
