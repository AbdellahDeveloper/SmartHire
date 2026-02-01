"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Briefcase, CalendarIcon, Clock, FilterX, MapPin, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { deleteJob, getAllCompanies, getJobs } from "./actions";

export default function JobsPage() {
    const { data: session } = useSession();
    const role = (session?.user as { role?: string })?.role || "company";
    const userCompanyId = (session?.user as { companyId?: string })?.companyId;

    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Filters state
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    useEffect(() => {
        if (role === "admin") {
            loadCompanies();
        }
    }, [role]);

    const loadCompanies = async () => {
        try {
            const data = await getAllCompanies();
            setCompanies(data);
        } catch (error) {
            console.error("Failed to load companies", error);
        }
    };

    const loadJobs = useCallback(async () => {
        setLoading(true);
        try {
            const filters: any = {
                page,
                limit,
                q: debouncedSearch || undefined,
                startDate: date?.from,
                endDate: date?.to,
            };

            if (role === "admin") {
                if (selectedCompanyId !== "all") {
                    filters.companyId = selectedCompanyId;
                }
            } else {
                if (userCompanyId) {
                    filters.companyId = userCompanyId;
                }
            }

            const result = await getJobs(filters);
            setJobs(result.jobs);
            setTotalPages(result.totalPages);
        } catch (error) {
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, selectedCompanyId, date, role, userCompanyId]);

    useEffect(() => {
        if (session?.user) {
            loadJobs();
        }
    }, [loadJobs, session]);

    const handleClearFilters = () => {
        setSearchQuery("");
        setSelectedCompanyId("all");
        setDate(undefined);
        setPage(1);
    };
    const getCurrencySymbol = (currency: string) => {
        switch (currency) {
            case "MAD":
                return "DH";
            case "EUR":
                return "€";
            case "GBP":
                return "£";
            case "USD":
                return "$";
            default:
                return "";
        }
    };

    const handleDeleteJob = async (id: string) => {
        try {
            await deleteJob(id);
            toast.success("Job deleted");
            loadJobs();
        } catch {
            toast.error("Failed to delete job");
        }
    };

    return (
        <>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Jobs</h2>
                        <p className="text-muted-foreground">Manage and filter through open positions.</p>
                    </div>

                    {role === "company" && (
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Link href="/dashboard/jobs/create" className="flex items-center">
                                <Plus className="w-4 h-4 mr-2" />
                                Post New Job
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Filters Bar */}
                <div className="flex flex-row items-end gap-4 p-4 rounded-xl border border-border bg-card/30 backdrop-blur-sm">
                    <div className="space-y-2 w-full">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by keyword, skills..."
                                className="pl-10 bg-muted/50 border-border"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {role === "admin" && (
                        <div className="flex flex-col gap-2 w-full">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</Label>
                            <Select value={selectedCompanyId} onValueChange={(val) => { setSelectedCompanyId(val || ""); setPage(1); }}>
                                <SelectTrigger className="bg-muted/50 border-border w-full">
                                    <SelectValue>
                                        {selectedCompanyId === "all" ? "All Companies" : companies.find(c => c.id === selectedCompanyId)?.name}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Companies</SelectItem>
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}


                    <div className="w-full space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Range</Label>
                        <Popover>
                            <PopoverTrigger className="w-full">
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-muted/50 border-border",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} -{" "}
                                                {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={(val) => { setDate(val); setPage(1); }}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="mb-0.5 text-muted-foreground hover:text-foreground"
                        onClick={handleClearFilters}
                    >
                        <FilterX className="w-4 h-4" />
                    </Button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <Briefcase className="w-12 h-12 text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground font-medium">Loading jobs...</p>
                    </div>
                ) : role === "company" && !userCompanyId ? (
                    <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/10">
                        <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground">No Company Profile Found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2">Please contact an administrator to link your account to a company profile.</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/10">
                        <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground">No matching jobs found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2">Try adjusting your filters or search keywords to find what you're looking for.</p>
                        {(searchQuery || selectedCompanyId !== "all" || date) && (
                            <Button variant="link" className="mt-4 text-primary" onClick={handleClearFilters}>
                                Clear all filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid gap-4">
                            {jobs.map((job) => (
                                <Card key={job.id} className="bg-card/40  border-muted backdrop-blur-sm hover:border-muted-foreground transition-all group">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{job.title}</CardTitle>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary/60" /> {job.employmentType}</span>
                                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary/60" /> {job.location} ({job.workMode})</span>
                                                <span className="flex items-center gap-1.5 font-medium text-foreground/90">
                                                    {getCurrencySymbol(job.salaryCurrency)}
                                                    {job.salaryMin.toLocaleString()} - {getCurrencySymbol(job.salaryCurrency)}
                                                    {job.salaryMax.toLocaleString()}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter">{job.seniorityLevel}</span>
                                                {role === "admin" && (
                                                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">Company ID: {job.companyId.substring(0, 8)}...</span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={() => {
                                                setJobToDelete(job.id);
                                                setIsDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {job.skills.slice(0, 8).map((skill: string, i: number) => (
                                                <span key={i} className="px-2 py-1 rounded-md bg-muted/50 text-[11px] font-medium text-foreground/70 border border-border/50">
                                                    {skill}
                                                </span>
                                            ))}
                                            {job.skills.length > 8 && (
                                                <span className="px-2 py-1 rounded-md bg-muted/50 text-[11px] font-medium text-muted-foreground border border-border/50">
                                                    +{job.skills.length - 8}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{job.description}</p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-[10px] text-muted-foreground/60 font-mono">
                                                Posted on {format(new Date(job.createdAt), "PPP")}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs bg-transparent border-border hover:bg-primary/10 hover:border-primary/30"
                                                onClick={() => {
                                                    setSelectedJob(job);
                                                    setIsSheetOpen(true);
                                                }}
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-8">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (page > 1) setPage(page - 1);
                                                }}
                                                className={cn(page === 1 && "pointer-events-none opacity-50")}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                            <PaginationItem key={p}>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={p === page}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setPage(p);
                                                    }}
                                                >
                                                    {p}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (page < totalPages) setPage(page + 1);
                                                }}
                                                className={cn(page === totalPages && "pointer-events-none opacity-50")}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col gap-0 border-l border-border overflow-hidden">
                    {selectedJob && (
                        <div className="flex flex-col flex-1 bg-background min-h-0">
                            <SheetHeader className="p-6 border-b border-border bg-card/30 shrink-0">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0">
                                            {selectedJob.domain}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0">
                                            {selectedJob.industry}
                                        </Badge>
                                    </div>
                                    <SheetTitle className="text-2xl font-bold text-foreground">
                                        {selectedJob.title}
                                    </SheetTitle>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Briefcase className="w-4 h-4 text-primary" /> {selectedJob.employmentType}
                                        </span>
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <MapPin className="w-4 h-4 text-primary" /> {selectedJob.location}
                                        </span>
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Clock className="w-4 h-4 text-primary" /> {selectedJob.workMode}
                                        </span>
                                    </div>
                                </div>
                            </SheetHeader>

                            <ScrollArea className="flex-1 h-full">
                                <div className="p-6 space-y-8 pb-8">
                                    {/* Key Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-border bg-card/30 space-y-1">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Experience Level</span>
                                            <p className="text-sm font-semibold text-foreground uppercase tracking-tight">{selectedJob.seniorityLevel}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-border bg-card/30 space-y-1">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Education</span>
                                            <p className="text-sm font-semibold text-foreground uppercase tracking-tight flex items-center gap-2">
                                                {selectedJob.educationLevel || "Not specified"}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-border bg-card/30 space-y-1 col-span-2">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Salary Range</span>
                                            <p className="text-lg font-bold text-foreground flex items-center gap-2">
                                                {getCurrencySymbol(selectedJob.salaryCurrency)}
                                                {selectedJob.salaryMin.toLocaleString()} -
                                                {getCurrencySymbol(selectedJob.salaryCurrency)}
                                                {selectedJob.salaryMax.toLocaleString()}
                                                <span className="text-xs text-muted-foreground font-normal">/ Annual</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-l-2 border-primary pl-3">Job Description</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {selectedJob.description}
                                        </p>
                                    </div>

                                    {/* Responsibilities */}
                                    {selectedJob.responsibilities && (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-l-2 border-primary pl-3">Responsibilities</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                {selectedJob.responsibilities}
                                            </p>
                                        </div>
                                    )}

                                    {/* Skills */}
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-l-2 border-primary pl-3">Required Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedJob.skills.map((skill: string, i: number) => (
                                                    <Badge key={i} variant="secondary" className="bg-muted/50 hover:bg-muted text-foreground border-border font-medium">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedJob.niceToHaveSkills && selectedJob.niceToHaveSkills.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-l-2 border-muted pl-3">Nice to Have</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedJob.niceToHaveSkills.map((skill: string, i: number) => (
                                                        <Badge key={i} variant="outline" className="bg-transparent text-muted-foreground border-border/50 font-normal">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 text-[10px] text-muted-foreground font-mono flex items-center justify-between border-t border-border/50">
                                        <span>POST ID: {selectedJob.id}</span>
                                        <span>CREATED: {format(new Date(selectedJob.createdAt), "PPP")}</span>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the job posting and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (jobToDelete) {
                                    handleDeleteJob(jobToDelete);
                                    setJobToDelete(null);
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Job
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
