import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
    CallToolRequestSchema,
    InitializeRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Express } from "express";
import { candidateToolDefinitions } from "../tools/candidate.tools.js";
import { jobToolDefinitions } from "../tools/job.tools.js";
import { matchingToolDefinitions } from "../tools/matching.tools.js";
import { reportToolDefinitions } from "../tools/report.tools.js";
import { handleTeamsTools } from "./handlers.js";

export const InitTeamsMCP = async (app: Express) => {
    const teamsServer = new Server(
        {
            name: "smart-hire-teams-mcp-server",
            version: "2.1.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    const allTools = [
        ...candidateToolDefinitions,
        ...jobToolDefinitions,
        ...matchingToolDefinitions,
        ...reportToolDefinitions,
    ];

    teamsServer.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: allTools,
    }));

    teamsServer.setRequestHandler(InitializeRequestSchema, async () => {
        return {
            protocolVersion: "2024-11-05",
            capabilities: {
                tools: {},
            },
            serverInfo: {
                name: "smart-hire-teams-mcp-server",
                version: "2.1.0",
            },
        };
    });

    teamsServer.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        const result = await handleTeamsTools(name, args);

        if (result) return result;

        throw new Error(`Tool not found: ${name}`);
    });

    const teamsTransport = new StreamableHTTPServerTransport();

    app.all("/teams/mcp", async (req, res) => {
        console.log(`${req.method}: Teams MCP request`);
        await teamsTransport.handleRequest(req, res, req.body);
    });

    await teamsServer.connect(teamsTransport);

    console.error("🚀 Teams MCP Extension initialized at /teams/mcp");
};
