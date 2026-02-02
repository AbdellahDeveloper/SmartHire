import { S3Client } from "bun";
import Baker from "cronbake";
import CryptoJS from "crypto-js";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { prisma } from "../db";

const TMP_DIR = join(process.cwd(), "temp_s3_downloads");
if (!existsSync(TMP_DIR)) {
    mkdirSync(TMP_DIR);
}

const CANDIDATE_SERVICE_URL = process.env.CANDIDATE_SERVICE_URL || "http://127.0.0.1:3002/api/candidates";
const BATCH_SIZE = parseInt(process.env.S3_BATCH_SIZE || "10");


function decrypt(ciphertext: string): string {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.ENCRYPTION_KEY || "");
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText) {
            return ciphertext;
        }
        return originalText;
    } catch (e) {
        return ciphertext;
    }
}


export async function processS3Account(credential: any, isManual: boolean = false) {
    const action = isManual ? "MANUAL" : "CRON";
    console.log(`[CRON] Checking S3 bucket ${credential.bucket} on ${credential.endpoint}...`);
    credential.secretKey = decrypt(credential.secretKey);
    const s3 = new S3Client({
        accessKeyId: credential.accessKey,
        secretAccessKey: credential.secretKey,
        endpoint: credential.endpoint,
        region: credential.region,
        bucket: credential.bucket
    });

    try {
        const lastChecked = credential.lastChecked;
        const result = await s3.list();

        if (!result || !result.contents) {
            console.log(`[CRON] No objects found in bucket ${credential.bucket}`);
            return;
        }

        const newPdfs = result.contents.filter((obj: any) => {
            const isPdf = obj.key.toLowerCase().endsWith(".pdf");
            const isNew = new Date(obj.lastModified) > lastChecked;
            return isPdf && isNew;
        });

        if (newPdfs.length === 0) {
            console.log(`[CRON] No new PDF files found in bucket ${credential.bucket} since ${lastChecked.toISOString()}`);
            return;
        }

        console.log(`[CRON] Found ${newPdfs.length} new PDF files in bucket ${credential.bucket}`);

        await prisma.serviceLog.create({
            data: {
                companyId: credential.companyId,
                service: "S3",
                action: action,
                status: "INFO",
                message: `Found ${newPdfs.length} new PDF files in bucket ${credential.bucket}`
            }
        });

        const batch: { filePath: string, fileName: string }[] = [];

        let mcpToken: string | undefined;
        if (credential.companyId) {
            const company = await prisma.company.findUnique({
                where: { id: credential.companyId },
                select: { mcpToken: true }
            });
            mcpToken = company?.mcpToken || undefined;
        }

        for (const obj of newPdfs) {
            console.log(`[CRON] Downloading ${obj.key}...`);
            const s3File = s3.file(obj.key);
            const fileName = obj.key.split('/').pop() || "unnamed.pdf";
            const filePath = join(TMP_DIR, `${Date.now()}_${fileName}`);

            await Bun.write(filePath, s3File);
            console.log(`[CRON] Saved ${obj.key} to ${filePath}`);

            batch.push({ filePath, fileName });

            // Log processing file
            await prisma.serviceLog.create({
                data: {
                    companyId: credential.companyId,
                    service: "S3",
                    action: action,
                    status: "SUCCESS",
                    message: `Processed file from S3`,
                    fileName: fileName
                }
            });

            if (batch.length >= BATCH_SIZE) {
                await handleDocumentsBulk(batch, credential.companyId, mcpToken);
                batch.length = 0;
            }
        }

        if (batch.length > 0) {
            await handleDocumentsBulk(batch, credential.companyId, mcpToken);
        }

        await prisma.s3Credential.update({
            where: { id: credential.id },
            data: { lastChecked: new Date() }
        });

    } catch (err) {
        console.error(`[CRON] Failed to process S3 account ${credential.bucket}:`, err);
    }
}

async function handleDocumentsBulk(items: { filePath: string, fileName: string }[], companyId: string | null, mcpToken?: string) {
    if (items.length === 0) return;

    try {
        const cvItems: { filePath: string, fileName: string }[] = [];
        const headers: Record<string, string> = {};
        if (mcpToken) {
            headers["Authorization"] = `Bearer ${mcpToken}`;
        }

        for (const item of items) {
            console.log(`[CRON] Detecting document type for ${item.fileName}...`);
            const fileData = await Bun.file(item.filePath).arrayBuffer();
            const formData = new FormData();
            formData.append("file", new File([fileData], item.fileName, { type: "application/pdf" }));

            const typeResponse = await fetch(`${CANDIDATE_SERVICE_URL}/document-type`, {
                method: "POST",
                headers: headers,
                body: formData
            });
            console.log("Type Response:", typeResponse);

            if (!typeResponse.ok) {
                console.error(`[CRON] Failed to check document type for ${item.fileName}: ${typeResponse.statusText}`);
                continue;
            }

            const typeResult: any = await typeResponse.json();
            if (typeResult.success && typeResult.type === "CV") {
                cvItems.push(item);
                console.log(`[CRON] ${item.fileName} detected as CV.`);
            } else {
                console.log(`[CRON] Ignoring non-CV document: ${item.fileName} (Type: ${typeResult.type || 'UNKNOWN'})`);
            }
        }

        if (cvItems.length > 0) {
            console.log(`[CRON] Creating candidates for ${cvItems.length} CVs in background...`);
            const bulkFormData = new FormData();
            for (const item of cvItems) {
                const fileData = await Bun.file(item.filePath).arrayBuffer();
                bulkFormData.append("files", new File([fileData], item.fileName, { type: "application/pdf" }));
            }
            bulkFormData.append("updateIfExists", "true");
            bulkFormData.append("background", "true");
            if (companyId) bulkFormData.append("companyId", companyId);

            const bulkResponse = await fetch(`${CANDIDATE_SERVICE_URL}/bulk`, {
                method: "POST",
                headers: headers,
                body: bulkFormData
            });

            if (!bulkResponse.ok) {
                console.error(`[CRON] Bulk create initiation failed: ${bulkResponse.statusText}`);
                return;
            }

            console.log(`[CRON] Bulk upload successful. Candidate service is now processing in the background.`);
        }
    } catch (err) {
        console.error(`[CRON] Error in bulk handling:`, err);
    } finally {
        for (const item of items) {
            const file = Bun.file(item.filePath);
            if (await file.exists()) {
                await file.delete();
                console.log(`[CRON] Cleaned up temporary file: ${item.filePath}`);
            }
        }
    }
}

export function startS3Cron() {
    const baker = Baker.create({
        onError: (error, jobName) => {
            console.error(`[CRONBake] Job ${jobName} failed:`, error.message);
        }
    });

    baker.add({
        name: "s3-processing",
        cron: "0 0 0 * * *", // Every 24 hours (midnight)
        callback: async () => {
            console.log("[CRON] Starting periodic S3 check...");
            const credentials = await prisma.s3Credential.findMany();
            for (const credential of credentials) {
                await processS3Account(credential);
            }
        },
        overrunProtection: true
    });

    baker.bakeAll();
    console.log("[CRON] S3 processing cron job started (every 24 hours)");
}
