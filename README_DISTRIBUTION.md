# 🚀 SmartHire AI - Full Stack Recruitment Suite

SmartHire is an enterprise-grade AI recruitment platform powered by Bun, Next.js, and specialized microservices for automated hiring workflows.

## 📦 Docker Hub Registry
All official images for this stack are maintained here:
👉 [https://hub.docker.com/u/abdellahdev64](https://hub.docker.com/u/abdellahdev64)

## 🏗️ Services Included
- **smarthire-app**: Next.js Web Dashboard
- **mcp-server**: Model Context Protocol integration
- **candidate-service**: Resume processing & management
- **job-service**: Job posting & lifecycle
- **matching-service**: AI-powered candidate/job matching (OpenAI)
- **report-service**: Automated PDF/Text recruitment reports
- **notification-service**: Email & system alerts
- **meet-scheduler**: Google Meet & Teams integration
- **s3-processing**: Cloud document storage handler
- **email-processing**: Automated resume intake via IMAP

## 🚀 Deployment

The easiest way to run the stack is to create a `.env` file in the same directory as the compose file and include `DOCKER_USER=abdellahdev64`.

### Using Docker Compose

```bash
# 1. Pull all images
# On Windows (PowerShell):
$env:DOCKER_USER="abdellahdev64"; docker-compose -f docker-compose.hub.yml pull

# On Linux/macOS/Git Bash:
DOCKER_USER=abdellahdev64 docker-compose -f docker-compose.hub.yml pull

# 2. Start all services
docker-compose -f docker-compose.hub.yml up -d
```

---
*Created by [abdellahdev64](https://hub.docker.com/u/abdellahdev64)*
