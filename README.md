# 🚀 SmartHire AI: Next-Gen Recruitment Platform

SmartHire AI is a state-of-the-art, microservices-based recruitment ecosystem designed to automate and augment the hiring process using advanced AI. From automated candidate extraction to intelligent job matching and interview scheduling, SmartHire AI streamlines the entire recruiter workflow.

---

## 🛠 Technology Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

---

## 🏗 System Architecture

The following diagram illustrates the interaction between the different microservices:

```mermaid
graph TD
    User((Recruiter)) --> WebApp[SmartHire WebApp]
    User --> TeamsBot[Teams Bot]
    
    subgraph Teams Service
        TeamsBot --> Planner[Planner Agent]
        TeamsBot --> Formatter[Formatter Agent]
        Planner --> Formatter
    end

    subgraph Core Ecosystem
        WebApp --> MCP[MCP Tool Server]
        Planner --> MCP[MCP Tool Server]
        WebApp --> Auth[BetterAuth]
        
        MCP --> JS[Job Service]
        MCP --> CS[Candidate Service]
        MCP --> MS[Matching Service]
        MCP --> RS[Report Service]
        
        JS --> DB[(MongoDB Cluster)]
        CS --> DB
        MS --> DB
        RS --> DB
        
        MS -.-> JS
        MS -.-> CS
        RS -.-> JS
        RS -.-> CS
    end
    
    subgraph Automation & External
        EmailProc[Email Processing Service] --> CS
        S3Proc[S3 Processing Service] --> CS
        NS[Notification Service] --> DB
        MSched[Meet Scheduler] --> DB
    end
    
    subgraph Storage & External AI
        RS --> S3[Cloud Storage S3]
        WebApp --> AI[Vercel AI SDK Hub]
        Planner --> AI
        AI --> LLM[OpenAI/Gemini/Claude]
    end
```

---

## 📦 Microservices Overview

| Service | Description |
| :--- | :--- |
| **`smart_hire_webapp`** | The main Next.js interface for managing jobs, candidates, and AI settings. |
| **`smart_hire_mcp_server`** | Model Context Protocol server that exposes hiring tools directly to AI agents. |
| **`candidate_service`** | Handles candidate lifecycle, CV parsing, and metadata extraction. |
| **`job_service`** | Manages job descriptions, requirements, and status tracking. |
| **`matching_service`** | Computes compatibility scores between candidates and jobs using LLMs. |
| **`report_service`** | Generates professional PDF matching reports and contracts via PodPDF. |
| **`notification_service`** | Runs background cron jobs for meeting reminders and high-score alerts. |
| **`meet_scheduler`** | Orchestrates Google Meet and Microsoft Teams interview integrations. |
| **`email_processing_service`** | Monitors IMAP mailboxes to automatically ingest incoming resumes. |
| **`s3_processing_service`** | Watches S3 buckets for new PDF uploads to trigger candidate extraction. |
| **`teams_bot_service`** | Microsoft Teams integration with a dual-agent architecture (Planner & Formatter). |

---

## 🤖 Teams Bot Architecture (Port 3000)

The SmartHire Teams Bot is built using a modern dual-agent pattern to provide a seamless conversational experience within Microsoft Teams:

### 🧩 The Planner Agent
- **MCP Integration**: Directly connected to the `smart_hire_mcp_server`.
- **Tool Orchestration**: Decides which tools to call based on user intent (e.g., "Find candidates for the JS developer role").
- **Human-in-the-loop**: Manages approval flows for sensitive operations that require recruiter confirmation before execution.

### 🎨 The Formatter Agent
- **UX Transformation**: Takes raw JSON responses from tools and the Planner.
- **Adaptive Cards**: Converts data into rich, interactive Microsoft Teams Adaptive Cards.
- **Engagement**: Ensures that lists of candidates, job details, and matching reports are beautifully rendered and actionable within the Teams interface.

---

## 🚀 Getting Started

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Bun Runtime](https://bun.sh/) (for local development)

### 1. Environment Configuration

#### Direct Parameter Injection
You can pass environment variables directly to the `docker-compose` command without editing any files. This is the standard way to inject secrets at runtime:

**Bash (Linux/macOS/WSL/Git Bash):**
```bash
ENCRYPTION_KEY="key" ENDPOINT="url" REGION="reg" ACCESS_KEY_ID="id" SECRET_ACCESS_KEY="sec" docker-compose up -d
```

**PowerShell (Windows):**
```powershell
$env:ENCRYPTION_KEY="key"; $env:ENDPOINT="url"; $env:REGION="reg"; $env:ACCESS_KEY_ID="id"; $env:SECRET_ACCESS_KEY="sec"; docker-compose up -d
```

This works because the `docker-compose.yml` is configured to "pull" these variables from your shell's environment using the `${VARIABLE_NAME}` syntax.

### 2. Deployment via Docker Compose

SmartHire is fully containerized. To spin up the entire stack:

```bash
# Build and start all 12 containers (MongoDB + 11 Services)
docker-compose up -d --build
```

The application will be available at:
- **WebApp**: [http://localhost:3000](http://localhost:3000)
- **Teams Bot**: [http://localhost:3333/api/messages](http://localhost:3333/api/messages)
- **MCP Server**: [http://localhost:3003](http://localhost:3003)
- **MongoDB**: [localhost:27017](localhost:27017)

---

## 🔒 Security

- **Encrypted Secrets**: Sensitive API keys (OpenAI, SMTP) are encrypted at rest in MongoDB using AES-256.
- **Role-Based Access**: Specialized views for Administrators and Company users.
- **MCP Authorization**: Cross-service tool calls are protected by unique MCP tokens.

---

## 📄 License

This project is proprietary. All rights reserved.
