import { handleServiceError } from "../services/base.service.js";
import { jobService } from "../services/job.service.js";

export const jobToolDefinitions = [
    {
        name: "list_jobs",
        description: "List all jobs with optional filtering",
        inputSchema: {
            type: "object",
            properties: {
                status: { type: "string", enum: ["open", "closed", "archived"] },
            },
        },
    },
    {
        name: "get_job",
        description: "Get detailed job specification by 24 characters job ID",
        inputSchema: {
            type: "object",
            properties: { id: { type: "string", description: "The unique job ID" } },
            required: ["id"],
        },
    },
    {
        name: "create_job",
        description: "Create a new job posting",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string" },
                seniority_level: { type: "string", enum: ["junior", "mid", "senior", "lead", "staff", "principal"] },
                domain: { type: "string" },
                industry: { type: "string" },
                location: { type: "string" },
                work_mode: { type: "string", enum: ["remote", "hybrid", "onsite"] },
                employment_type: { type: "string", enum: ["full-time", "part-time", "contract", "internship"] },
                salary_min: { type: "number" },
                salary_max: { type: "number" },
                description: { type: "string" },
                skills: { type: "array", items: { type: "string" } },
            },
            required: ["title", "description", "seniority_level", "domain", "industry", "work_mode", "employment_type"],
        },
    },
    {
        name: "update_job",
        description: "Update an existing job posting",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string" },
                data: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        status: { type: "string", enum: ["open", "closed", "archived"] },
                        description: { type: "string" },
                    },
                },
            },
            required: ["id", "data"],
        },
    },
    {
        name: "delete_job",
        description: "Delete a job posting",
        inputSchema: {
            type: "object",
            properties: { id: { type: "string" } },
            required: ["id"],
        },
    },
    {
        name: "duplicate_job",
        description: "Create a copy of an existing job posting",
        inputSchema: {
            type: "object",
            properties: { id: { type: "string" } },
            required: ["id"],
        },
    },
    {
        name: "create_job_from_pdf_url",
        description: "Create a new job posting by extracting details from a PDF URL",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string", description: "The public URL of the job description PDF" },
            },
            required: ["url"],
        },
    },
];

export const handleJobTools = async (name: string, args: any) => {
    try {
        let response;
        switch (name) {
            case "list_jobs":
                response = await jobService.listJobs(args);
                break;
            case "get_job":
                response = await jobService.getJob(args.id);
                break;
            case "create_job":
                response = await jobService.createJob(args);
                break;
            case "update_job":
                response = await jobService.updateJob(args.id, args.data);
                break;
            case "delete_job":
                response = await jobService.deleteJob(args.id);
                break;
            case "duplicate_job":
                response = await jobService.duplicateJob(args.id);
                break;
            case "create_job_from_pdf_url":
                response = await jobService.createJobFromPdfUrl(args.url);
                break;
            default:
                return null;
        }
        return {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
    } catch (error) {
        return handleServiceError(error);
    }
};
