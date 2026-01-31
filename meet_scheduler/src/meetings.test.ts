import { describe, expect, it, mock } from "bun:test";

// Set environment variables for tests
process.env.CLIENT_ID = "test-client-id";
process.env.CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:3012/callback";

// Mocking Google APIs
mock.module("googleapis", () => {
    return {
        google: {
            auth: {
                OAuth2: class {
                    generateAuthUrl = () => "http://mock-auth-url";
                    getToken = async () => ({ tokens: { access_token: "mock-token" } });
                    setCredentials = () => { };
                }
            },
            calendar: () => ({
                calendarList: {
                    get: async () => ({ data: { id: "test@example.com" } })
                },
                events: {
                    insert: async () => ({
                        data: {
                            id: "event-id",
                            htmlLink: "http://calendar-link",
                            conferenceData: {
                                entryPoints: [{ entryPointType: "video", uri: "https://meet.google.com/test" }]
                            }
                        }
                    })
                }
            })
        }
    };
});

// Mocking Prisma
mock.module("./lib/prisma", () => {
    return {
        prisma: {
            meetingConnection: {
                upsert: async () => ({ id: "mock-id", email: "test@example.com" }),
                findUnique: async () => ({ id: "mock-id", tokens: { access_token: "mock-token" } })
            },
            meeting: {
                create: async (args: any) => ({ id: "saved-id", ...args.data })
            },
            candidate: {
                findUnique: async () => ({ id: "candidate-id", email: "candidate@test.com", firstName: "John" })
            }
        }
    };
});

// Mocking nodemailer
mock.module("nodemailer", () => ({
    createTransport: () => ({
        sendMail: async () => ({ messageId: "mock-email-id" })
    })
}));

import { authHandler, meetingHandler } from "./handlers/meetings.handler";

describe("Meeting Handler Tests", () => {
    it("should generate auth URL", async () => {
        const result = await authHandler.getAuthUrl();
        expect(result.url).toBe("http://mock-auth-url");
    });

    it("should handle callback and return connection id", async () => {
        const result = await authHandler.handleCallback({ query: { code: "mock-code" } });
        expect(result.message).toBe("Connected successfully");
        expect(result.id).toBe("mock-id");
    });

    it("should schedule a meeting, save to DB and send email", async () => {
        const result = await meetingHandler.scheduleMeeting({
            params: { id: "mock-id" },
            body: {
                summary: "Test Meeting",
                send: 1,
                candidateId: "candidate-id",
                companyName: "Test Company"
            }
        });

        expect(result.id).toBe("event-id");
        expect(result.dbId).toBe("saved-id");
        expect(result.meetLink).toBe("https://meet.google.com/test");
        expect(result.emailSent).toBe(true);
    });
});
