import fs from 'node:fs';
import path from 'node:path';

const RESUMES_DIR = path.join(process.cwd(), 'All_Resumes');
const ENDPOINT = 'http://localhost:3002/api/candidates/bulk';
const TOKEN = 'b750f7785086d3f14f20cdb8';
const BATCH_SIZE = 20; // Send 20 files at a time to stay within request size limits

async function pushResumes() {
    try {
        console.log(`Scanning directory: ${RESUMES_DIR}...`);
        const files = fs.readdirSync(RESUMES_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
        console.log(`Found ${files.length} PDF files.`);

        const totalBatches = Math.ceil(files.length / BATCH_SIZE);

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const formData = new FormData();

            const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
            console.log(`[${currentBatchNum}/${totalBatches}] Processing batch of ${batch.length} files...`);

            for (const fileName of batch) {
                const filePath = path.join(RESUMES_DIR, fileName);
                const fileBuffer = fs.readFileSync(filePath);
                const blob = new Blob([fileBuffer], { type: 'application/pdf' });
                formData.append('files', blob, fileName);
            }

            // We use background=true to avoid long-running connections and SSE overhead for the script
            formData.append('background', 'true');

            try {
                const response = await fetch(ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[${currentBatchNum}/${totalBatches}] Error: ${response.status} - ${errorText}`);
                } else {
                    const result = await response.json();
                    console.log(`[${currentBatchNum}/${totalBatches}] Successfully initiated: ${JSON.stringify(result)}`);
                }
            } catch (error) {
                console.error(`[${currentBatchNum}/${totalBatches}] Connection failed:`, error);
            }

            // Small cooldown between batches
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('All batches sent.');
    } catch (err) {
        console.error('Fatal execution error:', err);
    }
}

pushResumes();
