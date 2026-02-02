"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    Activity,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronUp,
    Download,
    ExternalLink,
    Search,
    SlidersHorizontal,
    User,
    X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { getCompanies } from "../companies/actions";
import { getLogs } from "./actions";

export default function LogsPage() {
    const { data: session } = useSession();
    const role = (session?.user as { role?: string })?.role || "company";
    const companyId = (session?.user as { companyId?: string })?.companyId;

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [companies, setCompanies] = useState<any[]>([]);
    const [companiesMap, setCompaniesMap] = useState<Record<string, string>>({ "ALL": "All Companies" });
    const [filters, setFilters] = useState<{
        query: string;
        type: string;
        date: DateRange | undefined;
        companyId: string;
    }>({
        query: "",
        type: "ALL",
        date: undefined,
        companyId: "ALL"
    });

    useEffect(() => {
        if (session?.user) {
            loadLogs();
            if (role === "admin") {
                loadCompanies();
            }
        }
    }, [session, role, companyId, filters.type, filters.date, filters.companyId]);

    const loadCompanies = async () => {
        try {
            const data = await getCompanies();
            setCompanies(data);
            const map = data.reduce((acc: any, c: any) => ({ ...acc, [c.id]: c.name }), { "ALL": "All Companies" });
            setCompaniesMap(map);
        } catch (error) {
            console.error("Failed to load companies", error);
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await getLogs(role, companyId, {
                query: filters.query,
                type: filters.type === "ALL" ? undefined : filters.type,
                startDate: filters.date?.from,
                endDate: filters.date?.to,
                companyId: filters.companyId === "ALL" ? undefined : filters.companyId
            });
            setLogs(data);
        } catch (error) {
            console.error("Failed to load logs", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedLogs(newExpanded);
    };

    const getBadgeVariant = (type: string) => {
        switch (type) {
            case "MATCH_RESULT": return "secondary";
            case "MATCH_REPORT": return "outline";
            case "MEETING": return "default";
            case "SERVICE_LOG": return "destructive";
            default: return "outline";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Platform Logs</h2>
                    <p className="text-muted-foreground">Monitor activities, matches, and meetings across the platform.</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
                    <Activity className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Filtering UI */}
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4 space-y-4 w-full">
                    <div className="flex flex-row gap-4 w-full">
                        <div className="w-full relative">
                            <Search className="w-4 h-4 absolute left-2 top-2 text-muted-foreground" />
                            <Input
                                placeholder="Search by activity, result or ID..."
                                className="w-full pl-8 bg-muted/30 border-border"
                                value={filters.query}
                                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && loadLogs()}
                            />
                        </div>
                        <div className="w-full">
                            <Select
                                value={filters.type}
                                onValueChange={(val) => setFilters(prev => ({ ...prev, type: val || "" }))}
                            >
                                <SelectTrigger className="w-full bg-muted/30 border-border">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                                    <SelectValue placeholder="All Activities" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    <SelectItem value="ALL">All Activities</SelectItem>
                                    <SelectItem value="MATCH_RESULT">Matches</SelectItem>
                                    <SelectItem value="MATCH_REPORT">Reports</SelectItem>
                                    <SelectItem value="MEETING">Meetings</SelectItem>
                                    <SelectItem value="SERVICE_LOG">Service Syncs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {role === "admin" && (
                            <div className="w-full">
                                <Select
                                    value={filters.companyId}
                                    onValueChange={(val) => setFilters(prev => ({ ...prev, companyId: val || "ALL" }))}
                                >
                                    <SelectTrigger className="w-full bg-muted/30 border-border">
                                        <User className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                                        <SelectValue placeholder="All Companies">
                                            {companiesMap[filters.companyId] || "All Companies"}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="ALL">All Companies</SelectItem>
                                        {companies.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="w-full">
                            <Popover>
                                <PopoverTrigger className="w-full">
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-muted/30 border-border",
                                            !filters.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.date?.from ? (
                                            filters.date.to ? (
                                                <span className="text-xs">
                                                    {format(filters.date.from, "LLL dd, y")} -{" "}
                                                    {format(filters.date.to, "LLL dd, y")}
                                                </span>
                                            ) : (
                                                <span className="text-xs">{format(filters.date.from, "LLL dd, y")}</span>
                                            )
                                        ) : (
                                            <span className="text-xs">Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="range"
                                        defaultMonth={filters.date?.from}
                                        selected={filters.date}
                                        onSelect={(date) => setFilters(prev => ({ ...prev, date }))}
                                        numberOfMonths={2}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="w-24 flex items-center gap-2">
                        {(filters.query || filters.type !== "ALL" || filters.date) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="px-2 text-muted-foreground hover:text-foreground"
                                onClick={() => setFilters({ query: "", type: "ALL", date: undefined, companyId: "ALL" })}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            className="w-24 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={loadLogs}
                            disabled={loading}
                        >
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-muted/50 border-b border-border py-4 px-6">
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        <span className="w-40">Date & Time</span>
                        <span className="flex-1">Activity</span>
                        <span className="w-32">Type</span>
                        <span className="w-24 text-right">Actions</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground animate-pulse">Fetching latest logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-20">
                            <Activity className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No logs found</h3>
                            <p className="text-muted-foreground">Recent activities will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {logs.map((log) => (
                                <div key={log.id} className="group transition-colors hover:bg-primary/5">
                                    <div className="flex items-center gap-4 py-4">
                                        <div className="w-40 flex flex-col px-4">
                                            <span className="text-sm font-medium">{format(log.date, "MMM dd, yyyy")}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{format(log.date, "HH:mm:ss")}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">{log.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{log.description}</p>
                                        </div>
                                        <div className="w-32">
                                            <Badge variant={getBadgeVariant(log.type) as any} className="text-[10px] py-0">
                                                {log.type.replace("_", " ")}
                                            </Badge>
                                        </div>
                                        <div className="w-24 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs hover:bg-primary/10 transition-all font-medium"
                                                onClick={() => toggleExpand(log.id)}
                                            >
                                                {expandedLogs.has(log.id) ? (
                                                    <><ChevronUp className="w-3 h-3 mr-1" /> Hide</>
                                                ) : (
                                                    <><ChevronDown className="w-3 h-3 mr-1" /> Details</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {expandedLogs.has(log.id) && (
                                        <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
                                            <div className="bg-muted/30 rounded-xl border border-border/60 p-5 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <h4 className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                            <Activity className="w-4 h-4" /> Log Metadata
                                                        </h4>
                                                        <div className="grid grid-cols-1 gap-2 text-sm px-4">
                                                            <div className="flex justify-between py-1 border-b border-border/40">
                                                                <span className="text-muted-foreground">Log ID</span>
                                                                <span className="font-mono text-[10px]">{log.id}</span>
                                                            </div>
                                                            <div className="flex justify-between py-1 border-b border-border/40">
                                                                <span className="text-muted-foreground">Entity Type</span>
                                                                <span>{log.type}</span>
                                                            </div>
                                                            <div className="flex justify-between py-1 border-b border-border/40">
                                                                <span className="text-muted-foreground">Company Context</span>
                                                                <span className="font-mono text-[10px]">{log.companyId}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <h4 className="pt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                            <User className="w-4 h-4" /> Activity Details
                                                        </h4>
                                                        <pre className="text-[11px] mb-4 font-mono bg-background/50 p-4 rounded-lg border border-border/40 overflow-x-auto max-h-[300px]">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>

                                                {log.type === "MATCH_REPORT" && log.details.url && (
                                                    <div className="flex justify-end pt-2">
                                                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                                                            <Link href={log.details.url} target="_blank" className="flex items-center">
                                                                <Download className="w-3.5 h-3.5 mr-2" />
                                                                Download Report
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                )}

                                                {log.type === "MEETING" && log.details.meetLink && (
                                                    <div className="flex justify-end pt-2">
                                                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                                                            <Link href={log.details.meetLink} target="_blank" className="flex items-center">
                                                                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                                                Join Meeting
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
