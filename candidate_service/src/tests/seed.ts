import { readdir } from "node:fs/promises";
import { join } from "node:path";

const CVS_DIR = join(import.meta.dir, "cvs");
const BULK_URL = "http://localhost:3002/api/candidates/bulk";

async function seed() {
    try {
        const allFiles = await readdir(CVS_DIR);
        const pdfFiles = allFiles.filter(f => f.endsWith(".pdf")).slice(0, 50);

        if (pdfFiles.length === 0) {
            console.error("No PDF files found in " + CVS_DIR);
            return;
        }

        const formData = new FormData();
        for (const fileName of pdfFiles) {
            const filePath = join(CVS_DIR, fileName);
            const file = Bun.file(filePath);
            formData.append("files", file);
        }

        console.log(`Starting bulk upload of ${pdfFiles.length} CVs to ${BULK_URL}...`);

        const response = await fetch(BULK_URL, {
            method: "POST",
            body: formData,
            verbose: true,
        } as any);

        if (!response.body) {
            console.error("❌ No response body received from server.");
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            let currentEvent = "message";

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("event:")) {
                    currentEvent = trimmed.replace("event:", "").trim();
                } else if (trimmed.startsWith("data:")) {
                    const content = trimmed.replace("data:", "").trim();
                    try {
                        const parsed = JSON.parse(content);
                        console.log(`[SSE - ${currentEvent}]`, parsed.message || parsed);
                        if (currentEvent === "complete") {
                            console.log("✅ Server signaled completion.");
                        }
                    } catch {
                        console.log(`[SSE - ${currentEvent}] ${content}`);
                    }
                    currentEvent = "message";
                }
            }
        }

        console.log("\n✅ Seeding process finished.");
    } catch (error: any) {
        console.error("❌ Seed Error:", error.message);
    }
}

seed();
