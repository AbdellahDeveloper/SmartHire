import { z } from "zod";

export const jobOfferSchema = z.object({
    title: z.string().min(1, "Title is required"),
    seniority_level: z.enum(["junior", "mid", "senior", "lead", "staff", "principal"]),
    domain: z.string().min(1, "Domain is required"),
    industry: z.string().min(1, "Industry is required"),
    location: z.string().min(1, "Location is required"),
    work_mode: z.enum(["remote", "hybrid", "onsite"]),
    employment_type: z.enum(["full-time", "part-time", "contract", "internship"]),
    salary_min: z.number().min(0).nullable(),
    salary_max: z.number().min(0).nullable(),
    salary_currency: z.string().default("USD"),
    description: z.string().min(10, "Description is required"),
    responsibilities: z.string().nullable(),
    education_level: z.string().nullable(),
    skills: z.array(z.string()).default([]),
    nice_to_have_skills: z.array(z.string()).default([]),
    status: z.enum(["open", "closed", "archived"]).default("open"),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const jobAIRequestSchema = z.object({
    title: z.string().describe("The official title of the job position."),
    seniority_level: z.string().describe("The level of experience required. Must be one of: junior, mid, senior, lead, staff, principal"),
    domain: z.string().describe("The specific technical or business domain, e.g., 'platform engineering', 'fintech', 'frontend'"),
    industry: z.string().describe("The broader industry category, e.g., 'Technology', 'Healthcare'"),
    location: z.string().describe("The city and country of the job. Mention 'Remote' if applicable."),
    work_mode: z.string().describe("How the work is performed. Must be one of: remote, hybrid, onsite"),
    employment_type: z.string().describe("The contract type. Must be one of: full-time, part-time, contract, internship"),
    salary_min: z.number().nullable().describe("Minimum annual salary if mentioned. Just the number."),
    salary_max: z.number().nullable().describe("Maximum annual salary if mentioned. Just the number."),
    salary_currency: z.string().nullable().describe("ISO Currency code, e.g., 'USD'. Return null if not mentioned."),
    description: z.string().describe("A concise summary of the job and the company."),
    responsibilities: z.string().nullable().describe("A consolidated list or paragraph of key responsibilities."),
    education_level: z.string().nullable().describe("Required education, e.g., 'Bachelor in CS'"),
    skills: z.array(z.string()).describe("List of mandatory technical and soft skills."),
    nice_to_have_skills: z.array(z.string()).describe("List of bonus or preferred skills."),
});

export type JobOffer = z.infer<typeof jobOfferSchema>;
export type JobAIRequest = z.infer<typeof jobAIRequestSchema>;
