import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { jobRoutes } from "../routes/job.routes";

const app = new Elysia().group('/api', (app) => app.use(jobRoutes));

describe("Job Service Atomic Endpoints", () => {
    let createdJobId: string;

    it("POST /api/jobs - Create a new job", async () => {
        const jobData = {
            title: "Senior Software Engineer",
            seniority_level: "senior",
            domain: "platform engineering",
            industry: "technology",
            location: "San Francisco, CA",
            work_mode: "hybrid",
            employment_type: "full-time",
            salary_min: 150000,
            salary_max: 200000,
            description: "We are looking for a senior engineer to lead our platform team.",
            skills: ["typescript", "elysia", "prisma", "mongodb"]
        };

        const response = await app
            .handle(new Request("http://localhost/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jobData),
            }))
            .then(async (res) => {
                const text = await res.text();
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error("Failed to parse JSON response:", text);
                    return { success: false, message: "Invalid JSON response" };
                }
            });

        expect(response.success).toBe(true);
        expect(response.job.title).toBe(jobData.title);
        createdJobId = response.jobId;
    }, 10000);

    it("GET /api/jobs - List jobs", async () => {
        const response = await app
            .handle(new Request("http://localhost/api/jobs"))
            .then((res) => res.json());

        expect(response.success).toBe(true);
        expect(response.count).toBeGreaterThan(0);
    }, 10000);

    it("GET /api/jobs/:id - Get job by ID", async () => {
        if (!createdJobId) throw new Error("createdJobId is missing from previous test");

        const response = await app
            .handle(new Request(`http://localhost/api/jobs/${createdJobId}`))
            .then((res) => res.json());

        expect(response.success).toBe(true);
        expect(response.job.id).toBe(createdJobId);
    });

    it("PATCH /api/jobs/:id - Update job", async () => {
        if (!createdJobId) throw new Error("createdJobId is missing from previous test");

        const updateData = {
            location: "New York, NY",
            status: "closed"
        };

        const response = await app
            .handle(new Request(`http://localhost/api/jobs/${createdJobId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            }))
            .then((res) => res.json());

        expect(response.success).toBe(true);
        expect(response.job.location).toBe(updateData.location);
        expect(response.job.status).toBe(updateData.status);
    });

    it("POST /api/jobs/:id/duplicate - Duplicate job", async () => {
        if (!createdJobId) throw new Error("createdJobId is missing from previous test");

        const response = await app
            .handle(new Request(`http://localhost/api/jobs/${createdJobId}/duplicate`, {
                method: "POST",
            }))
            .then((res) => res.json());

        expect(response.success).toBe(true);
        expect(response.message).toBe("Job duplicated");
        expect(response.job.title).toContain("(Copy)");
    });

    it("DELETE /api/jobs/:id - Archive job", async () => {
        if (!createdJobId) throw new Error("createdJobId is missing from previous test");

        const response = await app
            .handle(new Request(`http://localhost/api/jobs/${createdJobId}`, {
                method: "DELETE",
            }))
            .then((res) => res.json());

        expect(response.success).toBe(true);
        expect(response.message).toBe("Job archived");
    });

    it("POST /api/jobs/extract - Extract structured data from text", async () => {
        const textData = {
            text: "We need a Junior Frontend Developer in London. Hybrid work. Full-time. Salary around 40k. Must know React and CSS."
        };

        const response = await app
            .handle(new Request("http://localhost/api/jobs/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(textData),
            }))
            .then(async (res) => {
                const data = await res.json();
                if (!data.success) console.error("Extract Failed:", JSON.stringify(data, null, 2));
                return data;
            });

        if (process.env.OPENAI_API_KEY) {
            expect(response.success).toBe(true);
            expect(response.data).toBeDefined();
        } else {
            console.warn("Skipping AI Extract check - OPENAI_API_KEY missing");
        }
    }, 45000);

    it("POST /api/jobs/extract - Extract structured data from PDF", async () => {
        const pdfPath = "c:/Users/brahi/Downloads/SmartHire/job_service/src/tests/assets/job_deescription.pdf";
        const file = Bun.file(pdfPath);

        if (await file.exists()) {
            const formData = new FormData();
            formData.append("file", file);

            const response = await app
                .handle(new Request("http://localhost/api/jobs/extract", {
                    method: "POST",
                    body: formData,
                }))
                .then(async (res) => {
                    const data = await res.json();
                    if (!data.success) console.error("PDF Extract Failed:", JSON.stringify(data, null, 2));
                    return data;
                });

            if (process.env.OPENAI_API_KEY) {
                expect(response.success).toBe(true);
                expect(response.data).toBeDefined();
            }
        } else {
            console.warn("Test PDF asset not found, skipping PDF extraction test.");
        }
    }, 45000);
});
