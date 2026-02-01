"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";
import { Check, Copy, Info, RefreshCw, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMCPConfig, regenerateMCPToken } from "./actions";

export default function MCPIntegrationPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [config, setConfig] = useState<{ token: string | null; serverUrl: string }>({
        token: null,
        serverUrl: "http://SERVER_IP:3012/mcp"
    });
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const companyId = (session?.user as { companyId?: string })?.companyId;
        if (companyId) {
            loadConfig(companyId);
        }
    }, [session]);

    const loadConfig = async (companyId: string) => {
        const result = await getMCPConfig(companyId);
        if (result.success) {
            setConfig({ token: result.token ?? null, serverUrl: result.serverIp ?? "" });
        } else {
            toast.error(result.error || "Failed to load MCP configuration");
        }
        setLoading(false);
    };

    const handleRegenerate = async () => {
        const companyId = (session?.user as { companyId?: string })?.companyId;
        if (!companyId) return;

        setRegenerating(true);
        const result = await regenerateMCPToken(companyId);
        if (result.success) {
            setConfig(prev => ({ ...prev, token: result.token ?? null }));
            toast.success("MCP Token regenerated");
        } else {
            toast.error(result.error || "Failed to regenerate token");
        }
        setRegenerating(false);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">MCP Integration</h2>
                <p className="text-muted-foreground">Connect your Model Context Protocol server to SmartHire.</p>
            </div>

            <Separator className="bg-border" />

            <div className="grid gap-6">
                <Card className="bg-card/50 border-border backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl flex items-center gap-2">
                            Server Configuration
                        </CardTitle>
                        <CardDescription>Use these details to configure your MCP client connection.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Server IP Address</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 font-mono text-sm bg-muted rounded-md px-3 py-2 border border-border">
                                        {config.serverUrl}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(config.serverUrl, 'ip')}
                                        className="shrink-0 h-9 w-9"
                                    >
                                        {copiedId === 'ip' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Authorization Token</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 font-mono text-sm bg-muted rounded-md px-3 py-2 border border-border truncate">
                                        {config.token || "No token generated"}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => config.token && copyToClipboard(config.token, 'token')}
                                            disabled={!config.token}
                                            className="h-9 w-9"
                                        >
                                            {copiedId === 'token' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={handleRegenerate}
                                            disabled={regenerating}
                                            className="h-9 w-9"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex gap-3 text-sm text-primary/80">
                            <Info className="size-5 shrink-0 mt-0.5" />
                            <p>
                                The authorization token is used to authenticate your MCP server requests.
                                Keep it secure and never share it in public repositories.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Terminal className="size-5" />
                            Integration Guide
                        </CardTitle>
                        <CardDescription>How to use this token in your MCP configuration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Direct HTTP Integration</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Include the token in the <code className="bg-muted px-1 rounded text-primary">Authorization</code> header for all requests to the MCP server.
                                </p>
                                <div className="bg-[#0f1117] text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto border border-white/5">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1 text-sm">
                                            <p className="text-blue-400">POST <span className="text-gray-300">/mcp</span></p>
                                            <p><span className="text-purple-400">Host:</span> {config.serverUrl}:3015</p>
                                            <p><span className="text-purple-400">Authorization:</span> {config.token || "YOUR_TOKEN"}</p>
                                            <p><span className="text-purple-400">Content-Type:</span> application/json</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs hover:bg-white/10"
                                            onClick={() => copyToClipboard(`Authorization: ${config.token || "YOUR_TOKEN"}`, 'header')}
                                        >
                                            {copiedId === 'header' ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : null}
                                            {copiedId === 'header' ? 'Copied' : 'Copy Header'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <div>
                                <h4 className="font-semibold text-foreground mb-2">Claude API / Messages API Connector</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Integrate your MCP server directly into Claude API calls using the <code className="bg-muted px-1 rounded text-primary">mcp_servers</code> structure.
                                </p>
                                <div className="bg-[#0f1117] text-gray-300 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-white/5">
                                    <pre className="text-emerald-400">
                                        {`{
  "mcp_servers": [
    {
      "type": "url",
      "url": "${config.serverUrl}",
      "name": "smarthire-server",
      "authorization_token": "${config.token || "YOUR_TOKEN"}"
    }
  ],
  "tools": [
    {
      "type": "mcp_toolset",
      "mcp_server_name": "smarthire-server"
    }
  ]
}`}
                                    </pre>
                                    <div className="flex justify-end mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs hover:bg-white/10"
                                            onClick={() => copyToClipboard(JSON.stringify({
                                                mcp_servers: [{
                                                    type: "url",
                                                    url: `${config.serverUrl}`,
                                                    name: "smarthire-server",
                                                    authorization_token: config.token || "YOUR_TOKEN"
                                                }],
                                                tools: [{
                                                    type: "mcp_toolset",
                                                    mcp_server_name: "smarthire-server"
                                                }]
                                            }, null, 2), 'json')}
                                        >
                                            {copiedId === 'json' ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : null}
                                            {copiedId === 'json' ? 'Copied' : 'Copy JSON'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
