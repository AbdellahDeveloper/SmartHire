import { Search } from "@upstash/search";

const upstashSearch = new Search({
    url: process.env.UPSTASH_SEARCH_REST_URL!,
    token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
});

export const indexCandidate = async (candidate: any) => {
    try {
        await upstashSearch.index("candidates").upsert({
            id: candidate.id,
            content: {
                fullName: candidate.fullName,
                currentJobTitle: candidate.currentJobTitle,
                yearsTotalExperience: candidate.yearsTotalExperience,
                seniorityLevel: candidate.seniorityLevel,
                skills: candidate.skills.map((s: any) => s.name || s),
                profileHighlight: candidate.profileHighlight,
                workExperiences: candidate.workExperiences.map((ex: any) => `${ex.company}: ${ex.jobTitle}`).join(", "),
            },
            metadata: {
                companyId: candidate.companyId,
                fullName: candidate.fullName,
                currentJobTitle: candidate.currentJobTitle,
                city: candidate.city,
                country: candidate.country
            }
        });

        console.log(`✅ Candidate ${candidate.id} indexed in search`);
        return { success: true };
    } catch (error: any) {
        console.error(`❌ Search Indexing Error for candidate ${candidate.id}:`, error);
        return { success: false, message: error.message };
    }
};
