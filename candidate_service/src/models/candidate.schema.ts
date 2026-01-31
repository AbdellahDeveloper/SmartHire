import { z } from "zod";

export const cvAIRequestSchema = z.object({

    first_name: z.string().describe("The candidate's first name"),
    last_name: z.string().describe("The candidate's last name"),
    full_name: z.string().describe("The candidate's full name"),
    city: z.string().describe("City where the candidate is located"),
    country: z.string().describe("Country where the candidate is located"),

    phone_number: z.string().describe("Contact phone number"),
    email: z.string().describe("Contact email address"),
    gender: z.string().describe("The candidate's gender"),
    cv_url: z.string().describe("URL to the candidate's CV"),
    thumbnail_url: z.string().describe("URL to the candidate's auto-generated thumbnail image"),

    profile_highlight: z.string().describe("A brief summary of the candidate's professional profile"),
    current_job_title: z.string().describe("The candidate's current or most recent job title"),
    years_total_experience: z.number().describe("Total number of years of professional experience"),
    seniority_level: z.string().describe("Seniority level (junior, mid, senior, lead, or manager)"),

    skills: z.array(
        z.object({
            name: z.string().describe("Name of the skill"),
            category: z.string().describe("Category (e.g., programming, tool, soft skill)"),
            level: z.string().describe("Proficiency level (beginner, intermediate, advanced, or expert)"),
            years_experience: z.number().describe("Years of experience with this skill"),
        })
    ).describe("List of technical and soft skills"),

    work_experiences: z.array(
        z.object({
            job_title: z.string().describe("Role or job title"),
            company: z.string().describe("Name of the company"),
            industry: z.string().describe("Industry of the company"),
            location: z.string().describe("Job location (city/country)"),
            employment_type: z.string().describe("Type of employment (e.g., full-time, part-time, freelance)"),
            start_date: z.string().describe("Start date (YYYY-MM)"),
            end_date: z.string().describe("End date (YYYY-MM or 'present')"),
            duration_months: z.number().describe("Total duration in months"),
            responsibilities: z.array(z.string()).describe("List of main responsibilities"),
            achievements: z.array(z.string()).describe("List of key achievements"),
            skills_used: z.array(z.string()).describe("Technical skills utilized in this role"),
        })
    ).describe("Chronological work history"),

    education: z.array(
        z.object({
            degree_level: z.string().describe("Level of degree (e.g., bachelor, master, phd)"),
            degree_name: z.string().describe("Official name of the degree"),
            field_of_study: z.string().describe("The major or field of study"),
            institution: z.string().describe("Name of the school or university"),
            start_year: z.number().describe("Year started"),
            end_year: z.number().describe("Year ended"),
            gpa: z.number().describe("Grade Point Average (numeric value)"),
        })
    ).describe("Educational qualifications"),

    certificates: z.array(
        z.object({
            name: z.string().describe("Name of the certification"),
            issuer: z.string().describe("Entity that issued the certificate"),
            year: z.number().describe("Year of issuance"),
            credential_id: z.string().describe("Unique identifier for the credential"),
        })
    ).describe("Professional certifications"),

    languages: z.array(
        z.object({
            language: z.string().describe("Name of the language"),
            proficiency: z.string().describe("Proficiency level (e.g., native, fluent, basic)"),
        })
    ).describe("Languages spoken"),

    projects: z.array(
        z.object({
            name: z.string().describe("Name of the project"),
            role: z.string().describe("Candidate's role in the project"),
            description: z.string().describe("Brief overview of the project"),
            technologies: z.array(z.string()).describe("Technologies used"),
        })
    ).describe("Notable projects"),

    achievements_awards: z.array(
        z.object({
            title: z.string().describe("Award or achievement title"),
            year: z.number().describe("Year received"),
            description: z.string().describe("Description of the achievement"),
        })
    ).describe("Awards and recognitions"),

});

export const candidateSchema = z.object({
    id: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    city: z.string(),
    country: z.string(),
    phoneNumber: z.string(),
    email: z.string(),
    gender: z.string(),
    cvUrl: z.string(),
    thumbnailUrl: z.string().optional(),
    profileHighlight: z.string(),
    currentJobTitle: z.string(),
    yearsTotalExperience: z.number(),
    seniorityLevel: z.string(),
    skills: z.array(z.any()),
    workExperiences: z.array(z.any()),
    education: z.array(z.any()),
    certificates: z.array(z.any()),
    languages: z.array(z.any()),
    projects: z.array(z.any()),
    achievementsAwards: z.array(z.any()),
    jobId: z.string().optional(),
    status: z.enum(["processing", "ready", "rejected", "archived"]).default("ready"),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export type CVAIRequest = z.infer<typeof cvAIRequestSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
