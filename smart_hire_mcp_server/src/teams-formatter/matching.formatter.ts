import { createMetadataSection } from "./index.js";

export const formatMatchResults = (results: any) => {
    const candidates = results.matchResults || results.best_candidates || results.candidates || [];

    return {
        type: "AdaptiveCard",
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.5",
        body: [
            {
                type: "TextBlock",
                text: "Candidate Matching Results",
                weight: "Bolder",
                size: "ExtraLarge",
                color: "Accent"
            },
            ...candidates.map((match: any) => {
                const analysis = match.analysis || {};
                const matchedSkills = Array.isArray(analysis.matchedSkills) ? analysis.matchedSkills.join(", ") : "None";
                const missingSkills = Array.isArray(analysis.missingSkills) ? analysis.missingSkills.join(", ") : "None";

                return {
                    type: "Container",
                    separator: true,
                    items: [
                        {
                            type: "ColumnSet",
                            columns: [
                                {
                                    type: "Column",
                                    width: "stretch",
                                    items: [
                                        {
                                            type: "TextBlock",
                                            text: match.candidateName || match.candidate_name || "Unknown Candidate",
                                            weight: "Bolder",
                                            size: "Medium"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: match.currentJobTitle || match.current_job_title || "N/A",
                                            isSubtle: true,
                                            spacing: "None"
                                        }
                                    ]
                                },
                                {
                                    type: "Column",
                                    width: "auto",
                                    items: [
                                        {
                                            type: "TextBlock",
                                            text: `${match.score}%`,
                                            weight: "Bolder",
                                            size: "Large",
                                            color: match.score > 80 ? "Good" : match.score > 50 ? "Warning" : "Attention",
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            type: "TextBlock",
                            text: analysis.reasoning || "No reasoning provided",
                            wrap: true,
                        },
                        {
                            type: "FactSet",
                            facts: [
                                { title: "Seniority", value: analysis.seniorityAlignment || "N/A" },
                                { title: "Experience", value: analysis.experienceAlignment || "N/A" },
                                { title: "Matched Skills", value: matchedSkills },
                                { title: "Missing Skills", value: missingSkills },
                            ],
                            spacing: "Medium"
                        },
                        ...createMetadataSection(`metadata-${match.candidateId || Math.random().toString(36).substr(2, 9)}`, {
                            "Candidate ID": match.candidateId || match.candidate_id,
                            "Job ID": results.jobId || results.job_id,
                            "Raw Score": match.score
                        })
                    ],
                };
            }),
        ],
    };
};

