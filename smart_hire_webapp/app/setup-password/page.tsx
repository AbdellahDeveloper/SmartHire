"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { setupInitialPassword, verifyToken } from "./actions";

function SetupPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [verifying, setVerifying] = useState(true);
    const [valid, setValid] = useState(false);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [setupComplete, setSetupComplete] = useState(false);

    useEffect(() => {
        if (!token || !email) {
            setVerifying(false);
            setValid(false);
            return;
        }

        const checkToken = async () => {
            try {
                const isValid = await verifyToken(email, token);
                setValid(isValid);
            } catch {
                setValid(false);
            } finally {
                setVerifying(false);
            }
        };

        checkToken();
    }, [token, email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            await setupInitialPassword(email!, token!, password);
            toast.success("Password setup successful");
            setSetupComplete(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to set up password");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground animate-pulse">Verifying invitation...</p>
            </div>
        );
    }

    if (!valid && !setupComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
                    <CardHeader className="text-center">
                        <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
                        <CardDescription>
                            This invitation link is invalid or has expired. Please contact your administrator.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button variant="outline" onClick={() => router.push("/auth")}>
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (setupComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full space-y-6 text-center animate-in fade-in zoom-in duration-500">
                    <div className="flex justify-center">
                        <div className="bg-primary/20 p-4 rounded-full">
                            <CheckCircle2 className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Account Ready!</h1>
                        <p className="text-muted-foreground">
                            Your password has been set successfully. You can now log in to your dashboard.
                        </p>
                    </div>
                    <Button onClick={() => router.push("/auth")} className="w-full h-12 text-lg">
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="max-w-md w-full shadow-2xl border-border bg-card/50 backdrop-blur-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Set Your Password</CardTitle>
                    <CardDescription>
                        Complete your registration for <span className="font-semibold text-foreground">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-muted/50 border-border h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-muted/50 border-border h-11"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium transition-all hover:shadow-lg hover:shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Account...
                                </span>
                            ) : (
                                "Activate Account"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SetupPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground animate-pulse">Loading setup...</p>
            </div>
        }>
            <SetupPasswordContent />
        </Suspense>
    );
}
