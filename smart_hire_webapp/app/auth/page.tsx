"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Particles } from "@/components/ui/particles";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export default function AuthPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        setLoading(true);
        await authClient.signIn.email(
            {
                email,
                password,
            },
            {
                onSuccess: () => {
                    toast.success("Logged in successfully!");
                    router.push("/dashboard");
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message);
                },
            }
        );
        setLoading(false);
    };

    return (
        <div className="relative w-full md:h-screen md:overflow-hidden bg-background flex flex-col justify-center">
            <Particles
                className="absolute inset-0 z-0"
                color="#ffffff"
                ease={20}
                quantity={120}
            />

            <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4">

                <div className="mx-auto space-y-8 sm:w-[400px]">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col space-y-2">
                            <h1 className="font-bold text-3xl tracking-tight text-foreground">
                                Sign In
                            </h1>
                            <p className="text-base text-muted-foreground">
                                Login to your Smarthire account.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground/80">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    className="bg-card/50 border-border text-foreground focus:ring-primary/50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" title="Password" className="text-foreground/80">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-card/50 border-border text-foreground focus:ring-primary/50"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold py-6"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                    Signing in...
                                </div>
                            ) : "Continue"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
