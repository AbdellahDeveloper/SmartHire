"use client"

import {
    Briefcase,
    Building2,
    Cpu,
    FileUp,
    History,
    LayoutDashboard,
    Settings,
    ShieldCheck,
    Users
} from "lucide-react"
import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "@/lib/auth-client"
import { ThreeDScaleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: session } = useSession()
    const role = (session?.user as { role?: string })?.role || "company"

    const data = {
        user: {
            name: session?.user?.name || "User",
            email: session?.user?.email || "user@example.com",
        },
        navMain: [
            {
                title: "Overview",
                url: "/dashboard",
                icon: LayoutDashboard,
                isActive: true,
            },
        ],
        management: [
            ...(role === "admin" ? [
                {
                    title: "Companies",
                    url: "/dashboard/companies",
                    icon: Building2,
                },
                {
                    title: "Candidates",
                    url: "/dashboard/candidates",
                    icon: Users,
                }
            ] : []),
            {
                title: "Jobs",
                url: "/dashboard/jobs",
                icon: Briefcase,
            },
            {
                title: "CV Processor",
                url: "/dashboard/upload",
                icon: FileUp,
            }
        ],
        logs: [
            {
                title: "Logs",
                url: "/dashboard/logs",
                icon: History,
            }
        ],
        preferences: [
            ...(role === "admin" ? [{
                title: "Platform Settings",
                url: "/dashboard/platform-settings",
                icon: ShieldCheck,
            }] : []),
            ...(role === "company" ? [
                {
                    title: "Settings",
                    url: "/dashboard/settings",
                    icon: Settings,
                },
                {
                    title: "MCP Integration",
                    url: "/dashboard/mcp-integration",
                    icon: Cpu,
                }
            ] : []),
        ]
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <HugeiconsIcon icon={ThreeDScaleIcon} className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-bold italic tracking-tight">SmartHire</span>
                                <span className="truncate text-xs text-muted-foreground capitalize">{role} Portal</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavMain label="Management" items={data.management} />
                <NavMain label="Logs" items={data.logs} />
                <NavMain label="Preferences" items={data.preferences} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
