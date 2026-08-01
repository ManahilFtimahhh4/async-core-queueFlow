param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string]$Test = "all"
)

$BASE_URL = "http://localhost:3000"

$Colors = @{
    Blue   = [System.ConsoleColor]::Blue
    Green  = [System.ConsoleColor]::Green
    Yellow = [System.ConsoleColor]::Yellow
    Red    = [System.ConsoleColor]::Red
    Cyan   = [System.ConsoleColor]::Cyan
    White  = [System.ConsoleColor]::White
}

function Print-Section {
    param([string]$Title)
    Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Blue
    Write-Host "║ $Title" -ForegroundColor $Colors.Blue
    Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Cyan
}

function Test-Health {
    Print-Section "Health Checks"
    
    Write-Host "GET /health" -ForegroundColor $Colors.Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Health check passed"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-Submit {
    Print-Section "Submit Email Jobs"
    
    Write-Host "POST /api/jobs/email/jobs (2 recipients)" -ForegroundColor $Colors.Yellow
    try {
        $body = @{
            recipients = @("alice@example.com", "bob@example.com")
            subject    = "Production Test"
            message    = "Testing production phase"
        }
        
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/jobs/email/jobs" `
            -Method Post `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json)
        
        Write-Host ($response | ConvertTo-Json -Depth 10)
        
        $script:FirstJobId = $response.data.jobIds[0]
        Print-Success "Jobs submitted: $script:FirstJobId"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-Dashboard {
    Print-Section "Dashboard Overview"
    
    Write-Host "GET /api/dashboard/overview" -ForegroundColor $Colors.Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/dashboard/overview" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Dashboard overview retrieved"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-QueueMetrics {
    Print-Section "Queue Metrics"
    
    Write-Host "GET /api/dashboard/queues" -ForegroundColor $Colors.Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/dashboard/queues" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Queue metrics retrieved"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-RedisStatus {
    Print-Section "Redis Status"
    
    Write-Host "GET /api/dashboard/redis" -ForegroundColor $Colors.Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/dashboard/redis" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Redis status retrieved"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-Performance {
    Print-Section "Performance Metrics"
    
    Write-Host "GET /api/dashboard/metrics" -ForegroundColor $Colors.Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/dashboard/metrics" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Performance metrics retrieved"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-History {
    Print-Section "Job History"
    
    Write-Host "GET /api/dashboard/history?limit=10" -ForegroundColor $Colors.Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/dashboard/history?limit=10" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Job history retrieved"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-JobStatus {
    Print-Section "Job Status"
    
    if ([string]::IsNullOrEmpty($script:FirstJobId)) {
        Print-Info "Submitting test jobs first..."
        Test-Submit
        Start-Sleep -Seconds 1
    }
    
    Write-Host "GET /api/jobs/email/jobs/$script:FirstJobId" -ForegroundColor $Colors.Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/jobs/email/jobs/$script:FirstJobId" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Job status retrieved"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-DLQ {
    Print-Section "Dead Letter Queue"
    
    Write-Host "GET /api/dashboard/dlq" -ForegroundColor $Colors.Yellow
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/dashboard/dlq" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "DLQ status retrieved"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-Stress {
    Print-Section "Stress Test (10 recipients)"
    
    Write-Host "POST /api/jobs/email/jobs (10 recipients)" -ForegroundColor $Colors.Yellow
    try {
        $recipients = @()
        1..10 | ForEach-Object { $recipients += "stress$_@example.com" }
        
        $body = @{
            recipients = $recipients
            subject    = "Stress Test"
            message    = "Testing under load"
        }
        
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/jobs/email/jobs" `
            -Method Post `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json)
        
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Stress test initiated"
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor $Colors.Red
    }
}

function Test-AllProduction {
    Print-Section "FULL PRODUCTION TESTING WORKFLOW"
    
    Test-Health
    Write-Host ""
    
    Test-Submit
    Write-Host ""
    
    Start-Sleep -Seconds 1
    
    Test-QueueMetrics
    Write-Host ""
    
    Test-RedisStatus
    Write-Host ""
    
    Test-Dashboard
    Write-Host ""
    
    Test-Performance
    Write-Host ""
    
    Test-JobStatus
    Write-Host ""
    
    Test-History
    Write-Host ""
    
    Test-DLQ
    Write-Host ""
    
    Test-Stress
    Write-Host ""
    
    Start-Sleep -Seconds 2
    
    Test-Dashboard
    Write-Host ""
    
    Print-Section "PRODUCTION TESTING COMPLETE"
}

switch ($Test.ToLower()) {
    "health" {
        Test-Health
    }
    "submit" {
        Test-Submit
    }
    "dashboard" {
        Test-Dashboard
    }
    "queues" {
        Test-QueueMetrics
    }
    "redis" {
        Test-RedisStatus
    }
    "metrics" {
        Test-Performance
    }
    "history" {
        Test-History
    }
    "status" {
        Test-JobStatus
    }
    "dlq" {
        Test-DLQ
    }
    "stress" {
        Test-Stress
    }
    "all" {
        Test-AllProduction
    }
    default {
        Write-Host "Usage: .\test-production.ps1 -Test [test_name]" -ForegroundColor $Colors.Yellow
        Write-Host ""
        Write-Host "Available tests:" -ForegroundColor $Colors.Yellow
        Write-Host "  health      - Health checks"
        Write-Host "  submit      - Submit emails"
        Write-Host "  dashboard   - Dashboard overview"
        Write-Host "  queues      - Queue metrics"
        Write-Host "  redis       - Redis status"
        Write-Host "  metrics     - Performance metrics"
        Write-Host "  history     - Job history"
        Write-Host "  status      - Job status"
        Write-Host "  dlq         - Dead Letter Queue"
        Write-Host "  stress      - Stress test"
        Write-Host "  all         - Run all tests (default)"
    }
}
