import { generateText, Output } from 'ai'
import { getModel } from '../lib/ai-provider'
import prisma from '../lib/prisma'
import { indexCandidate } from '../lib/search'
import { getSignedUrl, uploadCV } from '../lib/storage'
import { cvAIRequestSchema, type CVAIRequest } from '../models/candidate.schema'

export const extractCandidateData = async (file: File): Promise<{ success: boolean; data?: CVAIRequest; message?: string }> => {
    try {
        if (!file) {
            return { success: false, message: 'File must be provided' }
        }

        const model = await getModel()

        const buffer = await file.arrayBuffer()
        const content = [{
            type: 'file' as const,
            data: new Uint8Array(buffer),
            mediaType: 'application/pdf'
        }]

        console.log(`[DEBUG] Calling generateText for file: ${file.name}, size: ${file.size}`);
        const { output: extractedData } = await generateText({
            model,
            output: Output.object({ schema: cvAIRequestSchema }),
            system: 'You are an HR expert specializing in CV parsing. Extract all candidate details accurately. Follow the field descriptions closely. In English.',
            messages: [{ role: 'user', content }]
        })
        console.log(`[DEBUG] generateText finished for file: ${file.name}`);

        return { success: true, data: extractedData }
    } catch (error: any) {
        console.error("AI Extraction Error:", error);
        return { success: false, message: `Extraction failed: ${error.message}` }
    }
}

const BATCH_SIZE = 10

type DocumentType = 'CV' | 'JOB' | 'NONE'

export const getDocumentType = async (file: File): Promise<{ success: boolean; type: DocumentType; reasoning?: string }> => {
    try {
        const options = ['CV', 'JOB', 'NONE']
        if (!file) {
            return { success: false, type: 'NONE' }
        }

        const model = await getModel()

        const buffer = await file.arrayBuffer()
        const content = [{
            type: 'file' as const,
            data: buffer,
            mediaType: 'application/pdf'
        }]

        const { output: result } = await generateText({
            model,
            output: Output.choice({ options }),
            system: "You are an expert recruitment document classifier. Determine if the provided document is a CV, a Job Description (JOB), or neither (NONE). \n- Select 'CV' if the content describes a person's experience, education, and skills. \n- Select 'JOB' if the content describes a position's responsibilities and requirements. \n- Select 'NONE' if the document is neither. \nRespond strictly with only the category name.",
            messages: [{ role: 'user', content }]
        })
        const validResult = options.includes(result) ? result as DocumentType : 'NONE'
        return { success: true, type: validResult, reasoning: result }
    } catch (error: any) {
        return { success: false, type: 'NONE', reasoning: error.message }
    }
}


