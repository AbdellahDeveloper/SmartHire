"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { completeSetup, isSetupFinished, testLLM, testSMTP } from "./actions";

export default function SetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [testingLLM, setTestingLLM] = useState(false);
    const [testingSMTP, setTestingSMTP] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [llmTested, setLlmTested] = useState(false);
    const [smtpTested, setSmtpTested] = useState(false);

    const [setupData, setSetupData] = useState({
        adminBase: { username: "", email: "", password: "" },
        llm: { provider: "openai", apiKey: "", modelName: "", baseUrl: "" },
        smtp: { host: "", port: 587, user: "", pass: "" },
    });

    useEffect(() => {
        isSetupFinished().then((finished) => {
            if (finished) {
                router.push("/auth");
            }
            setLoading(false);
        });
    }, [router]);

    const handleTestLLM = async () => {
        setTestingLLM(true);
        try {
            const res = await testLLM(setupData.llm.provider, setupData.llm.apiKey, setupData.llm.modelName, setupData.llm.baseUrl);
            if (res.success) {
                toast.success(res.message);
                setLlmTested(true);
            } else {
                toast.error(res.message);
                setLlmTested(false);
            }
        } catch (error) {
            toast.error("An error occurred while testing LLM connectivity.");
        } finally {
            setTestingLLM(false);
        }
    };

    const handleTestSMTP = async () => {
        setTestingSMTP(true);
        try {
            const res = await testSMTP(setupData.smtp);
            if (res.success) {
                toast.success(res.message);
                setSmtpTested(true);
            } else {
                toast.error(res.message);
                setSmtpTested(false);
            }
        } catch (error) {
            toast.error("An error occurred while testing SMTP connectivity.");
        } finally {
            setTestingSMTP(false);
        }
    };

    const handleCompleteSetup = async () => {
        setSubmitting(true);
        try {
            const res = await completeSetup(setupData);
            if (res.success) {
                toast.success("Setup complete! Redirecting to login...");
                router.push("/auth");
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("An error occurred while finishing setup.");
        } finally {
            setSubmitting(false);
        }
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Initializing SmartHire...</p>
                </div>
            </div>
        );
    }

    const steps = [
        { id: 1, name: "Admin Account", icon: User },
        { id: 2, name: "AI Engine", icon: Sparkles },
        { id: 3, name: "Email Server", icon: Mail },
    ];

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-xl border-border bg-card/50 backdrop-blur-xl text-foreground shadow-2xl relative">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-3xl font-bold tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Environment Setup
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Configure your SmartHire instance to get started.
                    </CardDescription>

                    {/* Step Indicator */}
                    <div className="flex justify-between items-center mt-8 px-4 relative">
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-border -translate-y-1/2 -z-10 mx-auto max-w-[80%]" />
                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-2 px-2 z-10 transition-all duration-300">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                    step === s.id ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" :
                                        step > s.id ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted text-muted-foreground"
                                )}>
                                    {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
                                    step === s.id ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {s.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardHeader>

                <CardContent className="pt-8 min-h-[350px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="space-y-2">
                                <Label htmlFor="username">Admin Username</Label>
                                <Input
                                    id="username"
                                    className="bg-muted/50 border-border focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="e.g. admin"
                                    value={setupData.adminBase.username}
                                    onChange={(e) => setSetupData({ ...setupData, adminBase: { ...setupData.adminBase, username: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Admin Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    className="bg-muted/50 border-border focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="admin@smarthire.ai"
                                    value={setupData.adminBase.email}
                                    onChange={(e) => setSetupData({ ...setupData, adminBase: { ...setupData.adminBase, email: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Login Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    className="bg-muted/50 border-border focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="••••••••"
                                    value={setupData.adminBase.password}
                                    onChange={(e) => setSetupData({ ...setupData, adminBase: { ...setupData.adminBase, password: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex flex-row gap-2">
                                <div className="space-y-2 w-full">
                                    <Label>Select AI Provider</Label>
                                    <Select
                                        value={setupData.llm.provider}
                                        onValueChange={(val) => {
                                            setSetupData({ ...setupData, llm: { ...setupData.llm, provider: val || "" } });
                                            setLlmTested(false);
                                        }}
                                    >
                                        <SelectTrigger className="w-full bg-muted/50 border-border">
                                            <SelectValue placeholder="AI Provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                                            <SelectItem value="google">Google Cloud (Gemini)</SelectItem>
                                            <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                                            <SelectItem value="custom">Custom (OpenAI Compatible)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 w-full">
                                    <Label htmlFor="modelName">Specific Model Name (Optional)</Label>
                                    <Input
                                        id="modelName"
                                        className="bg-muted/50 border-border"
                                        placeholder="e.g. gpt-5-nano"
                                        value={setupData.llm.modelName}
                                        onChange={(e) => setSetupData({ ...setupData, llm: { ...setupData.llm, modelName: e.target.value } })}
                                    />
                                </div>
                            </div>
                            {setupData.llm.provider === "custom" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label htmlFor="baseUrl">Base URL</Label>
                                    <Input
                                        id="baseUrl"
                                        className="bg-muted/50 border-border"
                                        placeholder="https://api.your-provider.com/v1"
                                        value={setupData.llm.baseUrl}
                                        onChange={(e) => {
                                            setSetupData({ ...setupData, llm: { ...setupData.llm, baseUrl: e.target.value } });
                                            setLlmTested(false);
                                        }}
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        The base URL for the OpenAI compatible API (e.g., LM Studio, Ollama, Groq).
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">Provider API Key</Label>
                                <div className="relative">
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        className="bg-muted/50 border-border pr-10"
                                        placeholder="sk-..."
                                        value={setupData.llm.apiKey}
                                        onChange={(e) => {
                                            setSetupData({ ...setupData, llm: { ...setupData.llm, apiKey: e.target.value } });
                                            setLlmTested(false);
                                        }}
                                    />
                                    {llmTested && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full transition-all",
                                        llmTested ? "border-primary text-primary" : ""
                                    )}
                                    onClick={handleTestLLM}
                                    disabled={testingLLM || !setupData.llm.apiKey}
                                >
                                    {testingLLM ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing Connection...</>
                                    ) : llmTested ? (
                                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Connection Verified</>
                                    ) : "Verify AI Connectivity"}
                                </Button>
                                <p className="text-xs text-muted-foreground text-italic text-center">
                                    This confirms everything is connected and ready to run tools when needed.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3 space-y-2">
                                    <Label htmlFor="smtpHost">SMTP Host</Label>
                                    <Input
                                        id="smtpHost"
                                        className="bg-muted/50 border-border"
                                        placeholder="smtp.gmail.com"
                                        value={setupData.smtp.host}
                                        onChange={(e) => {
                                            setSetupData({ ...setupData, smtp: { ...setupData.smtp, host: e.target.value } });
                                            setSmtpTested(false);
                                        }}
                                    />
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <Label htmlFor="smtpPort">Port</Label>
                                    <Input
                                        id="smtpPort"
                                        type="number"
                                        className="bg-muted/50 border-border"
                                        placeholder="587"
                                        value={setupData.smtp.port}
                                        onChange={(e) => {
                                            setSetupData({ ...setupData, smtp: { ...setupData.smtp, port: parseInt(e.target.value) } });
                                            setSmtpTested(false);
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtpUser">Sender Email</Label>
                                <Input
                                    id="smtpUser"
                                    className="bg-muted/50 border-border"
                                    placeholder="notifications@yourcompany.com"
                                    value={setupData.smtp.user}
                                    onChange={(e) => {
                                        setSetupData({ ...setupData, smtp: { ...setupData.smtp, user: e.target.value } });
                                        setSmtpTested(false);
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtpPass">SMTP Password</Label>
                                <Input
                                    id="smtpPass"
                                    type="password"
                                    className="bg-muted/50 border-border"
                                    placeholder="App-specific password"
                                    value={setupData.smtp.pass}
                                    onChange={(e) => {
                                        setSetupData({ ...setupData, smtp: { ...setupData.smtp, pass: e.target.value } });
                                        setSmtpTested(false);
                                    }}
                                />
                            </div>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full transition-all",
                                    smtpTested ? "border-primary text-primary" : ""
                                )}
                                onClick={handleTestSMTP}
                                disabled={testingSMTP || !setupData.smtp.host || !setupData.smtp.user || !setupData.smtp.pass}
                            >
                                {testingSMTP ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying SMTP...</>
                                ) : smtpTested ? (
                                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Server Reachable</>
                                ) : "Test Email Connection"}
                            </Button>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between items-center gap-4 pt-6 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={step === 1 || submitting}
                        className="flex-1"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>

                    {step < 3 ? (
                        <Button
                            onClick={nextStep}
                            disabled={
                                (step === 1 && (!setupData.adminBase.email || !setupData.adminBase.password || !setupData.adminBase.username)) ||
                                (step === 2 && !llmTested)
                            }
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                            onClick={handleCompleteSetup}
                            disabled={submitting || !setupData.adminBase.email || !setupData.adminBase.password || !llmTested || !smtpTested}
                        >
                            {submitting ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deploying...</>
                            ) : (
                                <><ShieldCheck className="w-4 h-4 mr-2" /> Launch SmartHire</>
                            )}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
