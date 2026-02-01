import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";
import { Suspense } from "react";
import { getCandidates } from "./actions";
import { CandidatesFilters } from "./components/CandidatesFilters";
import { CandidatesTable } from "./components/CandidatesTable";

interface PageProps {
    searchParams: Promise<{
        query?: string;
        startDate?: string;
        endDate?: string;
        page?: string;
    }>;
}

export default async function CandidatesPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const query = params.query;
    const startDate = params.startDate;
    const endDate = params.endDate;
    const page = params.page ? parseInt(params.page) : 1;

    const result = await getCandidates({
        query,
        startDate,
        endDate,
        page,
        pageSize: 10
    });

    if (!result.success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-destructive/20 rounded-2xl bg-destructive/5 p-8 text-center space-y-4">
                <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                    <Users className="size-8" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">Failed to Load Candidates</h3>
                    <p className="text-muted-foreground max-w-md">{result.error || "An unexpected error occurred while fetching candidate data."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground truncate">Candidates</h1>
                    </div>
                    <p className="text-muted-foreground truncate md:whitespace-normal">Manage and explore all candidates across the system with advanced search and filters.</p>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-2 h-fit shrink-0">
                    <span className="text-sm font-medium text-primary">Total Candidates:</span>
                    <span className="ml-2 text-lg font-bold text-foreground">{result.totalCount?.toLocaleString()}</span>
                </div>
            </div>

            <div className="">
                <Suspense fallback={<FiltersSkeleton />}>
                    <CandidatesFilters />
                </Suspense>
            </div>

            <div className="">
                <Suspense fallback={<TableSkeleton />}>
                    <ScrollArea className="w-full min-w-0 overflow-x-auto">
                        <CandidatesTable
                            candidates={result.candidates || []}
                            totalCount={result.totalCount || 0}
                            totalPages={result.totalPages || 0}
                            currentPage={result.currentPage || 1}
                        />
                    </ScrollArea>
                </Suspense>
            </div>
        </div>
    );
}

function FiltersSkeleton() {
    return (
        <div className="h-20 w-full bg-muted/20 animate-pulse rounded-xl border border-border" />
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-64 w-full bg-muted/20 animate-pulse rounded-xl border border-border" />
            <div className="flex justify-between">
                <div className="h-8 w-32 bg-muted/20 animate-pulse rounded" />
                <div className="h-8 w-64 bg-muted/20 animate-pulse rounded" />
            </div>
        </div>
    );
}
