import { encode } from "@toon-format/toon";
import { Search } from "@upstash/search";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getModel } from "../lib/ai-provider";
import prisma from "../lib/prisma";
import {
    matchExplanationSchema,
    type MatchRequest,
    type MatchResult
} from "../models/matching.schema";

const upstashSearch = new Search({
    url: process.env.UPSTASH_SEARCH_REST_URL!,
    token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
});

function jsonToToon(json: any) {
    return {
        fullName: json.fullName,
        currentJobTitle: json.currentJobTitle,
        yearsTotalExperience: json.yearsTotalExperience,
        seniorityLevel: json.seniorityLevel,
        skills: json.skills,
        profileHighlight: json.profileHighlight,
        workExperiences: json.workExperiences
    };
}

export const findBestCandidates = async (req: MatchRequest) => {
    console.log(req)
    console.time("findBestCandidates-total");
    try {
        let jobDescription = req.jobDescription || "";
        let jobTitle = "";

        if (req.jobId) {
            console.time("job-fetch");
            try {
                const jobData = await prisma.job.findFirst({
                    where: {
                        id: req.jobId,
                        companyId: req.companyId
                    }
                });

                if (jobData) {
                    jobDescription = jobData.description || jobDescription;
                    jobTitle = jobData.title || "";
                }
            } catch (err) {
                console.timeEnd("job-fetch");
                console.error("Job fetch failed, falling back to provided description:", err);
            }
            console.timeEnd("job-fetch");
        }

        if (!jobDescription) {
            throw new Error("Job description or a valid Job ID is required to match candidates.");
        }
        console.log(jobDescription)
        console.time("upstash-search");
        const searchResults = await upstashSearch.index("candidates").search({
            query: jobDescription,
            limit: req.limit || 10,
            // filter: `companyId = '${req.companyId}'`
        });
        console.timeEnd("upstash-search");

        if (!searchResults || searchResults.length === 0) {
            console.log("No candidates found in search index.");
        }

        console.time("session-creation");
        const session = await prisma.matchSession.create({
            data: {
                companyId: req.companyId!,
                jobId: req.jobId,
                jobDescription,
                criteria: {
                    strictness: req.strictness,
                    excludedSkills: req.excludedSkills
                }
            }
        });
        console.timeEnd("session-creation");

        console.time("ai-batch-scoring-call");

        const candidatesData = searchResults.map((res) => {
            const content = res.content as any;
            const metadata = res.metadata as any;

            const profile = {
                fullName: content?.fullName || metadata?.fullName || "Unknown",
                currentJobTitle: content?.currentJobTitle || metadata?.currentJobTitle || "Unknown",
                yearsTotalExperience: content?.yearsTotalExperience,
                seniorityLevel: content?.seniorityLevel,
                skills: content?.skills || [],
                profileHighlight: content?.profileHighlight || metadata?.profileHighlight || "",
                workExperiences: content?.workExperiences || ""
            };

            return {
                candidateId: res.id,
                candidateName: profile.fullName,
                currentJobTitle: profile.currentJobTitle,
                profile: profile
            };
        });

        if (candidatesData.length === 0) {
            console.timeEnd("ai-batch-scoring-call");
            return {
                success: true,
                sessionId: session.id,
                matchResults: []
            };
        }

        const model = await getModel();

        const toonCandidates = encode(candidatesData.map(c => ({
            candidateId: c.candidateId,
            candidateName: c.candidateName,
            ...c.profile
        })));

        const { output: batchResponse } = await generateText({
            model,
            output: Output.array({
                element: z.object({
                    candidateId: z.string(),
                    ...matchExplanationSchema.shape
                })
            }),
            system: `You are an expert HR recruitment analyzer.
            Compare multiple candidates' profiles against the job description.
            For each candidate, provide a detailed match analysis.
            Matching Strictness: ${req.strictness}.
            Excluded Skills (ignore these): ${req.excludedSkills?.join(", ") || "None"}.
            Return an array of results, mapping each analysis to the correct candidateId.`,
            prompt: `Job Title: ${jobTitle}\nJob Description: ${jobDescription}\n\nCandidates:\n${toonCandidates}`
        });

        console.timeEnd("ai-batch-scoring-call");

        console.time("db-save-results");
        const matchResults: MatchResult[] = [];

        for (const item of batchResponse) {
            const candidateInfo = candidatesData.find(c => c.candidateId === item.candidateId);

            const analysis = {
                score: item.score,
                reasoning: item.reasoning,
                matchedSkills: item.matchedSkills,
                missingSkills: item.missingSkills,
                seniorityAlignment: item.seniorityAlignment,
                experienceAlignment: item.experienceAlignment,
            };

            await prisma.matchResult.create({
                data: {
                    companyId: req.companyId!,
                    sessionId: session.id,
                    candidateId: item.candidateId,
                    score: item.score,
                    analysis: analysis as any,
                }
            });

            matchResults.push({
                candidateId: item.candidateId,
                candidateName: candidateInfo?.candidateName || "Unknown",
                currentJobTitle: candidateInfo?.currentJobTitle || "Unknown",
                score: item.score,
                analysis,
            });
        }
        console.timeEnd("db-save-results");
        console.log({
            success: true,
            sessionId: session.id,
            matchResults: matchResults.sort((a, b) => b.score - a.score)
        })
        console.timeEnd("findBestCandidates-total");
        return {
            success: true,
            sessionId: session.id,
            matchResults: matchResults.sort((a, b) => b.score - a.score)
        };

    } catch (error: any) {
        console.timeEnd("findBestCandidates-total");
        console.error("Matching Error:", error);
        return { success: false, message: error.message };
    }
};
