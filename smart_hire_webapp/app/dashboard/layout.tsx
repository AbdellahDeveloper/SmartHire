"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth");
        }
    }, [session, isPending, router]);

    if (isPending) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground font-medium">Loading SmartHire...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    // Breadcrumb logic
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbItems = segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === segments.length - 1;
        return { label, href, isLast };
    });

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background">
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/50 backdrop-blur-md px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                        <Separator orientation="vertical" className="mr-2 h-4 bg-border" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbItems.length === 0 && (
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Dashboard</BreadcrumbPage>
                                    </BreadcrumbItem>
                                )}
                                {breadcrumbItems.map((item, index) => (
                                    <Fragment key={item.href}>
                                        <BreadcrumbItem>
                                            {item.isLast ? (
                                                <BreadcrumbPage> {item.label.replaceAll("-", " ")}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink render={<Link href={item.href} />}>
                                                    {item.label.replaceAll("-", " ")}
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {!item.isLast && <BreadcrumbSeparator />}
                                    </Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-6 pt-4 overflow-y-auto">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
