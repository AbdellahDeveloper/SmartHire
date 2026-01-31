@echo off
setlocal enabledelayedexpansion

set services=candidate_service email_processing_service job_service matching_service meet_scheduler notification_service report_service s3_processing_service smart_hire_mcp_server smart_hire_webapp

echo.
echo ============================================================
echo   🚀 Starting Prisma Client Generation for All Services
echo ============================================================
echo.

set ROOT_DIR=%~dp0

for %%s in (%services%) do (
    echo [%%s] Working...
    if exist "%ROOT_DIR%%%s\prisma\schema.prisma" (
        cd /d "%ROOT_DIR%%%s"
        call bunx prisma generate
        if !errorlevel! neq 0 (
            echo ❌ Error generating Prisma client for %%s
        ) else (
            echo ✅ Successfully generated for %%s
        )
        cd /d "%ROOT_DIR%"
    ) else (
        echo ⚠️  Skipping: %%s (prisma/schema.prisma not found)
    )
    echo.
)

echo ============================================================
echo   ✨ All tasks completed!
echo ============================================================
echo.
pause
