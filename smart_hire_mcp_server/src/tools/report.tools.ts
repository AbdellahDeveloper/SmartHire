import { handleServiceError } from "../services/base.service.js";
import { reportService } from "../services/report.service.js";

export const reportToolDefinitions = [
    {
        name: "create_contract",
        description: "Generate an employment contract PDF for a candidate and a job",
        inputSchema: {
            type: "object",
            properties: {
                candidateId: { type: "string", description: "The ID of the candidate" },
                jobId: { type: "string", description: "The ID of the job (optional if jobDescription is provided)" },
                jobDescription: { type: "string", description: "The raw text of the job description (optional if jobId is provided)" },
                date: { type: "string", description: "The start date for the contract (e.g., '2024-02-01')" }
            },
            required: ["candidateId", "date"]
        },
        _meta: {
            needsApproval: true
        }
    },
    {
        name: "generate_matching_report",
        description: "Generate a matching report PDF for a job and its match results",
        inputSchema: {
            type: "object",
            properties: {
                jobId: { type: "string", description: "The ID of the job" },
                matchResults: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            candidateId: { type: "string" },
                            candidateName: { type: "string" },
                            currentJobTitle: { type: "string" },
                            score: { type: "number" },
                            analysis: {
                                type: "object",
                                properties: {
                                    score: { type: "number" },
                                    reasoning: { type: "string" },
                                    matchedSkills: { type: "array", items: { type: "string" } },
                                    missingSkills: { type: "array", items: { type: "string" } },
                                    seniorityAlignment: { type: "string" },
                                    experienceAlignment: { type: "string" }
                                },
                                required: ["score", "reasoning", "matchedSkills", "missingSkills", "seniorityAlignment", "experienceAlignment"]
                            }
                        },
                        required: ["candidateId", "candidateName", "currentJobTitle", "score", "analysis"]
                    },
                    description: "The list of match results"
                }
            },
            required: ["jobId", "matchResults"]
        }
    }
];

export const toolRegistry = {
    create_contract: {
        needsApproval: true,
        permissions: ["hr"],
        audit: true
    },
    generate_matching_report: {
        needsApproval: false
    }
};

export const handleReportTools = async (name: string, args: any) => {
    switch (name) {
        case "create_contract": {
            try {
                const response = await reportService.generateContract(args);
                const { url } = response.data;

                return {
                    content: [
                        {
                            type: "text",
                            text: `Contract generated successfully. You can download it here: ${url}`,
                        },
                    ],
                };
            } catch (error) {
                return handleServiceError(error);
            }
        }
        case "generate_matching_report": {
            try {
                const response = await reportService.generateMatchingReport(args);
                const { url, dbId } = response.data;

                return {
                    content: [
                        {
                            type: "text",
                            text: `Matching report generated successfully.\nSaved to Database with ID: ${dbId}\nLink: ${url}`,
                        },
                    ],
                };
            } catch (error) {
                return handleServiceError(error);
            }
        }
        default:
            return null;
    }
};
