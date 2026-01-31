import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { candidateRoutes } from "../routes/candidate.routes";

const app = new Elysia().group('/api', (app) => app.use(candidateRoutes));

describe("Candidate Service Atomic Endpoints", () => {
    let createdCandidateId: string;

    it("POST /api/candidates - Create a new candidate with CV upload", async () => {
        const formData = new FormData();

        formData.append("first_name", "John");
        formData.append("last_name", "Doe");
        formData.append("full_name", "John Doe");
        formData.append("city", "Paris");
        formData.append("country", "France");
        formData.append("phone_number", "+33612345678");
        formData.append("email", "john.doe@example.com");
        formData.append("gender", "male");
        formData.append("profile_highlight", "Experienced full-stack developer with 5 years in fintech.");
        formData.append("current_job_title", "Senior Developer");
        formData.append("years_total_experience", "5");
        formData.append("seniority_level", "senior");

        const pdfPath = "c:/Users/brahi/Downloads/SmartHire/candidate_service/src/tests/cv.pdf";
        const file = Bun.file(pdfPath);

        if (await file.exists()) {
            formData.append("file", file);
        } else {

            formData.append("file", new File(["dummy pdf content"], "cv.pdf", { type: "application/pdf" }));
        }

        const response = await app
            .handle(new Request("http://localhost/api/candidates", {
                method: "POST",
                body: formData,
            }))
            .then(async (res) => {
                const data = await res.json();
                if (data.success === false) console.error("Test Request Failed:", JSON.stringify(data, null, 2));
                return data;
            });

        if (response.success && response.candidate) {
            expect(response.success).toBe(true);
            expect(response.candidate.firstName).toBe("John");
            expect(response.candidate.cvUrl).toBeDefined();
            createdCandidateId = response.candidateId;
        } else {
            throw new Error(`Candidate creation failed: ${response.message}`);
        }
    }, 30000);

    it("GET /api/candidates/:id - Get candidate by ID", async () => {
        const response = await app
            .handle(new Request(`http://localhost/api/candidates/${createdCandidateId}`))
            .then(async (res) => {
                const data = await res.json();
                if (data.success === false) console.error("Test Request Failed:", JSON.stringify(data, null, 2));
                return data;
            });

        expect(response.success).toBe(true);
        expect(response.candidate.id).toBe(createdCandidateId);
    });

    it("PATCH /api/candidates/:id - Update candidate", async () => {
        const updateData = {
            status: "ready"
        };

        const response = await app
            .handle(new Request(`http://localhost/api/candidates/${createdCandidateId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            }))
            .then(async (res) => {
                const data = await res.json();
                if (data.success === false) console.error("Test Request Failed:", JSON.stringify(data, null, 2));
                return data;
            });

        expect(response.success).toBe(true);
        expect(response.candidate.status).toBe("ready");
    });

    it("POST /api/candidates/extract - Extract from text", async () => {
        const textData = {
            text: "I am Jane Smith, a product manager from Berlin. I have 8 years of experience. My email is jane@work.com. I speak English and German. I worked at Google for 4 years."
        };

        const response = await app
            .handle(new Request("http://localhost/api/candidates/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(textData),
            }))
            .then(async (res) => {
                const data = await res.json();
                if (data.success === false) console.error("Test Request Failed:", JSON.stringify(data, null, 2));
                return data;
            });
        console.log("Extracted data:", response);

        if (process.env.OPENAI_API_KEY) {
            expect(response.success).toBe(true);
            expect(response.data.full_name).toContain("Jane Smith");
        }
    }, 30000);

    it("POST /api/candidates/extract - Extract from PDF", async () => {
        const formData = new FormData();
        const pdfPath = "c:/Users/brahi/Downloads/SmartHire/candidate_service/src/tests/cv.pdf";
        const file = Bun.file(pdfPath);

        if (await file.exists()) {
            formData.append("file", file);
        } else {
            formData.append("file", new File(["dummy pdf content"], "cv.pdf", { type: "application/pdf" }));
        }

        const response = await app
            .handle(new Request("http://localhost/api/candidates/extract", {
                method: "POST",
                body: formData,
            }))
            .then(async (res) => {
                const data = await res.json();
                if (data.success === false) console.error("Test Request Failed:", JSON.stringify(data, null, 2));
                return data;
            });

        if (process.env.OPENAI_API_KEY) {
            expect(response.success).toBe(true);
            expect(response.data).toBeDefined();
            console.log("Extracted data from PDF:", JSON.stringify(response.data, null, 2));
        }
    }, 60000);

    it("POST /api/candidates/is-cv - Check if text is a CV", async () => {
        const textData = {
            text: "This is a Curriculum Vitae of a systems engineer with extensive experience in cloud computing."
        };

        const response = await app
            .handle(new Request("http://localhost/api/candidates/is-cv", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(textData),
            }))
            .then(async (res) => {
                const data = await res.json();
                if (data.success === false) console.error("Test Request Failed:", JSON.stringify(data, null, 2));
                return data;
            });

        if (process.env.OPENAI_API_KEY) {
            expect(response.success).toBe(true);
            expect(response.isCV).toBe(true);
        }
    }, 20000);

    it("DELETE /api/candidates/:id - Archive candidate", async () => {
        const response = await app
            .handle(new Request(`http://localhost/api/candidates/${createdCandidateId}`, {
                method: "DELETE",
            }))
            .then(async (res) => {
                const data = await res.json();
                if (data.success === false) console.error("Test Request Failed:", JSON.stringify(data, null, 2));
                return data;
            });

        expect(response.success).toBe(true);
        expect(response.message).toBe("Candidate archived");
    });
});
