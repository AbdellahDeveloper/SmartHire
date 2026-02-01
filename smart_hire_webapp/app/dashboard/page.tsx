"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { formatDistanceToNow } from "date-fns";
import { Briefcase, Clock, Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboardData } from "./actions";

export default function DashboardPage() {
    const { data: session } = useSession();
    const role = (session?.user as { role?: string })?.role || "company";
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        stats: {
            activeJobs: { value: number; change: number };
            totalCandidates: { value: number; change: number };
            meetingsToday: { value: number; change: number };
            totalCompanies?: { value: number; change: number };
        };
        recentActivity: any[];
    } | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (session?.user) {
                try {
                    const companyIdForData = role === "admin" ? undefined : (session.user as any).companyId;
                    const result = await getDashboardData(companyIdForData);
                    if (result.success) {
                        setData(result.data || null);
                    } else {
                        console.error("Failed to fetch dashboard data:", result.error);
                    }
                } catch (error) {
                    console.error("Failed to fetch dashboard data (exception):", error);
                } finally {
                    setLoading(false);
                }
            } else if (session) {
                setLoading(false);
            }
        }
        fetchData();
    }, [session, role]);

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const stats = role === "admin" ? [
        {
            label: "Number of Companies",
            value: data?.stats.totalCompanies?.value.toString() || "0",
            change: 0,
            icon: Users,
            color: "text-primary"
        },
        {
            label: "All Jobs",
            value: data?.stats.activeJobs.value.toString() || "0",
            change: data?.stats.activeJobs.change || 0,
            icon: Briefcase,
            color: "text-primary"
        },
        {
            label: "Total Candidates",
            value: data?.stats.totalCandidates.value.toLocaleString() || "0",
            change: data?.stats.totalCandidates.change || 0,
            icon: Users,
            color: "text-primary"
        },
        {
            label: "All Scheduled Meetings",
            value: data?.stats.meetingsToday.value.toString() || "0",
            change: 0,
            icon: Clock,
            color: "text-primary"
        },
    ] : [
        {
            label: "Active Jobs",
            value: data?.stats.activeJobs.value.toString() || "0",
            change: data?.stats.activeJobs.change || 0,
            icon: Briefcase,
            color: "text-primary"
        },
        {
            label: "Total Candidates",
            value: data?.stats.totalCandidates.value.toLocaleString() || "0",
            change: data?.stats.totalCandidates.change || 0,
            icon: Users,
            color: "text-primary"
        },
        {
            label: "Meetings Today",
            value: data?.stats.meetingsToday.value.toString() || "0",
            change: 0,
            icon: Clock,
            color: "text-primary"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                    Welcome back, <span className="text-primary">{session?.user.name}</span>
                </h1>
                <p className="text-muted-foreground mt-2">
                    {role === "admin"
                        ? "Overview of the entire platform's activity and metrics."
                        : "Here's what's happening with your hiring process today."}
                </p>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${role === "admin" ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-6`}>
                {stats.map((stat) => (
                    <Card key={stat.label} className="bg-card/50 border-border backdrop-blur-sm border-2 hover:border-primary/50 transition-all duration-300 group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                            <stat.icon className={`w-5 h-5 ${stat.color} group-hover:scale-110 transition-transform`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                            {stat.change !== 0 && (
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    {stat.change >= 0 ? "+" : ""}{stat.change}% from last month
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8">
                <Card className="bg-card/50 border-border">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates across your jobs and candidates.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {data?.recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent activity found.</p>
                            ) : (
                                data?.recentActivity.map((activity, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                        <div>
                                            <p className="text-sm text-foreground/80">
                                                <span className="font-medium text-foreground">{activity.title}</span>
                                                <br />
                                                <span className="text-muted-foreground">{activity.description}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
