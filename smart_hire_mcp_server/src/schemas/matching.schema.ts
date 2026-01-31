import { z } from "zod";

export const matchRequestSchema = z.object({
    jobId: z.string().optional().describe("Job ID from the database"),
    jobDescription: z.string().optional().describe("Raw job description text if Job ID is not provided"),
    limit: z.number().int().min(1).max(100).default(10).describe("Number of top candidates to return"),
    strictness: z.enum(["flexible", "balanced", "strict"]).default("balanced").describe("How strict the matching should be"),
    excludedSkills: z.array(z.string()).optional().describe("Skills to ignore during matching"),
}).describe("Parameters for matching candidates to jobs");

export const manualOverrideSchema = z.object({
    matchId: z.string().describe("Match session or result identifier"),
    candidateId: z.string().describe("ID of the candidate to override"),
    newScore: z.number().min(0).max(100).describe("New score to assign"),
    overrideReason: z.string().describe("Reason for manual adjustment"),
}).describe("Manual override for candidate ranking");