export const createCandidate = async (file: File, companyId: string, jobId?: string, updateIfExists: boolean = false) => {

    try {
        if (!file) {
            return { success: false, message: "A PDF file is required to create a candidate" };
        }

        console.log(`[DEBUG] Starting extraction for ${file.name}...`);
        const extraction = await extractCandidateData(file);
        if (!extraction.success || !extraction.data) {
            console.log(`[DEBUG] Extraction failed for ${file.name}: ${extraction.message}`);
            return { success: false, message: extraction.message || "Failed to extract data from CV" };
        }
        console.log(`[DEBUG] Extraction successful for ${file.name}. Candidate: ${extraction.data.full_name}`);

        const data = extraction.data;

        const existingCandidate = await prisma.candidate.findFirst({
            where: {
                fullName: data.full_name,
                email: data.email,
                phoneNumber: data.phone_number,
                companyId: companyId
            }

        });

        if (existingCandidate) {
            if (!updateIfExists) {
                return {
                    success: false,
                    message: "Candidate with this name, email, and phone already exists. Set updateIfExists to true to update.",
                    candidateId: existingCandidate.id,
                    isDuplicate: true
                };
            }

            const updatedCandidate = await prisma.candidate.update({
                where: { id: existingCandidate.id },
                data: {
                    firstName: data.first_name,
                    lastName: data.last_name,
                    fullName: data.full_name,
                    city: data.city,
                    country: data.country,
                    phoneNumber: data.phone_number,
                    email: data.email,
                    gender: data.gender,
                    thumbnailUrl: data.thumbnail_url,
                    profileHighlight: data.profile_highlight,
                    currentJobTitle: data.current_job_title,
                    yearsTotalExperience: Number(data.years_total_experience || 0),
                    seniorityLevel: data.seniority_level,
                    skills: data.skills || [],
                    workExperiences: data.work_experiences || [],
                    education: data.education || [],
                    certificates: data.certificates || [],
                    languages: data.languages || [],
                    projects: data.projects || [],
                    achievementsAwards: data.achievements_awards || [],
                    jobId: jobId || existingCandidate.jobId,
                    status: 'ready'
                }
            });

            const fileKey = `${updatedCandidate.id}.pdf`;
            const finalCvUrl = await uploadCV(file, fileKey);

            const finalCandidate = await prisma.candidate.update({
                where: { id: updatedCandidate.id },
                data: { cvUrl: finalCvUrl }
            });

            await indexCandidate(finalCandidate);

            return {
                success: true,
                message: 'Candidate updated effectively from new CV',
                candidateId: finalCandidate.id,
                candidate: finalCandidate
            };
        }

        const candidate = await prisma.candidate.create({
            data: {
                companyId: companyId,
                firstName: data.first_name,

                lastName: data.last_name,
                fullName: data.full_name,
                city: data.city,
                country: data.country,
                phoneNumber: data.phone_number,
                email: data.email,
                gender: data.gender,
                cvUrl: "",
                thumbnailUrl: data.thumbnail_url,
                profileHighlight: data.profile_highlight,
                currentJobTitle: data.current_job_title,
                yearsTotalExperience: Number(data.years_total_experience || 0),
                seniorityLevel: data.seniority_level,
                skills: data.skills || [],
                workExperiences: data.work_experiences || [],
                education: data.education || [],
                certificates: data.certificates || [],
                languages: data.languages || [],
                projects: data.projects || [],
                achievementsAwards: data.achievements_awards || [],
                jobId: jobId || null,
                status: 'ready'
            }
        })

        const fileKey = `${candidate.id}.pdf`;
        const finalCvUrl = await uploadCV(file, fileKey);

        const updatedCandidate = await prisma.candidate.update({
            where: { id: candidate.id },
            data: { cvUrl: finalCvUrl }
        });

        await indexCandidate(updatedCandidate)

        return {
            success: true,
            message: 'Candidate created successfully from CV',
            candidateId: updatedCandidate.id,
            candidate: updatedCandidate
        }
    } catch (error: any) {
        console.error("❌ Create Candidate Error:", error);
        return { success: false, message: error.message }
    }
}

export const createCandidateFromPdfUrl = async (url: string, companyId: string, jobId?: string, updateIfExists: boolean = false) => {
    try {
        console.log(`[DEBUG] Fetching PDF from URL: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            return { success: false, message: `Failed to fetch PDF from URL: ${response.statusText}` };
        }

        const buffer = await response.arrayBuffer();
        const fileName = url.split('/').pop() || 'cv.pdf';
        const file = new File([buffer], fileName, { type: 'application/pdf' });

        return await createCandidate(file, companyId, jobId, updateIfExists);

    } catch (error: any) {
        console.error("❌ Create Candidate from URL Error:", error);
        return { success: false, message: error.message };
    }
}

export const getCandidateById = async (id: string, companyId: string) => {
    try {
        const candidate = await prisma.candidate.findFirst({
            where: { id, companyId }
        })
        if (!candidate) return { success: false, message: 'Candidate not found or access denied' }

        // Refresh signed URL for 1 day
        const fileKey = `${candidate.id}.pdf`
        try {
            const signedUrl = await getSignedUrl(fileKey, 86400)
            candidate.cvUrl = signedUrl
        } catch (error) {
            console.warn(`Could not generate signed URL for candidate ${id}:`, error)
        }

        return { success: true, candidate }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

export async function* bulkCreateCandidates(files: File[], companyId: string, jobId?: string, updateIfExists: boolean = false) {
    console.log(`Starting bulk upload of ${files.length} CVs for company ${companyId}...`);

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const index = i + 1

        yield {
            event: "progress",
            data: { message: `Parsing candidate #${index}: ${file.name}` }
        }

        try {
            const result = await createCandidate(file, companyId, jobId, updateIfExists)


            if (result.success) {
                console.log(`[SUCCESS] #${index} Candidate CV parsed successfully: ${result.candidate?.fullName}`);
                yield {
                    event: "result",
                    data: {
                        status: "success",
                        index,
                        fullName: result.candidate?.fullName,
                        message: `Parsed successfully`
                    }
                }
            } else {
                console.log(`[FAILED] #${index} Candidate CV: ${result.message}`);
                yield {
                    event: "result",
                    data: {
                        status: "failed",
                        index,
                        message: result.message
                    }
                }
            }
        } catch (error: any) {
            console.log(`[ERROR] #${index} Candidate CV processing failed: ${error.message}`);
            yield {
                event: "result",
                data: {
                    status: "error",
                    index,
                    message: error.message
                }
            }
        }
    }

    console.log(`Bulk processing complete`);
    yield {
        event: "complete",
        data: { message: "Bulk processing complete" }
    }
}
