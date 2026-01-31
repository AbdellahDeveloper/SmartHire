import { createMetadataSection } from "./index.js";

export const formatJob = (data: any) => {
    const job = data.job || data;

    // Process skills
    const skillsList = Array.isArray(job.skills) ? job.skills.join(", ") : "N/A";
    const niceToHaveSkillsList = Array.isArray(job.nice_to_have_skills || job.niceToHaveSkills)
        ? (job.nice_to_have_skills || job.niceToHaveSkills).join(", ")
        : null;

    const salary = (job.salaryMin || job.salaryMax)
        ? `${job.salaryMin || 0} - ${job.salaryMax || "N/A"} ${job.salaryCurrency || job.salary_currency || "USD"}`
        : "Not specified";

    return {
        type: "AdaptiveCard",
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.5",
        body: [
            {
                type: "Container",
                items: [
                    {
                        type: "TextBlock",
                        text: `Job: ${job.title || "Unknown"}`,
                        weight: "Bolder",
                        size: "ExtraLarge",
                        color: "Accent"
                    },
                    {
                        type: "TextBlock",
                        text: `${job.domain || "N/A"} | ${job.industry || "N/A"}`,
                        isSubtle: true,
                        size: "Medium",
                        weight: "Bolder",
                        spacing: "None"
                    },
                    {
                        type: "FactSet",
                        facts: [
                            { title: "Seniority", value: job.seniorityLevel || job.seniority_level || "N/A" },
                            { title: "Work Mode", value: job.workMode || job.work_mode || "N/A" },
                            { title: "Type", value: job.employmentType || job.employment_type || "N/A" },
                            { title: "Location", value: job.location || "N/A" },
                            { title: "Salary", value: salary },
                            { title: "Education", value: job.educationLevel || job.education_level || "Any" },
                        ],
                    },
                ],
            },
            {
                type: "Container",
                separator: true,
                items: [
                    {
                        type: "TextBlock",
                        text: "Description",
                        weight: "Bolder",
                    },
                    {
                        type: "TextBlock",
                        text: job.description || "No description provided",
                        wrap: true,
                    },
                ]
            },
            {
                type: "Container",
                separator: true,
                items: [
                    {
                        type: "TextBlock",
                        text: "Required Skills",
                        weight: "Bolder",
                    },
                    {
                        type: "TextBlock",
                        text: skillsList,
                        wrap: true,
                    },
                ]
            },
            ...(niceToHaveSkillsList ? [{
                type: "Container",
                separator: true,
                items: [
                    {
                        type: "TextBlock",
                        text: "Nice to Have Skills",
                        weight: "Bolder",
                    },
                    {
                        type: "TextBlock",
                        text: niceToHaveSkillsList,
                        wrap: true,
                    },
                ]
            }] : []),
            ...(job.responsibilities ? [{
                type: "Container",
                separator: true,
                items: [
                    {
                        type: "TextBlock",
                        text: "Responsibilities",
                        weight: "Bolder",
                    },
                    {
                        type: "TextBlock",
                        text: job.responsibilities,
                        wrap: true,
                    },
                ]
            }] : []),
            ...createMetadataSection(`metadata-${job.id || 'job'}`, {
                "Job ID": job.id || job._id,
                "Status": job.status || "Open",
                "Created At": job.createdAt || job.created_at
            })
        ],
    };
};

export const formatJobList = (data: any) => {
    const jobs = Array.isArray(data) ? data : (data.jobs || []);
    return {
        type: "AdaptiveCard",
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.5",
        body: [
            {
                type: "TextBlock",
                text: "Available Jobs",
                weight: "Bolder",
                size: "Large",
            },
            ...jobs.map((j: any) => ({
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
                                        text: j.title || "Unknown Title",
                                        weight: "Bolder",
                                    },
                                    {
                                        type: "TextBlock",
                                        text: `${j.seniorityLevel || j.seniority_level || "N/A"} | ${j.workMode || j.work_mode || "N/A"} | ${j.location || "N/A"}`,
                                        isSubtle: true,
                                        size: "Small",
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
                                        text: (j.status || "Open").toUpperCase(),
                                        color: j.status === 'open' ? "Good" : "Attention",
                                        weight: "Bolder",
                                    }
                                ]
                            }
                        ]
                    },
                    ...createMetadataSection(`metadata-list-${j.id || Math.random().toString(36).substr(2, 9)}`, {
                        "ID": j.id || j._id,
                        "Industry": j.industry,
                        "Skills": Array.isArray(j.skills) ? j.skills.slice(0, 5).join(", ") : "N/A"
                    })
                ],
            })),
        ],
    };
};

