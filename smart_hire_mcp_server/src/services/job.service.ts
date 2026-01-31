import { createServiceClient } from "./base.service.js";

const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL || "http://localhost:3001/api";
const client = createServiceClient(JOB_SERVICE_URL);

export const jobService = {
    listJobs: (params: any) => client.get("/jobs", { params }),
    getJob: (id: string | number) => client.get(`/jobs/${id}`),
    createJob: (data: any) => client.post("/jobs", data),
    updateJob: (id: string | number, data: any) => client.patch(`/jobs/${id}`, data),
    deleteJob: (id: string | number) => client.delete(`/jobs/${id}`),
    duplicateJob: (id: string | number) => client.post(`/jobs/${id}/duplicate`),
    createJobFromPdfUrl: (url: string) => client.post("/jobs/from-pdf-url", { url }),
};
