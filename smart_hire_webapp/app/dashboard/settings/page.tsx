"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { CheckCircle, ExternalLink, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { connectMeetingAccount, getCompanySettings, getMeetingConnection, revokeMeetingConnection, updateIMAPSettings, updateS3Settings, updateSMTPSettings, updateTeamsConversationIds } from "./actions";

export default function CompanySettingsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [smtpLoading, setSmtpLoading] = useState(false);
    const [imapLoading, setImapLoading] = useState(false);
    const [s3Loading, setS3Loading] = useState(false);

    // Type definition forsettings state matching the interface in actions
    interface SettingsState {
        teamsIds: string[];
        googleMeetEnabled: boolean;
        imapServer: string;
        imapPort: number;
        imapEmail: string;
        imapPassword?: string;
        smtpServer: string;
        smtpPort: number;
        smtpEmail: string;
        smtpPassword?: string;
        s3Bucket: string;
        s3AccessKey: string;
        s3SecretKey?: string;
        s3Region: string;
        s3Endpoint?: string;
    }

    const [settings, setSettings] = useState<SettingsState>({
        teamsIds: [],
        googleMeetEnabled: false,
        imapServer: "",
        imapPort: 993,
        imapEmail: "",
        smtpServer: "",
        smtpPort: 587,
        smtpEmail: "",
        s3Bucket: "",
        s3AccessKey: "",
        s3Region: "us-east-1",
        s3Endpoint: ""
    });

    const [meetingConnection, setMeetingConnection] = useState<{ email: string } | null>(null);
    const [teamsIdsInput, setTeamsIdsInput] = useState("");

    const hasLoaded = useRef(false);
    useEffect(() => {
        if (session?.user?.id && !hasLoaded.current) {
            const companyId = (session.user as { companyId?: string }).companyId;
            if (companyId) {
                hasLoaded.current = true;
                loadSettings(companyId);
            }
        }
    }, [session]);

    const loadSettings = async (companyId: string) => {
        const result = await getCompanySettings(companyId);
        if (result.success && result.settings) {
            const data = result.settings;
            setSettings(prev => ({
                ...prev,
                teamsIds: data.microsoftTeamsIds || [],
                googleMeetEnabled: data.googleMeetEnabled,
                imapServer: data.imapServer || "",
                imapPort: data.imapPort || 993,
                imapEmail: data.imapEmail || "",
                smtpServer: data.smtpServer || "",
                smtpPort: data.smtpPort || 587,
                smtpEmail: data.smtpEmail || "",
                s3Bucket: data.s3Bucket || "",
                s3AccessKey: data.s3AccessKey || "",
                s3Region: data.s3Region || "us-east-1",
                s3Endpoint: data.s3Endpoint || ""
            }));
        } else if (!result.success) {
            toast.error(result.error || "Failed to load settings");
        }

        // Load meeting connection separately
        const connResult = await getMeetingConnection(companyId);
        if (connResult.success && connResult.connection) {
            setMeetingConnection({ email: connResult.connection.email || "Connected account" });
        } else {
            setMeetingConnection(null);
        }
    };

    const handleConnectMeet = async () => {
        const companyId = (session?.user as { companyId?: string })?.companyId;
        if (!companyId) return;

        const result = await connectMeetingAccount();
        if (result.success && result.url) {
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            const authWindow = window.open(
                result.url,
                "Connect Google Meet",
                `width=${width},height=${height},left=${left},top=${top}`
            );

            // Poll for connection status
            const interval = setInterval(async () => {
                const connRes = await getMeetingConnection(companyId);
                if (connRes.success && connRes.connection) {
                    setMeetingConnection({ email: connRes.connection.email || "Connected account" });
                    toast.success("Google Meet connected successfully");
                    clearInterval(interval);
                }
                if (authWindow?.closed) {
                    clearInterval(interval);
                }
            }, 2000);
        } else {
            toast.error(result.error || "Failed to initiate connection");
        }
    };

    const handleRevokeMeet = async () => {
        const companyId = (session?.user as { companyId?: string })?.companyId;
        if (!companyId) return;

        const result = await revokeMeetingConnection(companyId);
        if (result.success) {
            setMeetingConnection(null);
            toast.success("Google Meet connection revoked");
        } else {
            toast.error(result.error || "Failed to revoke connection");
        }
    };

    const addTeamsId = () => {
        if (!teamsIdsInput.trim()) return;
        if (settings.teamsIds.includes(teamsIdsInput.trim())) {
            toast.error("ID already added");
            return;
        }
        setSettings(prev => ({
            ...prev,
            teamsIds: [...prev.teamsIds, teamsIdsInput.trim()]
        }));
        setTeamsIdsInput("");
    };

    const removeTeamsId = (id: string) => {
        setSettings(prev => ({
            ...prev,
            teamsIds: prev.teamsIds.filter(t => t !== id)
        }));
    };

    const handleSaveTeamsIds = async () => {
        const companyId = (session?.user as { companyId?: string })?.companyId;
        if (!companyId) return;

        setLoading(true);
        const result = await updateTeamsConversationIds(companyId, settings.teamsIds);
        if (result.success) {
            toast.success("Teams Conversation IDs saved");
        } else {
            toast.error(result.error || "Failed to save Teams IDs");
        }
        setLoading(false);
    };

    const handleSaveSMTP = async () => {
        const companyId = (session?.user as { companyId?: string })?.companyId;
        if (!companyId) return;

        setSmtpLoading(true);
        const result = await updateSMTPSettings(companyId, {
            smtpServer: settings.smtpServer,
            smtpPort: settings.smtpPort,
            smtpEmail: settings.smtpEmail,
            smtpPassword: settings.smtpPassword
        });

        if (result.success) {
            toast.success("SMTP settings validated and saved");
        } else {
            toast.error(result.error || "Failed to save SMTP settings");
        }
        setSmtpLoading(false);
    };

    const handleSaveIMAP = async () => {
        const companyId = (session?.user as { companyId?: string })?.companyId;
        if (!companyId) return;

        setImapLoading(true);
        const result = await updateIMAPSettings(companyId, {
            imapServer: settings.imapServer,
            imapPort: settings.imapPort,
            imapEmail: settings.imapEmail,
            imapPassword: settings.imapPassword
        });

        if (result.success) {
            toast.success("IMAP settings validated and saved");
        } else {
            toast.error(result.error || "Failed to save IMAP settings");
        }
        setImapLoading(false);
    };

    const handleSaveS3 = async () => {
        const companyId = (session?.user as { companyId?: string })?.companyId;
        if (!companyId) return;

        setS3Loading(true);
        const result = await updateS3Settings(companyId, {
            s3Bucket: settings.s3Bucket,
            s3AccessKey: settings.s3AccessKey,
            s3SecretKey: settings.s3SecretKey,
            s3Region: settings.s3Region,
            s3Endpoint: settings.s3Endpoint
        });

        if (result.success) {
            toast.success("S3 settings validated and saved");
        } else {
            toast.error(result.error || "Failed to save S3 settings");
        }
        setS3Loading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Company Settings</h2>
                <p className="text-muted-foreground">Manage your integrations and communication channels.</p>
            </div>

            <Tabs defaultValue="integrations" className="space-y-4">
                <TabsList className="bg-muted border border-border">
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    <TabsTrigger value="email">Email & Imap</TabsTrigger>
                    <TabsTrigger value="storage">Storage (S3)</TabsTrigger>
                </TabsList>

                <TabsContent value="integrations" className="space-y-4">
                    <Card className="bg-card/50 border-border backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Meeting Platforms</CardTitle>
                            <CardDescription>Configure how interviews are scheduled.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-base">Google Meet</Label>
                                        {meetingConnection && (
                                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                <CheckCircle className="size-3" />
                                                Connected
                                            </span>
                                        )}
                                    </div>
                                    <CardDescription>
                                        {meetingConnection
                                            ? `Currently connected as ${meetingConnection.email}`
                                            : "Connect your Google account to enable automated scheduling."}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {meetingConnection ? (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleConnectMeet}
                                                className="border-border hover:bg-muted"
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Reconnect
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={handleRevokeMeet}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Revoke
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={handleConnectMeet}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Separator className="bg-border" />

                            <div className="space-y-4">
                                <div className="flex items-end justify-between">
                                    <div className="space-y-2 flex-1 mr-4">
                                        <Label>Teams Conversation Ids</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                className="bg-muted border-border"
                                                placeholder="Type ID and hit Enter"
                                                value={teamsIdsInput}
                                                onChange={(e) => setTeamsIdsInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        addTeamsId();
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                onClick={addTeamsId}
                                                className="shrink-0"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSaveTeamsIds}
                                        disabled={loading}
                                        variant="secondary"
                                        className="mb-0.5"
                                    >
                                        {loading ? "Saving..." : "Save Conversation Ids"}
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[40px] p-4 rounded-lg border border-dashed border-border bg-muted/30">
                                    {settings.teamsIds.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic w-full text-center py-2">No conversation IDs added yet.</p>
                                    ) : (
                                        settings.teamsIds.map((id) => (
                                            <div
                                                key={id}
                                                className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded-md text-sm group"
                                            >
                                                <span className="font-mono">{id}</span>
                                                <button
                                                    onClick={() => removeTeamsId(id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground/60">Used for Teams meeting integration via conversation threads.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SMTP Card */}
                        <Card className="bg-card/50 border-border backdrop-blur-sm flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    SMTP Configuration
                                </CardTitle>
                                <CardDescription>Settings for sending outbound emails.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-1">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label>SMTP Host</Label>
                                        <Input
                                            className="bg-muted border-border"
                                            placeholder="smtp.example.com"
                                            value={settings.smtpServer}
                                            onChange={(e) => setSettings(prev => ({ ...prev, smtpServer: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>SMTP Port</Label>
                                        <Input
                                            type="number"
                                            className="bg-muted border-border"
                                            placeholder="587"
                                            value={settings.smtpPort}
                                            onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>SMTP Email</Label>
                                    <Input
                                        className="bg-muted border-border"
                                        placeholder="user@example.com"
                                        value={settings.smtpEmail}
                                        onChange={(e) => setSettings(prev => ({ ...prev, smtpEmail: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>SMTP Password</Label>
                                    <Input
                                        type="password"
                                        className="bg-muted border-border"
                                        placeholder="••••••••"
                                        value={settings.smtpPassword || ""}
                                        onChange={(e) => setSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Leave empty to use existing password.</p>
                                </div>
                            </CardContent>
                            <div className="p-6 pt-0 mt-auto">
                                <Button
                                    onClick={handleSaveSMTP}
                                    disabled={smtpLoading}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    {smtpLoading ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save SMTP
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>

                        {/* IMAP Card */}
                        <Card className="bg-card/50 border-border backdrop-blur-sm flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    IMAP Configuration
                                </CardTitle>
                                <CardDescription>Settings for receiving inbound emails.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-1">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label>IMAP Host</Label>
                                        <Input
                                            className="bg-muted border-border"
                                            placeholder="imap.example.com"
                                            value={settings.imapServer}
                                            onChange={(e) => setSettings(prev => ({ ...prev, imapServer: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>IMAP Port</Label>
                                        <Input
                                            type="number"
                                            className="bg-muted border-border"
                                            placeholder="993"
                                            value={settings.imapPort}
                                            onChange={(e) => setSettings(prev => ({ ...prev, imapPort: parseInt(e.target.value) || 993 }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>IMAP Email</Label>
                                    <Input
                                        className="bg-muted border-border"
                                        placeholder="user@example.com"
                                        value={settings.imapEmail}
                                        onChange={(e) => setSettings(prev => ({ ...prev, imapEmail: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>IMAP Password</Label>
                                    <Input
                                        type="password"
                                        className="bg-muted border-border"
                                        placeholder="••••••••"
                                        value={settings.imapPassword || ""}
                                        onChange={(e) => setSettings(prev => ({ ...prev, imapPassword: e.target.value }))}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Leave empty to use existing password.</p>
                                </div>
                            </CardContent>
                            <div className="p-6 pt-0 mt-auto">
                                <Button
                                    onClick={handleSaveIMAP}
                                    disabled={imapLoading}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    {imapLoading ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save IMAP
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="storage" className="space-y-4">
                    <Card className="bg-card/50 border-border backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>AWS S3 Configuration</CardTitle>
                            <CardDescription>Storage for candidate resumes and documents.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Bucket Name</Label>
                                <Input
                                    className="bg-muted border-border"
                                    value={settings.s3Bucket}
                                    onChange={(e) => setSettings(prev => ({ ...prev, s3Bucket: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Access Key ID</Label>
                                <Input
                                    className="bg-muted border-border"
                                    value={settings.s3AccessKey}
                                    onChange={(e) => setSettings(prev => ({ ...prev, s3AccessKey: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Secret Access Key</Label>
                                <Input
                                    type="password"
                                    className="bg-muted border-border"
                                    placeholder="••••••••"
                                    value={settings.s3SecretKey || ""}
                                    onChange={(e) => setSettings(prev => ({ ...prev, s3SecretKey: e.target.value }))}
                                />
                                <p className="text-[10px] text-muted-foreground">Leave empty to use existing secret key.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Region</Label>
                                <Input
                                    className="bg-muted border-border"
                                    value={settings.s3Region}
                                    onChange={(e) => setSettings(prev => ({ ...prev, s3Region: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Endpoint</Label>
                                <Input
                                    className="bg-muted border-border"
                                    placeholder="https://s3.us-east-1.amazonaws.com"
                                    value={settings.s3Endpoint}
                                    onChange={(e) => setSettings(prev => ({ ...prev, s3Endpoint: e.target.value }))}
                                />
                                <p className="text-[10px] text-muted-foreground">Required for S3-compatible storage (Minio, R2, etc.). Leave empty for default AWS.</p>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0 flex justify-end">
                            <Button
                                onClick={handleSaveS3}
                                disabled={s3Loading}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px]"
                            >
                                {s3Loading ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save S3 Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

