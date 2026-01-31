import Baker from "cronbake";
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from "fs";
import { ImapFlow } from "imapflow";
import { join } from "path";
import { pipeline } from "stream/promises";
import { prisma } from "../db";

const TMP_DIR = join(process.cwd(), "temp_attachments");
if (!existsSync(TMP_DIR)) {
    mkdirSync(TMP_DIR);
}

const CANDIDATE_SERVICE_URL = process.env.CANDIDATE_SERVICE_URL || "http://127.0.0.1:3002/api/candidates";
const BATCH_SIZE = 5;

async function processEmailAccount(userMail: {
    lastChecked: Date;
    id: string;
    server: string;
    port: number;
    email: string;
    password: string;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
}) {
    console.log(`[CRON] Checking emails for ${userMail.email}...`);

    const client = new ImapFlow({
        host: userMail.server,
        port: userMail.port,
        secure: true,
        auth: {
            user: userMail.email,
            pass: userMail.password,
        },
        logger: false
    });

    try {
        await client.connect();
        const lock = await client.getMailboxLock("INBOX");

        try {
            const sinceDate = userMail.lastChecked;

            const searchCriteria = {
                since: sinceDate
            };
            const uids = await client.search(searchCriteria, { uid: true });
            if (!uids || uids.length === 0) {
                console.log(`[CRON] No new messages found since ${sinceDate.toISOString()}`);
                return;
            }
            console.log(`[CRON] Found ${uids.length} potential messages since ${sinceDate.toISOString()}`);

            const batch: { filePath: string, fileName: string }[] = [];

            for (const uid of uids) {
                const msg = await client.fetchOne(uid.toString(), {
                    envelope: true,
                    bodyStructure: true,
                    internalDate: true
                }, { uid: true });

                if (!msg) continue;
                if (msg.internalDate && msg.internalDate <= sinceDate) continue;

                const fromAddress = msg.envelope?.from?.[0]?.address || 'unknown';
                console.log(`[CRON] Processing message UID: ${msg.uid} from ${fromAddress}`);

                const parts = findPdfParts(msg.bodyStructure);

                for (const part of parts) {
                    if (part.size > 3 * 1024 * 1024) {
                        console.log(`[CRON] Skipping large attachment: ${part.fileName} (${(part.size / 1024 / 1024).toFixed(2)} MB)`);
                        continue;
                    }

                    console.log(`[CRON] Downloading attachment: ${part.fileName}...`);

                    const { content } = await client.download(msg.uid.toString(), part.part, { uid: true });

                    if (!content) {
                        console.error(`[CRON] Failed to get content stream for ${part.fileName}`);
                        continue;
                    }

                    const filePath = join(TMP_DIR, part.fileName || `attachment_${msg.uid}_${part.part}.pdf`);

                    try {
                        const writeStream = createWriteStream(filePath);
                        await pipeline(content, writeStream);
                        console.log(`[CRON] Saved ${part.fileName} to disk`);

                        const file = Bun.file(filePath);
                        const fileSize = file.size;

                        if (fileSize === 0) {
                            throw new Error("Downloaded file is empty");
                        }

                        batch.push({ filePath, fileName: part.fileName || `attachment_${msg.uid}_${part.part}.pdf` });

                        if (batch.length >= BATCH_SIZE) {
                            await handleDocumentsBulk(batch, userMail.companyId);
                            batch.length = 0;
                        }

                    } catch (err) {
                        console.error(`[CRON] Error processing attachment ${part.fileName}:`, err);
                        if (existsSync(filePath)) {
                            unlinkSync(filePath);
                        }
                    }
                }
            }

            if (batch.length > 0) {
                await handleDocumentsBulk(batch, userMail.companyId);
            }

            await prisma.userMail.update({
                where: { id: userMail.id },
                data: { lastChecked: new Date() }
            });

        } finally {
            lock.release();
        }

        await client.logout();
    } catch (err) {
        console.error(`[CRON] Failed to process account ${userMail.email}:`, err);
    }
}

export function findPdfParts(structure: any, parts: any[] = []) {
    if (!structure) return parts;

    if (structure.childNodes) {
        for (const child of structure.childNodes) {
            findPdfParts(child, parts);
        }
    } else {
        const fileName = structure.parameters?.name ||
            structure.dispositionParameters?.filename ||
            structure.params?.name;

        const isPdf = structure.type === "application/pdf" ||
            (fileName?.toLowerCase()?.endsWith(".pdf"));

        if (isPdf) {
            parts.push({
                part: structure.part,
                fileName: fileName || "attachment.pdf",
                size: structure.size || 0
            });
        }
    }

    return parts;
}

async function handleDocumentsBulk(items: { filePath: string, fileName: string }[], companyId: string) {
    if (items.length === 0) return;

    try {
        const cvItems: { filePath: string, fileName: string }[] = [];

        for (const item of items) {
            console.log(`[CRON] Detecting document type for ${item.fileName}...`);
            const fileData = await Bun.file(item.filePath).arrayBuffer();
            const formData = new FormData();
            formData.append("file", new File([fileData], item.fileName, { type: "application/pdf" }));

            const typeResponse = await fetch(`${CANDIDATE_SERVICE_URL}/document-type`, {
                method: "POST",
                body: formData
            });

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
            bulkFormData.append("companyId", companyId);

            const bulkResponse = await fetch(`${CANDIDATE_SERVICE_URL}/bulk`, {
                method: "POST",
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
            if (existsSync(item.filePath)) {
                unlinkSync(item.filePath);
                console.log(`[CRON] Cleaned up temporary file: ${item.filePath}`);
            }
        }
    }
}

export function startEmailCron() {
    const baker = Baker.create({
        onError: (error, jobName) => {
            console.error(`[CRONBake] Job ${jobName} failed:`, error.message);
        }
    });

    baker.add({
        name: "email-processing",
        cron: process.env.EMAIL_CHECK_CRON || "0 */15 * * * *",
        callback: async () => {
            console.log("[CRON] Starting periodic email check...");
            const accounts = await prisma.userMail.findMany();
            for (const account of accounts) {
                await processEmailAccount(account);
            }
        },
        overrunProtection: true
    });

    baker.bakeAll();
    console.log("[CRON] Email processing cron job started (every 15 mins)");
}
