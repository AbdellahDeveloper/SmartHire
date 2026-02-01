"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ExternalLink, Mail, MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CandidateDetailsSheet } from "./CandidateDetailsSheet";

interface CandidatesTableProps {
    candidates: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
}

export function CandidatesTable({ candidates, totalPages, currentPage }: CandidatesTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="space-y-4 w-full">
            <div className="rounded-xl border border-border bg-card/50 overflow-x-auto backdrop-blur-sm w-full">
                <Table className="w-full">
                    <TableHeader className="bg-muted/80">
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="font-semibold">Candidate</TableHead>
                            <TableHead className="font-semibold">Contact</TableHead>
                            <TableHead className="font-semibold">Location</TableHead>
                            <TableHead className="font-semibold">Role & Exp</TableHead>
                            <TableHead className="font-semibold">Applied At</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {candidates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground animate-pulse font-medium">
                                    No candidates found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            candidates.map((candidate) => (
                                <TableRow key={candidate.id} className="hover:bg-muted/30 transition-colors border-border group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="min-w-0">
                                                <div className="font-medium text-foreground truncate">{candidate.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{candidate.gender}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                                                <span className="truncate">{candidate.email}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {candidate.phoneNumber}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                                            <span>{candidate.city}, {candidate.country}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="font-medium text-sm truncate">{candidate.currentJobTitle}</div>
                                            <div className="flex gap-1.5 overflow-hidden">
                                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 font-normal shrink-0">
                                                    {candidate.seniorityLevel}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal shrink-0">
                                                    {candidate.yearsTotalExperience}y Exp
                                                </Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {format(new Date(candidate.createdAt), "MMM dd, yyyy")}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCandidate(candidate)}
                                            className="hover:bg-primary/10 hover:text-primary transition-all group-hover:translate-x-[-4px]"
                                        >
                                            View Details
                                            <ExternalLink className="ml-1.5 size-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                    <p className="text-sm text-muted-foreground order-2 sm:order-1">
                        Showing page {currentPage} of {totalPages}
                    </p>
                    <Pagination className="w-auto mx-0 order-1 sm:order-2">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) handlePageChange(currentPage - 1);
                                    }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {/* Simple pagination logic */}
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageChange(pageNum);
                                            }}
                                            isActive={currentPage === pageNum}
                                            className="cursor-pointer"
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}

                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            )}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                                    }}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <CandidateDetailsSheet
                candidate={selectedCandidate}
                onOpenChange={(open: boolean) => !open && setSelectedCandidate(null)}
            />
        </div>
    );
}
