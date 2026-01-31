"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Lock, Mail, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AccountSettingsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState<string | null>(null);

    // Email state
    const [newEmail, setNewEmail] = useState(session?.user?.email || "");

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading("email");
        try {
            const { error } = await authClient.changeEmail({
                newEmail,
            });
            if (error) throw error;
            toast.success("Email update request sent. Please check your new email for verification.");
        } catch (error: any) {
            toast.error(error.message || "Failed to update email");
        } finally {
            setLoading(null);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setLoading("password");
        try {
            const { error } = await authClient.changePassword({
                newPassword,
                currentPassword,
                revokeOtherSessions: true,
            });
            if (error) throw error;
            toast.success("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h2>
                <p className="text-muted-foreground">Manage your account email and security preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Profile
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Your basic account information. Note that some details might be managed by your administrator.
                    </p>
                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Name</span>
                            <span className="text-sm font-medium">{session?.user?.name}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">User Role</span>
                            <Badge variant="secondary" className="w-fit mt-1 capitalize">{(session?.user as any)?.role}</Badge>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    {/* Email Change */}
                    <Card className="border-border bg-card/40 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Mail className="w-5 h-5 text-primary" />
                                Email Address
                            </CardTitle>
                            <CardDescription>
                                Change your account's primary email address.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleChangeEmail} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="bg-muted/50 border-border"
                                    />
                                </div>
                                <Button type="submit" disabled={loading === "email" || newEmail === session?.user?.email} className="w-full md:w-auto">
                                    {loading === "email" ? "Updating..." : "Update Email"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Password Change */}
                    <Card className="border-border bg-card/40 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Lock className="w-5 h-5 text-primary" />
                                Password
                            </CardTitle>
                            <CardDescription>
                                Change your password to keep your account secure.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-muted/50 border-border"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="bg-muted/50 border-border"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="bg-muted/50 border-border"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={loading === "password"} className="w-full md:w-auto">
                                    {loading === "password" ? "Updating..." : "Change Password"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Security Notice */}
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                        <ShieldCheck className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-200 uppercase tracking-tighter">Security Tip</h4>
                            <p className="text-xs text-amber-200/60 leading-relaxed mt-1">
                                We recommend using a unique password that you don't use on other websites.
                                Make sure it's at least 8 characters long and includes a mix of letters, numbers, and symbols.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple Badge component since I might not have it or it might be different
function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) {
    const variants: any = {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground"
    };
    return (
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold overflow-hidden", variants[variant], className)}>
            {children}
        </span>
    );
}
