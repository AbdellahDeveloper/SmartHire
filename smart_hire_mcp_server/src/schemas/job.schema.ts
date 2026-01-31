import { z } from "zod";

export const jobAIRequestSchema = z.object({
    title: z.string().describe("The official title of the job position."),
    seniority_level: z.enum(["junior", "mid", "senior", "lead", "staff", "principal"]).describe("The level of experience required."),
    domain: z.string().describe("The specific technical or business domain, e.g., 'platform engineering', 'fintech', 'frontend'"),
    industry: z.string().describe("The broader industry category, e.g., 'Technology', 'Healthcare'"),
    location: z.string().describe("The city and country of the job. Mention 'Remote' if applicable."),
    work_mode: z.enum(["remote", "hybrid", "onsite"]).describe("How the work is performed."),
    employment_type: z.enum(["full-time", "part-time", "contract", "internship"]).describe("The contract type."),
    salary_min: z.number().nullable().describe("Minimum annual salary if mentioned."),
    salary_max: z.number().nullable().describe("Maximum annual salary if mentioned."),
    salary_currency: z.string().default("USD").describe("ISO Currency code, e.g., 'USD'"),
    description: z.string().describe("A concise summary of the job and the company."),
    responsibilities: z.string().nullable().describe("Key responsibilities."),
    education_level: z.string().nullable().describe("Required education, e.g., 'Bachelor in CS'"),
    skills: z.array(z.string()).describe("List of mandatory technical and soft skills."),
    nice_to_have_skills: z.array(z.string()).optional().describe("List of bonus or preferred skills."),
}).describe("Data for creating or updating a job");

export const jobOfferSchema = jobAIRequestSchema.extend({
    id: z.string().optional(),
    status: z.enum(["open", "closed", "archived"]).default("open"),
});
