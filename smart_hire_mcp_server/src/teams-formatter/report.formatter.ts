import { createMetadataSection } from "./index.js";

export const formatReportResponse = (data: any, title: string) => {
    return {
        type: "AdaptiveCard",
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.5",
        body: [
            {
                type: "TextBlock",
                text: title,
                weight: "Bolder",
                size: "Medium",
            },
            {
                type: "TextBlock",
                text: data.text || "Report generated successfully.",
                wrap: true,
            },
            ...createMetadataSection(`metadata-report-${Math.random().toString(36).substr(2, 9)}`, {
                "Job ID": data.jobId || data.job_id,
                "Candidate ID": data.candidateId || data.candidate_id,
                "Report Type": title
            })
        ],
        actions: data.url ? [
            {
                type: "Action.OpenUrl",
                title: "Download Report",
                url: data.url
            }
        ] : []
    };
};

