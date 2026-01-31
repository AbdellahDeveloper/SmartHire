# push_to_hub.ps1
param (
    [Parameter(Mandatory=$true)]
    [string]$Username
)

$services = @(
    "candidate-service",
    "job-service",
    "matching-service",
    "report-service",
    "email-processing-service",
    "s3-processing-service",
    "notification-service",
    "meet-scheduler",
    "mcp-server",
    "smarthire"
)

$projectName = "smarthire" 

Write-Host "Starting Tag and Push for all 10 services to Docker Hub user: $Username" -ForegroundColor Cyan

foreach ($service in $services) {
    # Ensure variables are treated as strings and concatenated properly
    $localImage = $projectName + "-" + $service
    $remoteImage = $Username + "/smarthire-" + $service + ":latest"
    
    Write-Host "----------------------------------------------------"
    Write-Host "Processing $service..." -ForegroundColor Yellow
    
    # Tagging
    Write-Host "Tagging $localImage -> $remoteImage"
    docker tag "$localImage" "$remoteImage"
    
    # Pushing
    Write-Host "Pushing $remoteImage..."
    docker push "$remoteImage"
}

Write-Host "----------------------------------------------------"
Write-Host "All services processed!" -ForegroundColor Green
Write-Host "You can now share your docker-compose.hub.yml with others." -ForegroundColor Green
