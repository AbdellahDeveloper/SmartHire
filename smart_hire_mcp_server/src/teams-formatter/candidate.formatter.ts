import { createMetadataSection } from "./index.js";

export const formatCandidate = (data: any) => {
    const candidate = data.candidate || data;

    // Process skills
    const skillsList = Array.isArray(candidate.skills)
        ? candidate.skills.map((s: any) => typeof s === 'string' ? s : s.name).join(", ")
        : "N/A";

    // Process work experience (last 2)
    const experienceSummary = Array.isArray(candidate.workExperiences || candidate.work_experiences)
        ? (candidate.workExperiences || candidate.work_experiences).slice(0, 2).map((exp: any) =>
            `**${exp.job_title || exp.jobTitle}** at ${exp.company} (${exp.start_date || exp.startDate} - ${exp.end_date || exp.endDate})`
        ).join("\n\n")
        : null;

    // Process education
    const educationSummary = Array.isArray(candidate.education)
        ? candidate.education.map((edu: any) =>
            `${edu.degree_level || edu.degreeLevel || ""} ${edu.degree_name || edu.degreeName || ""} - ${edu.institution}`
        ).join("\n")
        : null;

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
                        text: `Candidate: ${candidate.fullName || candidate.full_name || "Unknown"}`,
                        weight: "Bolder",
                        size: "ExtraLarge",
                        color: "Accent"
                    },
                    {
                        type: "TextBlock",
                        text: candidate.currentJobTitle || candidate.current_job_title || "N/A",
                        isSubtle: true,
                        size: "Medium",
                        weight: "Bolder",
                        spacing: "None"
                    },
                    {
                        type: "FactSet",
                        facts: [
                            { title: "Email", value: candidate.email || "N/A" },
                            { title: "Phone", value: candidate.phoneNumber || candidate.phone || "N/A" },
                            { title: "Experience", value: `${candidate.yearsTotalExperience || candidate.years_of_experience || 0} years` },
                            { title: "Location", value: candidate.location || (candidate.city ? `${candidate.city}, ${candidate.country}` : "N/A") },
                            { title: "Status", value: candidate.status || "Ready" }
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
                        text: "Summary",
                        weight: "Bolder",
                    },
                    {
                        type: "TextBlock",
                        text: candidate.profileHighlight || candidate.summary || "No summary available",
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
                        text: "Key Skills",
                        weight: "Bolder",
                    },
                    {
                        type: "TextBlock",
                        text: skillsList,
                        wrap: true,
                    },
                ]
            },
            ...(experienceSummary ? [{
                type: "Container",
                separator: true,
                items: [
                    {
                        type: "TextBlock",
                        text: "Recent Experience",
                        weight: "Bolder",
                    },
                    {
                        type: "TextBlock",
                        text: experienceSummary,
                        wrap: true,
                    },
                ]
            }] : []),
            ...(educationSummary ? [{
                type: "Container",
                separator: true,
                items: [
                    {
                        type: "TextBlock",
                        text: "Education",
                        weight: "Bolder",
                    },
                    {
                        type: "TextBlock",
                        text: educationSummary,
                        wrap: true,
                    },
                ]
            }] : []),
            {
                type: "ActionSet",
                actions: [
                    {
                        type: "Action.OpenUrl",
                        title: "Open Full CV",
                        url: candidate.cvUrl || candidate.cv_url || "#",
                    },
                ],
            },
            ...createMetadataSection(`metadata-${candidate.id || 'candidate'}`, {
                "Candidate ID": candidate.id || candidate._id,
                "Gender": candidate.gender,
                "Languages": Array.isArray(candidate.languages) ? candidate.languages.map((l: any) => `${l.language} (${l.proficiency})`).join(", ") : "N/A",
                "Created At": candidate.createdAt || candidate.created_at
            })
        ],
    };
};

export const formatCandidateList = (data: any) => {
    const candidates = Array.isArray(data) ? data : (data.candidates || []);
    return {
        type: "AdaptiveCard",
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.5",
        body: [
            {
                type: "TextBlock",
                text: "Candidates List",
                weight: "Bolder",
                size: "Large",
            },
            ...candidates.map((c: any) => ({
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
                                        text: c.fullName || c.full_name || "Unknown Name",
                                        weight: "Bolder",
                                    },
                                    {
                                        type: "TextBlock",
                                        text: `${c.currentJobTitle || c.current_job_title || "N/A"} | ${c.location || (c.city ? `${c.city}, ${c.country}` : "N/A")}`,
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
                                        text: `${c.yearsTotalExperience || c.years_of_experience || 0}y Exp`,
                                        weight: "Bolder",
                                    }
                                ]
                            }
                        ]
                    },
                    ...createMetadataSection(`metadata-list-${c.id || Math.random().toString(36).substr(2, 9)}`, {
                        "ID": c.id || c._id,
                        "Email": c.email,
                        "Skills": Array.isArray(c.skills) ? c.skills.map((s: any) => typeof s === 'string' ? s : s.name).slice(0, 5).join(", ") : "N/A"
                    })
                ],
            })),
        ],
    };
};

