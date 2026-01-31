import { z } from "zod";

export const matchExplanationSchema = z.object({
    score: z.number().min(0).max(100).describe("Overall match score from 0 to 100"),
    reasoning: z.string().describe("Detailed AI explanation for the score"),
    matchedSkills: z.array(z.string()).describe("List of skills that matched between the job and candidate"),
    missingSkills: z.array(z.string()).describe("List of skills mentioned in the job but missing in the candidate"),
    seniorityAlignment: z.string().describe("How well the candidate's seniority aligns with the job requirement"),
    experienceAlignment: z.string().describe("Analysis of candidates's experience relevance"),
});

export const matchResultSchema = z.object({
    candidateId: z.string(),
    candidateName: z.string(),
    currentJobTitle: z.string(),
    score: z.number(),
    analysis: matchExplanationSchema,
});

export type MatchExplanation = z.infer<typeof matchExplanationSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;
