import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { findPdfParts } from "../cron/email.cron";
import { mailRoutes } from "../routes/mail.routes";

const app = new Elysia().group('/api', (app) => app.use(mailRoutes));

describe("Email Processing Service Tests", () => {

    describe("API Endpoints", () => {
        it("POST /api/mail/addUserMail - Success", async () => {
            const body = {
                server: process.env.MAIL_HOST || "imap.test.com",
                port: parseInt(process.env.MAIL_PORT || "993"),
                email: process.env.MAIL_USER || "test@test.com",
                password: process.env.MAIL_PASS || "password123",
                user_id: "67936a2818ec0edca78b5eac" // valid 24 char hex
            };

            const response = await app.handle(
                new Request("http://localhost/api/mail/addUserMail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                })
            );

            const result: any = await response.json();

            expect(response.status).toBe(200);
            expect(result.success).toBe(true);
            expect(result.data.email).toBe(process.env.MAIL_USER || "test@test.com");
            expect(result.data.server).toBe(process.env.MAIL_HOST || "imap.test.com");
        });

        it("POST /api/mail/addUserMail - Validation Error (Missing server)", async () => {
            const body = {
                port: 993,
                email: "test@test.com",
                password: "password123",
                user_id: "67936a2818ec0edca78b5eac"
            };

            const response = await app.handle(
                new Request("http://localhost/api/mail/addUserMail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                })
            );

            expect(response.status).toBe(422); // Elysia validation error
        });
    });

    describe("Utility Functions", () => {
        it("findPdfParts - Identifies PDF attachments in structure", () => {
            const structure = {
                childNodes: [
                    {
                        type: "text/plain",
                        part: "1"
                    },
                    {
                        type: "application/pdf",
                        part: "2",
                        params: { name: "cv.pdf" }
                    },
                    {
                        childNodes: [
                            {
                                type: "application/pdf",
                                part: "3",
                                params: { name: "other.pdf" }
                            }
                        ]
                    }
                ]
            };

            const pdfParts = findPdfParts(structure);
            expect(pdfParts.length).toBe(2);
            expect(pdfParts[0].part).toBe("2");
            expect(pdfParts[0].fileName).toBe("cv.pdf");
            expect(pdfParts[1].part).toBe("3");
            expect(pdfParts[1].fileName).toBe("other.pdf");
        });

        it("findPdfParts - Handles missing structure", () => {
            const pdfParts = findPdfParts(null);
            expect(pdfParts).toEqual([]);
        });
    });
});
