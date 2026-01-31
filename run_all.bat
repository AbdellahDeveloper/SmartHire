@echo off
echo Starting all SmartHire services...

start "Candidate Service" bun ./candidate_service/src/index.ts
start "Job Service" bun ./job_service/src/index.ts
start "Matching Service" bun ./matching_service/src/index.ts
start "MCP Server" bun ./smart_hire_mcp_server/src/index.ts
start "Report Service" bun ./report_service/src/index.ts

echo ✅ All services are starting in separate windows.