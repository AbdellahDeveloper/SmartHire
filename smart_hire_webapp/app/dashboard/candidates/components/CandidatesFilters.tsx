"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";

export function CandidatesFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("query") || "");
    const debouncedSearch = useDebounce(search, 500);

    const [date, setDate] = useState<DateRange | undefined>(() => {
        const start = searchParams.get("startDate");
        const end = searchParams.get("endDate");
        return start && end ? { from: new Date(start), to: new Date(end) } : undefined;
    });

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch) {
            params.set("query", debouncedSearch);
        } else {
            params.delete("query");
        }
        params.set("page", "1"); // Reset to page 1 on search
        router.push(`?${params.toString()}`);
    }, [debouncedSearch]);

    const handleDateChange = (range: DateRange | undefined) => {
        setDate(range);
        const params = new URLSearchParams(searchParams);
        if (range?.from) {
            params.set("startDate", format(range.from, "yyyy-MM-dd"));
        } else {
            params.delete("startDate");
        }
        if (range?.to) {
            params.set("endDate", format(range.to, "yyyy-MM-dd"));
        } else {
            params.delete("endDate");
        }
        params.set("page", "1"); // Reset to page 1 on filter
        router.push(`?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearch("");
        setDate(undefined);
        router.push("?");
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-card/50 p-4 rounded-xl border border-border backdrop-blur-sm">
            <div className="flex-1 w-full space-y-1">
                <label className="text-xs font-medium text-muted-foreground ml-1">Search Candidates</label>
                <div className="relative">
                    <Input
                        placeholder="Search by name, email, location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-muted/50 border-border focus-visible:ring-primary h-10"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col space-y-1 w-full md:w-auto">
                <Label className="text-xs font-medium text-muted-foreground ml-1">Created At</Label>
                <Popover>
                    <PopoverTrigger>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full md:w-[300px] justify-start text-left font-normal bg-muted/50 border-border h-10",
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
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleDateChange}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {(search || date) && (
                <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-12 self-end text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    Clear All
                </Button>
            )}
        </div>
    );
}
