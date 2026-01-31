import { handleServiceError } from "../services/base.service.js";
import { candidateService } from "../services/candidate.service.js";

export const candidateToolDefinitions = [
    {
        name: "get_candidate",
        description: "Get comprehensive candidate details by 24 characters candidate ID",
        inputSchema: {
            type: "object",
            properties: { id: { type: "string", description: "The unique candidate ID" } },
            required: ["id"],
        },
    },
    {
        name: "create_candidate_from_pdf_url",
        description: "Create a new candidate by extracting details from a CV PDF URL",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string", description: "The public URL of the candidate's CV PDF" },
                jobId: { type: "string", description: "Optional Job ID to associate the candidate with" },
                updateIfExists: { type: "boolean", description: "Whether to update the candidate if they already exist" }
            },
            required: ["url"],
        },
    },
];

export const handleCandidateTools = async (name: string, args: any) => {
    try {
        let response;
        switch (name) {
            case "get_candidate":
                response = await candidateService.getCandidate(args.id);
                break;
            case "create_candidate_from_pdf_url":
                response = await candidateService.createFromPdfUrl(args.url, args.jobId, args.updateIfExists);
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
