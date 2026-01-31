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
    const [llmSettings, setLlmSettings] = useState({
        provider: "openai",
        apiKey: "",
        modelName: "",
        baseUrl: ""
    });

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getSystemSettings();
            if (settings) {
                setLlmSettings({
                    provider: settings.provider || "openai",
                    apiKey: "", // Keep empty for security
                    modelName: settings.modelName || "",
                    baseUrl: settings.baseUrl || ""
                });
            }
        };
        loadSettings();
    }, []);

    const handleUpdateSettings = async () => {
        setLoading(true);
        try {
            await updateSystemSettings(llmSettings);
            toast.success("System settings updated successfully");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update settings");
        } finally {
            setLoading(false);
        }
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
                                value={llmSettings.provider}
                                onValueChange={(val) => setLlmSettings(prev => ({ ...prev, provider: val || "openai" }))}
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
                                value={llmSettings.modelName}
                                onChange={(e) => setLlmSettings(prev => ({ ...prev, modelName: e.target.value }))}
                            />
                        </div>
                    </div>
                    {llmSettings.provider === "custom" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label>Base URL</Label>
                            <Input
                                className="bg-muted border-border"
                                placeholder="https://api.your-provider.com/v1"
                                value={llmSettings.baseUrl}
                                onChange={(e) => setLlmSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                The base URL for the OpenAI compatible API
                            </p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                            type="password"
                            className="bg-muted border-border"
                            placeholder="sk-..."
                            value={llmSettings.apiKey}
                            onChange={(e) => setLlmSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                        />
                    </div>
                    <Button
                        onClick={handleUpdateSettings}
                        disabled={
                            loading ||
                            !llmSettings.apiKey ||
                            !llmSettings.modelName ||
                            !llmSettings.provider ||
                            (llmSettings.provider === 'custom' && !llmSettings.baseUrl)
                        }
                        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]"
                    >
                        {loading ? "Saving..." : "Save Configuration"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
