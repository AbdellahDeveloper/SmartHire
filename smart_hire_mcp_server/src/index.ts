import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  InitializeRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { authStorage } from "./lib/auth-context.js";
import prisma from "./lib/prisma.js";
import { InitTeamsMCP } from "./teams/index.js";
import { candidateToolDefinitions, handleCandidateTools } from "./tools/candidate.tools.js";
import { companyToolDefinitions, handleCompanyTools } from "./tools/company.tools.js";
import { handleJobTools, jobToolDefinitions } from "./tools/job.tools.js";
import { handleMatchingTools, matchingToolDefinitions } from "./tools/matching.tools.js";
import { handleMeetingTools, meetingToolDefinitions } from "./tools/meeting.tools.js";
import { handleReportTools, reportToolDefinitions } from "./tools/report.tools.js";

const app = express();
app.use(cors());
app.use(express.json());

// Token validation middleware
const mcpAuthMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: Missing MCP Token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const company = await prisma.company.findUnique({
      where: { mcpToken: token },
      select: { id: true },
    });

    if (!company) {
      return res.status(401).json({ error: "Unauthorized: Invalid MCP Token" });
    }

    (req as any).mcpToken = token;
    (req as any).companyId = company.id;
    next();
  } catch (error) {
    console.error("[MCP AUTH ERROR]", error);
    res.status(500).json({ error: "Internal Server Error during authorization" });
  }
};

const server = new Server(
  {
    name: "smart-hire-mcp-server",
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
  ...companyToolDefinitions,
  ...meetingToolDefinitions,
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

server.setRequestHandler(InitializeRequestSchema, async () => {
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "smart-hire-mcp-server",
      version: "2.1.0",
    },
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const candidateResult = await handleCandidateTools(name, args);
  if (candidateResult) return candidateResult;

  const jobResult = await handleJobTools(name, args);
  if (jobResult) return jobResult;

  const matchingResult = await handleMatchingTools(name, args);
  if (matchingResult) return matchingResult;

  const reportResult = await handleReportTools(name, args);
  if (reportResult) return reportResult;

  const companyResult = await handleCompanyTools(name, args);
  if (companyResult) return companyResult;

  const meetingResult = await handleMeetingTools(name, args);
  if (meetingResult) return meetingResult;

  throw new Error(`Tool not found: ${name}`);
});

const transport = new StreamableHTTPServerTransport();

app.all("/mcp", mcpAuthMiddleware, async (req, res) => {
  console.log(`${req.method}: MCP request`);
  const token = (req as any).mcpToken;
  await authStorage.run({ token }, async () => {
    await transport.handleRequest(req, res, req.body);
  });
});

await server.connect(transport);
await InitTeamsMCP(app);

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.error(`Smart Hire MCP Server running on: http://localhost:${PORT}/mcp`);
  console.error("🔗 Connected to Candidate Service (3002), Job Service (3001), Matching Service (3004), and Meeting Service (3012)");
});
