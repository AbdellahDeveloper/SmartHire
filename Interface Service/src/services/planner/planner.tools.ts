import { getToolName, tool } from "ai";
import { z } from "zod";

import { createMCPClient } from "@ai-sdk/mcp";
export async function GetTools(token: string) {
  console.log(token);

  const t = await (
    await createMCPClient({
      transport: {
        headers: {
          authorization: "Bearer " + token,
        },
        type: "http",
        url: process.env.MCP_URL || "",
      },
    })
  ).tools();

  const updatedObject = Object.fromEntries(
    Object.entries(t).map(([key, value]) => {
      return [
        key,
        {
          ...value,
          needsApproval: value._meta?.needsApproval === true,
        },
      ];
    }),
  );

  return updatedObject;
}

// // all the MCP tools
// export const Tools = {
//   createJob: tool({
//     description:
//       "Creates a new job based on structured job information provided by the user",
//     inputSchema: z.object({
//       title: z.string().meta({
//         description: "Job title (e.g. Senior React Software Engineer)",
//       }),
//       description: z.string().meta({
//         description: "Full job description provided by HR or user",
//       }),
//       location: z.string().optional().meta({
//         description: "Job location if specified",
//       }),
//       seniority: z.string().optional().meta({
//         description: "Seniority level such as junior, mid, senior, lead",
//       }),
//     }),
//     execute: (input) => {
//       console.log("[create job] input : ", input);

//       return { status: "success", id: "57436" };
//     },
//   }),
// };
// /**
//  * {
//       createJob: tool({
//         description:
//           "Creates a new job based on structured job information provided by the user",
//         inputSchema: z.object({
//           title: z.string().meta({
//             description: "Job title (e.g. Senior React Software Engineer)",
//           }),
//           description: z.string().meta({
//             description: "Full job description provided by HR or user",
//           }),
//           location: z.string().optional().meta({
//             description: "Job location if specified",
//           }),
//           seniority: z.string().optional().meta({
//             description: "Seniority level such as junior, mid, senior, lead",
//           }),
//         }),
//         execute: (input) => createJob(input),
//       }),

//       addCandidates: tool({
//         description:
//           "Adds new candidates or CV data into the system for processing and indexing",
//         inputSchema: z.object({
//           source: z.string().meta({
//             description:
//               "Source of the candidates (upload, integration, external provider)",
//           }),
//           batchId: z.string().optional().meta({
//             description: "Optional batch identifier for large CV ingestion",
//           }),
//         }),
//         execute: (input) => addCanidates(input),
//       }),

//       runMatching: tool({
//         description:
//           "Starts the matching process for a given job and returns ranked candidates",
//         inputSchema: z.object({
//           jobId: z.string().meta({
//             description: "The ID of the job we want to run the matching for",
//           }),
//           limit: z.number().optional().meta({
//             description: "Optional limit for number of candidates to return",
//           }),
//         }),
//         execute: ({ jobId, limit }) => runMatching(jobId, limit),
//       }),

//       organizer: tool({
//         description:
//           "Organizes and formats matching results into a final user-facing response",
//         inputSchema: z.object({
//           responceWithAllData: z.string().meta({
//             description:
//               "all the data combined from all the operations done this should containe formal text describing what happend and all the data we got from each step",
//           }),
//         }),
//         execute: (input) => organizer(input.responceWithAllData),
//       }),
//     }
//  */

export const ToolNameToDescription: Record<string, string> = {
  hello: "this is the description",
};
