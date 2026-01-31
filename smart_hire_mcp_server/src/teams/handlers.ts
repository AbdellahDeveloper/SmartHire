import { wrapInAdaptiveCard } from "../teams-formatter/index.js";
import { handleCandidateTools } from "../tools/candidate.tools.js";
import { handleJobTools } from "../tools/job.tools.js";
import { handleMatchingTools } from "../tools/matching.tools.js";
import { handleReportTools } from "../tools/report.tools.js";

export const handleTeamsTools = async (name: string, args: any) => {
    // We reuse the existing handlers to get the raw JSON response
    // Then we extract the data and wrap it

    let result: any;

    // Check which service handles the tool
    const candidateResult = await handleCandidateTools(name, args);
    if (candidateResult) result = candidateResult;

    if (!result) {
        const jobResult = await handleJobTools(name, args);
        if (jobResult) result = jobResult;
    }

    if (!result) {
        const matchingResult = await handleMatchingTools(name, args);
        if (matchingResult) result = matchingResult;
    }

    if (!result) {
        const reportResult = await handleReportTools(name, args);
        if (reportResult) result = reportResult;
    }

    if (!result) return null;

    // If it's an error (has no content[0].text or is a specific error format)
    // we might want to skip formatting or format the error.
    // For now, let's assume if it came back from a handler, we try to format it.

    try {
        // The handlers return { content: [{ type: 'text', text: JSON_STRING }] }
        // We need the raw data to format it.
        // This is a bit tricky because the handlers stringify the data.

        // Let's refactor the handlers or just parse the JSON back.
        // Actually, it's safer to parse it back for now to avoid changing the original handlers.

        const content = result.content?.[0]?.text;
        if (content && typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
            const data = JSON.parse(content);
            return wrapInAdaptiveCard(name, data);
        }
    } catch (e) {
        console.error("Failed to format for Teams:", e);
    }

    return result;
};
