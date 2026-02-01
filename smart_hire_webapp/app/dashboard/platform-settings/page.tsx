"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSystemSettings, updateSystemSettings } from "./actions";

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        llm: {
            provider: "openai",
            apiKey: "",
            modelName: "",
            baseUrl: ""
        },
        smtp: {
            host: "",
            port: 587,
            user: "",
            password: "",
            from: ""
        }
    });

    useEffect(() => {
        const loadSettings = async () => {
            const result = await getSystemSettings();
            if (result.success && result.settings) {
                const data = result.settings;
                setSettings({
                    llm: {
                        provider: data.llm.provider || "openai",
                        apiKey: "", // Keep empty
                        modelName: data.llm.modelName || "",
                        baseUrl: data.llm.baseUrl || ""
                    },
                    smtp: {
                        host: data.smtp.host || "",
                        port: data.smtp.port || 587,
                        user: data.smtp.user || "",
                        password: "", // Keep empty
                        from: data.smtp.from || ""
                    }
                });
            } else if (!result.success) {
                toast.error(result.error || "Failed to load settings");
            }
        };
        loadSettings();
    }, []);

    const handleUpdateSettings = async () => {
        setLoading(true);
        const result = await updateSystemSettings(settings);
        if (result.success) {
            toast.success("System settings updated successfully");
        } else {
            toast.error(result.error || "Failed to update settings");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Admin Console</h2>
                <p className="text-muted-foreground">Manage system configurations.</p>
            </div>

            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>LLM Configuration</CardTitle>
                    <CardDescription>Configure the AI provider for the entire platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-row gap-4 w-full">
                        <div className="space-y-2 w-full">
                            <Label>Provider</Label>
                            <Select
                                value={settings.llm.provider}
                                onValueChange={(val) => setSettings(prev => ({ ...prev, llm: { ...prev.llm, provider: val || "openai" } }))}
                            >
                                <SelectTrigger className="bg-muted border-border w-full">
                                    <SelectValue placeholder="Select Provider" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="google">Google Gemini</SelectItem>
                                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                                    <SelectItem value="custom">Custom (OpenAI Compatible)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 w-full">
                            <Label>Model Name</Label>
                            <Input
                                className="bg-muted border-border"
                                placeholder="e.g. gpt-5-nano"
                                value={settings.llm.modelName}
                                onChange={(e) => setSettings(prev => ({ ...prev, llm: { ...prev.llm, modelName: e.target.value } }))}
                            />
                        </div>
                    </div>
                    {settings.llm.provider === "custom" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label>Base URL</Label>
                            <Input
                                className="bg-muted border-border"
                                placeholder="https://api.your-provider.com/v1"
                                value={settings.llm.baseUrl}
                                onChange={(e) => setSettings(prev => ({ ...prev, llm: { ...prev.llm, baseUrl: e.target.value } }))}
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                            type="password"
                            className="bg-muted border-border"
                            placeholder="sk-..."
                            value={settings.llm.apiKey}
                            onChange={(e) => setSettings(prev => ({ ...prev, llm: { ...prev.llm, apiKey: e.target.value } }))}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Global SMTP Configuration</CardTitle>
                    <CardDescription>Fallback SMTP settings for system notifications and newly created companies.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>SMTP Host</Label>
                            <Input
                                className="bg-muted border-border"
                                placeholder="smtp.gmail.com"
                                value={settings.smtp.host}
                                onChange={(e) => setSettings(prev => ({ ...prev, smtp: { ...prev.smtp, host: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Port</Label>
                            <Input
                                type="number"
                                className="bg-muted border-border"
                                placeholder="587"
                                value={settings.smtp.port}
                                onChange={(e) => setSettings(prev => ({ ...prev, smtp: { ...prev.smtp, port: parseInt(e.target.value) || 587 } }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP User (Email)</Label>
                            <Input
                                className="bg-muted border-border"
                                placeholder="admin@smarthire.com"
                                value={settings.smtp.user}
                                onChange={(e) => setSettings(prev => ({ ...prev, smtp: { ...prev.smtp, user: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Password</Label>
                            <Input
                                type="password"
                                className="bg-muted border-border"
                                placeholder="••••••••"
                                value={settings.smtp.password}
                                onChange={(e) => setSettings(prev => ({ ...prev, smtp: { ...prev.smtp, password: e.target.value } }))}
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Send From Email</Label>
                            <Input
                                className="bg-muted border-border"
                                placeholder="no-reply@smarthire.com"
                                value={settings.smtp.from}
                                onChange={(e) => setSettings(prev => ({ ...prev, smtp: { ...prev.smtp, from: e.target.value } }))}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleUpdateSettings}
                        disabled={
                            loading ||
                            !settings.llm.apiKey ||
                            !settings.llm.modelName ||
                            !settings.llm.provider ||
                            !settings.smtp.host ||
                            !settings.smtp.user ||
                            !settings.smtp.from
                        }
                        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
                    >
                        {loading ? "Saving..." : "Save All Configurations"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

