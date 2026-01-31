import { generateText } from 'ai';
import { pdf } from 'podpdf';
import { getModel } from '../lib/ai-provider';
import { MatchResult } from '../lib/matching.types';
import prisma from '../lib/prisma';
import { uploadToS3 } from '../lib/s3';

const renderMultilineText = (doc: any, text: string, x: number, startY: number, options: { size: number, maxWidth: number }) => {
    const lines = text.split('\n');
    let currentY = startY;
    const lineHeight = options.size * 1.4;

    for (let line of lines) {
        let content = line.trim();
        if (content === '') {
            currentY += lineHeight * 0.8;
            continue;
        }

        let weight = 'normal';
        // If the line starts and ends with bold markers, or is very short and starts with it (header style)
        if ((content.startsWith('**') && content.endsWith('**')) || (content.startsWith('*') && content.endsWith('*'))) {
            weight = 'bold';
        } else if (content.startsWith('**') && content.length < 50) {
            weight = 'bold';
        }

        // Clean up all markdown stars for a professional look
        content = content.replace(/\*\*/g, '').replace(/\*/g, '');

        doc.text(content, x, currentY, { ...options, weight, maxWidth: options.maxWidth });

        // Accurate lines estimation for podpdf wrapping
        const charsPerLine = options.maxWidth / (options.size * 0.5);
        const segments = content.length / charsPerLine;
        const linesUsed = Math.ceil(segments) || 1;

        currentY += lineHeight * linesUsed;

        if (currentY > 780) {
            doc.page();
            currentY = 50;
        }
    }
    return currentY;
};

