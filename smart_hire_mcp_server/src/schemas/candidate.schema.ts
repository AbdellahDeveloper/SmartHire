import { z } from "zod";

export const candidateAIRequestSchema = z.object({
    first_name: z.string().describe("The candidate's first name"),
    last_name: z.string().describe("The candidate's last name"),
    email: z.string().email().describe("Contact email address"),
    phone_number: z.string().optional().describe("Contact phone number"),
    city: z.string().optional().describe("City where the candidate is located"),
    country: z.string().optional().describe("Country where the candidate is located"),
    skills: z.array(z.string()).optional().describe("List of technical and soft skills"),
}).describe("Data for creating or updating a candidate");

export const candidateSchema = candidateAIRequestSchema.extend({
    id: z.string().optional(),
    fullName: z.string().optional(),
    currentJobTitle: z.string().optional(),
    yearsTotalExperience: z.number().optional(),
    status: z.string().optional(),
});
