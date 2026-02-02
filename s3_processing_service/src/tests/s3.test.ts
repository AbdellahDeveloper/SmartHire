import { describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { processS3Account } from "../cron/s3.cron";
import { s3Routes } from "../routes/s3.routes";

// Mock Prisma
mock.module("../db", () => ({
    prisma: {
        s3Credential: {
            create: async (args: any) => ({ id: "mock-id", ...args.data }),
            findMany: async () => [
                {
                    id: "mock-id",
                    endpoint: "http://mock-s3",
                    region: "us-east-1",
                    accessKey: "key",
                    secretKey: "secret",
                    bucket: "test-bucket",
                    lastChecked: new Date(0),
                    companyId: "company-123"
                }
            ],
            update: async (args: any) => ({ id: args.where.id, ...args.data })
        },
        company: {
            findUnique: async (args: any) => ({
                id: args.where.id,
                mcpToken: "mock-mcp-token"
            })
        }
    }
}));

// Mock Fetch
const mockFetch = mock((url: string, options: any) => {
    if (url.endsWith("/document-type")) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, type: "CV" })));
    }
    if (url.endsWith("/bulk")) {
        return Promise.resolve(new Response(JSON.stringify({ success: true })));
    }
    return Promise.resolve(new Response(JSON.stringify({ success: false })));
});
(global as any).fetch = mockFetch;

// Mock Bun.S3
(Bun as any).S3 = class {
    constructor(config: any) { }
    list = async () => ({
        contents: [ // Changed from objects to contents to match implementation
            { key: "resume1.pdf", lastModified: new Date() },
            { key: "image.png", lastModified: new Date() }, // Should be filtered out
            { key: "old_resume.pdf", lastModified: new Date(0) } // Should be filtered out
        ]
    });
    file = (key: string) => ({
        arrayBuffer: async () => new ArrayBuffer(8)
    });
};

describe("S3 Processing Service Tests", () => {
    const app = new Elysia().use(s3Routes);

    it("should add S3 credentials", async () => {
        const payload = {
            endpoint: "http://my-s3.com",
            region: "us-east-1",
            accessKey: "AKIA...",
            secretKey: "secret",
            bucket: "my-bucket",
            companyId: "company-1"
        };

        const response = await app.handle(
            new Request("http://localhost/s3/credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
        );

        const result = await response.json();
        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(result.data.bucket).toBe("my-bucket");
    });

    it("should list S3 credentials", async () => {
        const response = await app.handle(
            new Request("http://localhost/s3/credentials")
        );

        const result = await response.json();
        expect(response.status).toBe(200);
        expect(Array.isArray(result)).toBe(true);
        expect(result[0].bucket).toBe("test-bucket");
    });

    it("should process S3 account and upload new PDFs with mcpToken", async () => {
        const credential = {
            id: "mock-id",
            endpoint: "http://mock-s3",
            region: "us-east-1",
            accessKey: "key",
            secretKey: "secret",
            bucket: "test-bucket",
            lastChecked: new Date(0),
            companyId: "company-123"
        };

        await processS3Account(credential);

        expect(mockFetch).toHaveBeenCalled();
        const calls = mockFetch.mock.calls;

        const documentTypeCall = calls.find(call => call[0].toString().includes("/document-type"));
        const bulkCall = calls.find(call => call[0].toString().includes("/bulk"));

        expect(documentTypeCall).toBeDefined();
        expect(bulkCall).toBeDefined();

        // Verify Authorization header
        expect(documentTypeCall![1].headers["Authorization"]).toBe("Bearer mock-mcp-token");
        expect(bulkCall![1].headers["Authorization"]).toBe("Bearer mock-mcp-token");
    });
});
