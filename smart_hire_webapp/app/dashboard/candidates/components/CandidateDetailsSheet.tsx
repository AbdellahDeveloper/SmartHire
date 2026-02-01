"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent
} from "@/components/ui/sheet";
import Link from "next/link";

interface CandidateDetailsSheetProps {
    candidate: any | null;
    onOpenChange: (open: boolean) => void;
}

export function CandidateDetailsSheet({ candidate, onOpenChange }: CandidateDetailsSheetProps) {
    if (!candidate) return null;

    const parseJson = (val: any) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return []; }
        }
        return val || [];
    };

    const skills = parseJson(candidate.skills);
    const workExperiences = parseJson(candidate.workExperiences);
    const education = parseJson(candidate.education);
    const certificates = parseJson(candidate.certificates);
    const languages = parseJson(candidate.languages);
    const projects = parseJson(candidate.projects);
    const awards = parseJson(candidate.achievementsAwards);

    return (
        <Sheet open={!!candidate} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl p-0 bg-background border-l border-border">
                <ScrollArea className="h-full">
                    <div className="p-6 pb-20 space-y-8">
                        {/* Header Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border border-primary/20">
                                    {candidate.firstName[0]}{candidate.lastName[0]}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold text-foreground leading-tight">{candidate.fullName}</h2>
                                    <p className="text-primary font-medium">{candidate.currentJobTitle}</p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <Badge variant="secondary" className="bg-muted hover:bg-muted font-normal">
                                            {candidate.seniorityLevel}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-muted hover:bg-muted font-normal">
                                            {candidate.yearsTotalExperience} Years Exp
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/50">
                                {candidate.profileHighlight}
                            </p>

                            <div className="grid grid-cols-1 gap-4 text-sm mt-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span>Location <br /> <b>{candidate.city}, {candidate.country}</b></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span>Phone Number <br /> <b>{candidate.phoneNumber}</b></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span>Gender <br /> <b>{candidate.gender}</b></span>
                                </div>
                                <div className="flex items-center gap-2 text-primary hover:underline cursor-pointer font-medium">
                                    <Link href={candidate.cvUrl} target="_blank" rel="noopener noreferrer">
                                        <Button>View CV / Resume</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/60" />

                        {/* Skills Section */}
                        <Section title="Expertise & Skills">
                            <div className="flex flex-wrap gap-2">
                                {Array.isArray(skills) ? (
                                    skills.map((skill: any, i: number) => (
                                        <Badge key={i} variant="outline" className="bg-background border-border hover:border-primary/50 transition-colors">
                                            {typeof skill === 'string' ? skill : skill.name || skill.skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">No skills listed</span>
                                )}
                            </div>
                        </Section>

                        {/* Experience Section */}
                        <Section title="Work Experience">
                            <div className="space-y-6">
                                {workExperiences.map((exp: any, i: number) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-primary/20 space-y-2">
                                        <div className="absolute -left-[5px] top-1 size-2 rounded-full bg-primary" />
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-foreground">{exp.title || exp.jobTitle}</h4>
                                                <p className="text-sm text-primary/80 font-medium">{exp.company}</p>
                                            </div>
                                            <Badge variant="secondary" className="bg-muted text-[10px] font-normal">
                                                {exp.startDate} - {exp.endDate || 'Present'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{exp.description || exp.responsibilities}</p>
                                    </div>
                                ))}
                                {workExperiences.length === 0 && <p className="text-sm text-muted-foreground">No work experience listed</p>}
                            </div>
                        </Section>

                        {/* Education Section */}
                        <Section title="Education">
                            <div className="space-y-4">
                                {education.map((edu: any, i: number) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="bg-muted/50 p-2 rounded-lg h-fit">
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground">{edu.degree || edu.qualification}</h4>
                                            <p className="text-sm text-muted-foreground">{edu.institution || edu.school}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">{edu.year || edu.duration}</p>
                                        </div>
                                    </div>
                                ))}
                                {education.length === 0 && <p className="text-sm text-muted-foreground">No education listed</p>}
                            </div>
                        </Section>

                        {/* Projects / Awards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Section title="Certificates">
                                <div className="space-y-2">
                                    {certificates.map((cert: any, i: number) => (
                                        <div key={i} className="text-sm p-2 bg-muted/20 border border-border rounded-md">
                                            <p className="font-medium text-foreground">{cert.name || cert.title}</p>
                                            <p className="text-xs text-muted-foreground">{cert.issuer || cert.organization}</p>
                                        </div>
                                    ))}
                                    {certificates.length === 0 && <p className="text-xs text-muted-foreground">None</p>}
                                </div>
                            </Section>

                            <Section title="Languages">
                                <div className="flex flex-wrap gap-2">
                                    {languages.map((lang: any, i: number) => (
                                        <Badge key={i} variant="outline" className="text-xs capitalize">
                                            {typeof lang === 'string' ? lang : `${lang.language} - ${lang.level}`}
                                        </Badge>
                                    ))}
                                    {languages.length === 0 && <p className="text-xs text-muted-foreground">None</p>}
                                </div>
                            </Section>
                        </div>

                        <Section title="Achievements">
                            <ul className="space-y-2">
                                {awards.map((award: any, i: number) => (
                                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                        <span className="text-primary">•</span>
                                        {typeof award === 'string' ? award : award.title || award.name}
                                    </li>
                                ))}
                                {awards.length === 0 && <p className="text-xs text-muted-foreground">None listed</p>}
                            </ul>
                        </Section>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-foreground tracking-tight">{title}</h3>
            </div>
            {children}
        </div>
    );
}
