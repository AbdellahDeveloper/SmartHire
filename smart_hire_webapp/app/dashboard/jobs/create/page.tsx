"use client";

import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkillsInput } from "@/components/ui/skills-input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { ChevronLeftIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { createJob } from "../actions";

export default function CreateJobPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        seniorityLevel: "mid",
        domain: "Engineering",
        industry: "Technology",
        location: "Remote",
        workMode: "remote",
        employmentType: "full-time",
        salaryMin: "",
        salaryMax: "",
        salaryCurrency: "USD",
        description: "",
        responsibilities: "",
        educationLevel: "bachelor",
        skills: [] as string[],
        niceToHaveSkills: [] as string[]
    });

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        const companyId = (session?.user as { companyId?: string })?.companyId;
        if (!companyId) {
            toast.error("Company ID not found");
            return;
        }

        setLoading(true);
        try {
            await createJob(companyId, {
                ...formData,
                skills: formData.skills.join(","),
                niceToHaveSkills: formData.niceToHaveSkills.join(",")
            });
            toast.success("Job posted successfully");
            router.push("/dashboard/jobs");
            router.refresh();
        } catch (error) {
            toast.error("Failed to create job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] py-12 px-4">
            <div className="w-full mb-6 flex justify-start">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Link href="/dashboard/jobs" className="flex flex-row">
                        <ChevronLeftIcon className="mr-2 h-4 w-4" />
                        Back to Jobs
                    </Link>
                </Button>
            </div>

            <div className="relative w-full max-w-3xl bg-background p-8 border border-border rounded-xl">
                <div className="-left-px -inset-y-6 absolute w-px bg-border/50" />
                <div className="-right-px -inset-y-6 absolute w-px bg-border/50" />
                <div className="-top-px -inset-x-6 absolute h-px bg-border/50" />
                <div className="-bottom-px -inset-x-6 absolute h-px bg-border/50" />

                <PlusIcon
                    className="-left-[12.5px] -top-[12.5px] absolute size-6 text-muted-foreground/40"
                    strokeWidth={0.5}
                />
                <PlusIcon
                    className="-right-[12.5px] -bottom-[12.5px] absolute size-6 text-muted-foreground/40"
                    strokeWidth={0.5}
                />

                <div className="items-left flex flex-col justify-center rounded-md border border-border bg-card/50 p-6 shadow-xs outline outline-border/50 outline-offset-1 mb-8">
                    <h2 className="font-semibold text-2xl text-foreground">Post a New Job</h2>
                    <p className="text-muted-foreground text-sm">
                        Fill in the details for your new position. All fields are tracked in our matching system.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <FieldGroup className="space-y-6">
                        {/* Basic Info Block */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field className="gap-2">
                                    <FieldLabel htmlFor="title" className="text-foreground/80">Job Title</FieldLabel>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Senior Frontend Engineer"
                                        className="bg-card/50 border-border text-foreground"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field className="gap-2">
                                    <FieldLabel htmlFor="domain" className="text-foreground/80">Domain</FieldLabel>
                                    <Input
                                        id="domain"
                                        placeholder="e.g., Engineering"
                                        className="bg-card/50 border-border text-foreground"
                                        value={formData.domain}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                        required
                                    />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field className="gap-2">
                                    <FieldLabel htmlFor="industry" className="text-foreground/80">Industry</FieldLabel>
                                    <Input
                                        id="industry"
                                        placeholder="e.g., Technology, Finance"
                                        className="bg-card/50 border-border text-foreground"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field className="gap-2">
                                    <FieldLabel className="text-foreground/80">Education Level</FieldLabel>
                                    <Select
                                        value={formData.educationLevel}
                                        onValueChange={(val) => setFormData({ ...formData, educationLevel: val || "" })}
                                    >
                                        <SelectTrigger className="bg-card/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            <SelectItem value="high-school">High School</SelectItem>
                                            <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                                            <SelectItem value="master">Master&apos;s Degree</SelectItem>
                                            <SelectItem value="phd">PhD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                        </div>

                        {/* Work Details Block */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Work Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field className="gap-2">
                                    <FieldLabel className="text-foreground/80">Seniority</FieldLabel>
                                    <Select
                                        value={formData.seniorityLevel}
                                        onValueChange={(val) => setFormData({ ...formData, seniorityLevel: val || "" })}
                                    >
                                        <SelectTrigger className="bg-card/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            <SelectItem value="junior">Junior</SelectItem>
                                            <SelectItem value="mid">Mid-Level</SelectItem>
                                            <SelectItem value="senior">Senior</SelectItem>
                                            <SelectItem value="lead">Lead/Principal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field className="gap-2">
                                    <FieldLabel className="text-foreground/80">Work Mode</FieldLabel>
                                    <Select
                                        value={formData.workMode}
                                        onValueChange={(val) => setFormData({ ...formData, workMode: val || "" })}
                                    >
                                        <SelectTrigger className="bg-card/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            <SelectItem value="remote">Remote</SelectItem>
                                            <SelectItem value="hybrid">Hybrid</SelectItem>
                                            <SelectItem value="onsite">On-site</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Field className="gap-2">
                                    <FieldLabel htmlFor="location" className="text-foreground/80">Location</FieldLabel>
                                    <Input
                                        id="location"
                                        placeholder="e.g., Remote or New York, NY"
                                        className="bg-card/50 border-border text-foreground"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field className="gap-2">
                                    <FieldLabel className="text-foreground/80">Employment Type</FieldLabel>
                                    <Select
                                        value={formData.employmentType}
                                        onValueChange={(val) => setFormData({ ...formData, employmentType: val || "" })}
                                    >
                                        <SelectTrigger className="bg-card/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            <SelectItem value="full-time">Full-time</SelectItem>
                                            <SelectItem value="contract">Contract</SelectItem>
                                            <SelectItem value="internship">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                        </div>

                        {/* Salary Block */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Compensation</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Field className="gap-2">
                                    <FieldLabel htmlFor="salaryMin" className="text-foreground/80">Min Salary</FieldLabel>
                                    <Input
                                        id="salaryMin"
                                        type="number"
                                        placeholder="0"
                                        className="bg-card/50 border-border text-foreground"
                                        value={formData.salaryMin}
                                        onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field className="gap-2">
                                    <FieldLabel htmlFor="salaryMax" className="text-foreground/80">Max Salary</FieldLabel>
                                    <Input
                                        id="salaryMax"
                                        type="number"
                                        placeholder="0"
                                        className="bg-card/50 border-border text-foreground"
                                        value={formData.salaryMax}
                                        onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field className="gap-2">
                                    <FieldLabel className="text-foreground/80">Currency</FieldLabel>
                                    <Select
                                        value={formData.salaryCurrency}
                                        onValueChange={(val) => setFormData({ ...formData, salaryCurrency: val || "" })}
                                    >
                                        <SelectTrigger className="bg-card/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                            <SelectItem value="MAD">MAD (DH)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                        </div>

                        {/* Skills Block */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Required Skills</h3>
                            <Field className="gap-2">
                                <FieldLabel htmlFor="skills" className="text-foreground/80">Must Have Skills</FieldLabel>
                                <SkillsInput
                                    value={formData.skills}
                                    onChange={(skills) => setFormData({ ...formData, skills })}
                                    placeholder="Type and press comma..."
                                />
                            </Field>
                            <Field className="gap-2">
                                <FieldLabel htmlFor="niceToHaveSkills" className="text-foreground/80">Nice to Have Skills</FieldLabel>
                                <SkillsInput
                                    value={formData.niceToHaveSkills}
                                    onChange={(niceToHaveSkills) => setFormData({ ...formData, niceToHaveSkills })}
                                    placeholder="Type and press comma..."
                                />
                            </Field>
                        </div>

                        {/* Content Block */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Job Content</h3>
                            <Field className="gap-2">
                                <FieldLabel htmlFor="description" className="text-foreground/80">Full Description</FieldLabel>
                                <Textarea
                                    id="description"
                                    placeholder="Provide a detailed description of the role..."
                                    className="bg-card/50 border-border text-foreground min-h-[120px]"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </Field>
                            <Field className="gap-2">
                                <FieldLabel htmlFor="responsibilities" className="text-foreground/80">Specific Responsibilities</FieldLabel>
                                <Textarea
                                    id="responsibilities"
                                    placeholder="List the key responsibilities..."
                                    className="bg-card/50 border-border text-foreground min-h-[120px]"
                                    value={formData.responsibilities}
                                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                                />
                                <FieldDescription className="text-muted-foreground/60">
                                    Optional: Specific day-to-day tasks.
                                </FieldDescription>
                            </Field>
                        </div>
                    </FieldGroup>

                    <div className="mt-8">
                        <Button
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6 text-lg"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Creating..." : "Post Job Position"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
