import { formatCandidate } from "./candidate.formatter.js";
import { formatJob, formatJobList } from "./job.formatter.js";
import { formatMatchResults } from "./matching.formatter.js";
import { formatReportResponse } from "./report.formatter.js";

export const teamsFormatter = {
    // Candidates
    get_candidate: formatCandidate,
    create_candidate_from_pdf_url: formatCandidate,

    // Jobs
    get_job: formatJob,
    create_job: formatJob,
    update_job: formatJob,
    duplicate_job: formatJob,
    create_job_from_pdf_url: formatJob,
    list_jobs: formatJobList,

    // Matching
    match_candidates_by_jobid: formatMatchResults,
    match_candidates_by_job_description: formatMatchResults,

    // Reports
    create_contract: (data: any) => formatReportResponse(data, "Employment Contract"),
    generate_matching_report: (data: any) => formatReportResponse(data, "Matching Report"),
};

export const createMetadataSection = (id: string, metadata: Record<string, any>) => {
    const facts = Object.entries(metadata)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => ({
            title: key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        }));

    if (facts.length === 0) return [];

    return [
        {
            type: "Container",
            id: id,
            isVisible: false,
            items: [
                {
                    type: "FactSet",
                    facts: facts
                }
            ]
        }
    ];
};

export const wrapInAdaptiveCard = (toolName: string, data: any) => {
    const formatter = (teamsFormatter as any)[toolName];
    if (formatter) {
        const card = formatter(data);
        return {
            content: [
                {
                    type: "text",
                    text: "Adaptive Card Response:",
                },
                {
                    type: "text",
                    text: JSON.stringify(card, null, 2),
                }
            ],
        };
    }

    // Fallback to JSON if no formatter found
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
};

