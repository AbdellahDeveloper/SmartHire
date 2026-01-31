import { spawn } from "child_process";
import { JSONRPCRequest } from "@modelcontextprotocol/sdk/types.js";

async function testTool(method: string, params: any = {}) {
    return new Promise((resolve, reject) => {
        const server = spawn("bun", ["src/index.ts"], {
            stdio: ["pipe", "pipe", "inherit"],
        });

        const request: JSONRPCRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "call_tool",
            params: {
                name: method,
                arguments: params,
            },
        };

        let output = "";

        server.stdout.on("data", (data) => {
            output += data.toString();
            try {

                const match = output.match(/\{.*\}/s);
                if (match) {
                    const response = JSON.parse(match[0]);
                    if (response.id === 1) {
                        server.kill();
                        resolve(response);
                    }
                }
            } catch (e) {

            }
        });

        server.on("error", (err) => {
            reject(err);
        });

        server.stdin.write(JSON.stringify(request) + "\n");
    });
}

async function runTests() {
    console.log("Starting MCP Tool Tests...\n");

    const tests = [
        { name: "list_jobs", params: {} },
        { name: "match_candidates", params: { jobId: "test-job-id", limit: 3 } },
    ];

    for (const test of tests) {
        console.log(`Testing tool: ${test.name}...`);
        try {
            const response: any = await testTool(test.name, test.params);
            if (response.result) {
                console.log(`✅ ${test.name} success!`);
            } else if (response.error) {
                console.log(`❌ ${test.name} failed with error:`, response.error.message);
            }
        } catch (error: any) {
            console.log(`❌ ${test.name} system error:`, error.message);
        }
    }
}

runTests();