export const generateContract = async (body: {
    candidateId: string;
    jobId?: string;
    jobDescription?: string;
    date: string;
    companyId: string;
}) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: body.companyId }
        });

        const companyName = company?.name || "THE COMPANY";

        const candidate = await prisma.candidate.findUnique({
            where: { id: body.candidateId }
        });

        if (!candidate) {
            throw new Error(`Candidate with ID ${body.candidateId} not found`);
        }

        let jobTitle = "Position";
        let jobDescription = body.jobDescription || "";

        if (body.jobId) {
            const job = await prisma.job.findUnique({
                where: { id: body.jobId }
            });
            if (job) {
                jobTitle = job.title;
                jobDescription = job.description;
            }
        }

        if (!jobDescription) {
            throw new Error("Job description or a valid Job ID is required");
        }

        const model = await getModel();

        const { text: contractContent } = await generateText({
            model,
            system: `You are a legal expert specializing in employment contracts. Generate a professional employment contract. Use '${companyName}' as the employer name. IMPORTANT: Use double newlines between sections. Use **SECTION TITLE** on its own line for headers. Do not use inline bolding within paragraphs. Use straight quotes (') and avoid special symbols.`,
            prompt: `
                Employer: ${companyName}
                Candidate Name: ${candidate.fullName}
                Position: ${jobTitle}
                Job Description: ${jobDescription}
                Start Date: ${body.date}

                Generate the contract content. Include sections for:
                1. ENGAGEMENT
                2. RESPONSIBILITIES
                3. TERM
                4. COMPENSATION
                5. CONFIDENTIALITY
                6. TERMINATION

                Formatting Rules:
                - Use **SECTION TITLE** for headers.
                - Use plain text for body content.
                - Keep it professional and legally sound.
                - IMPORTANT: DO NOT include any signature lines, placeholders, or conclusions like 'IN WITNESS WHEREOF'. Stop immediately after the final section.
            `
        });

        const doc = pdf('A4')
            .rect(0, 0, 595, 60, { fill: '#1a1a2e' })
            .text(companyName, 50, 20, { size: 20, color: '#ffffff', weight: 'bold' })
            .text("EMPLOYMENT CONTRACT", 545, 22, { size: 16, color: '#4a9eff', weight: 'bold', align: 'right' })

            .text("This agreement is made on " + body.date, 50, 100, { size: 11 })
            .text("BETWEEN:", 50, 120, { size: 11, weight: 'bold' })
            .text(`${companyName} (The Employer)`, 70, 135, { size: 11 })
            .text("AND:", 50, 160, { size: 11, weight: 'bold' })
            .text(`${candidate.fullName} (The Employee)`, 70, 175, { size: 11 })

            .text("CONTRACT DETAILS", 50, 240, { size: 14, weight: 'bold', color: '#1a1a2e' })
            .line(50, 245, 545, 245, { color: '#eeeeee' });

        let finalY = renderMultilineText(doc, contractContent, 50, 270, { size: 10, maxWidth: 500 });

        if (finalY > 600) {
            doc.page();
            finalY = 50;
        } else {
            finalY += 30;
        }

        doc.text("SIGNATURES", 50, finalY, { size: 14, weight: 'bold' })
            .line(50, finalY + 5, 545, finalY + 5, { color: '#eeeeee' });

        doc.table(
            [
                ["\n\n\n\n", "\n\n\n\n"],
            ],
            50, finalY + 25,
            {
                columns: [
                    { header: `AUTHORITY REPRESENTATIVE Of ${companyName}`, width: 245, align: 'center' },
                    { header: candidate.fullName, width: 250, align: 'center' }
                ],
                headerBg: '#f8f9fa',
                headerColor: '#1a1a2e',
                borderColor: '#eeeeee',
                fontSize: 9,
                padding: 10,
            }
        );

        doc.text("Date of Signing: " + body.date, 50, finalY + 115, { size: 10 });

        const bytes = doc.build();
        const buffer = Buffer.from(bytes);

        const fileName = `contract_${candidate.fullName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const s3Info = await uploadToS3("contracts", fileName, buffer);

        return {
            success: true,
            message: "Contract generated and uploaded to S3",
            url: s3Info.url,
            s3Info
        };

    } catch (error: any) {
        console.error("Contract Generation Error:", error);
        return { success: false, message: error.message };
    }
}

export const generateMatchingReport = async (body: {
    jobId: string;
    matchResults: MatchResult[];
    companyId: string;
}) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: body.companyId }
        });

        const companyName = company?.name || "THE COMPANY";
        const job = await prisma.job.findUnique({
            where: { id: body.jobId }
        });

        if (!job) {
            throw new Error(`Job with ID ${body.jobId} not found`);
        }

        const model = await getModel();

        const { text: summaryText } = await generateText({
            model,
            system: "You are a recruitment consultant. Summarize matching results. Use **CANDIDATE NAME** on its own line as a header for each candidate summary. Do not use inline bolding (no stars inside paragraphs). Use double newlines between candidates. Use straight quotes (').",
            prompt: `
                Job Title: ${job.title}
                Match Results: ${JSON.stringify(body.matchResults)}

                Provide a professional summary of the top candidates. Use **Candidate Name** for headers.
            `
        });

        const doc = pdf('A4')
            .rect(0, 0, 595, 60, { fill: '#2c3e50' })
            .text(companyName, 50, 20, { size: 20, color: '#ffffff', weight: 'bold' })
            .text("CANDIDATE MATCHING REPORT", 545, 22, { size: 16, color: '#ecf0f1', weight: 'bold', align: 'right' })

            .text(`Job Position: ${job.title}`, 50, 90, { size: 14, weight: 'bold' })
            .text(`Date: ${new Date().toLocaleDateString()}`, 545, 90, { size: 10, align: 'right' });

        doc.text("JOB OVERVIEW", 50, 120, { size: 12, weight: 'bold' });
        doc.line(50, 125, 545, 125, { color: '#eeeeee' });
        const overviewY = renderMultilineText(doc, job.description, 50, 140, { size: 10, maxWidth: 500 });

        const executiveSummaryTitleY = Math.min(overviewY + 25, 780);
        doc.text("EXECUTIVE SUMMARY", 50, executiveSummaryTitleY, { size: 12, weight: 'bold' });
        doc.line(50, executiveSummaryTitleY + 5, 545, executiveSummaryTitleY + 5, { color: '#eeeeee' });
        const executiveSummaryY = executiveSummaryTitleY + 25;
        let currentY = renderMultilineText(doc, summaryText, 50, executiveSummaryY, { size: 10, maxWidth: 500 });

        // If we are too low, start a new page for the results
        if (currentY > 700) {
            doc.page();
            currentY = 50;
        }

        const titleY = currentY + 30;
        doc.text("MATCHING RESULTS", 50, titleY, { size: 12, weight: 'bold' });

        const tableY = titleY + 20;

        doc.table(
            body.matchResults.map(m => [
                m.candidateName,
                m.score.toString() + "%",
                (m.analysis?.matchedSkills || []).slice(0, 10).join(', ') + ((m.analysis?.matchedSkills?.length || 0) > 10 ? '...' : '')
            ]),
            50, tableY,
            {
                columns: [
                    { header: 'Candidate Name', width: 130 },
                    { header: 'Match Score', width: 70, align: 'center' },
                    { header: 'Matched Skills', width: 290 }
                ],
                headerBg: '#2c3e50',
                headerColor: '#ffffff',
                fontSize: 9
            }
        );

        const bytes = doc.build();
        const buffer = Buffer.from(bytes);

        const fileName = `matching_report_${job.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const s3Info = await uploadToS3("matching_reports", fileName, buffer);

        // Save to DB
        const dbReport = await prisma.matchingReport.create({
            data: {
                companyId: body.companyId,
                jobId: body.jobId,
                s3Key: s3Info.key,
                bucket: s3Info.bucket,
                url: s3Info.url
            }
        });

        return {
            success: true,
            message: "Matching report generated, uploaded to S3 and saved to DB",
            url: s3Info.url,
            s3Info,
            dbId: dbReport.id
        };

    } catch (error: any) {
        console.error("Report Generation Error:", error);
        return { success: false, message: error.message };
    }
}
