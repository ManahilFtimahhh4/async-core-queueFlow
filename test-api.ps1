# Async Core - Testing Workflow (PowerShell version)
# Usage: .\test-api.ps1 -Test health
# Examples:
#   .\test-api.ps1 -Test health
#   .\test-api.ps1 -Test submit
#   .\test-api.ps1 -Test stats
#   .\test-api.ps1 -Test all

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string]$Test = "all"
)

$BASE_URL = "http://localhost:3000"

# Color definitions
$Colors = @{
    Blue   = [System.ConsoleColor]::Blue
    Green  = [System.ConsoleColor]::Green
    Yellow = [System.ConsoleColor]::Yellow
    Red    = [System.ConsoleColor]::Red
    White  = [System.ConsoleColor]::White
}

# Helper functions
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

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Yellow
}

function Print-Request {
    param([string]$Method, [string]$Endpoint)
    Write-Host "Request:" -ForegroundColor $Colors.Yellow
    Write-Host "$Method $BASE_URL$Endpoint" -ForegroundColor $Colors.White
}

function Print-Response {
    Write-Host "Response:" -ForegroundColor $Colors.Yellow
}

# Test: Health Check
function Test-Health {
    Print-Section "TEST 1: Server Health Check"
    
    Print-Request "GET" "/health"
    
    Print-Response
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Server is healthy"
    }
    catch {
        Print-Error "Failed to reach server: $_"
    }
}

# Test: Queue Health
function Test-QueueHealth {
    Print-Section "TEST 2: Queue Health Check"
    
    Print-Request "GET" "/api/queue/health"
    
    Print-Response
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/queue/health" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Queue is healthy"
    }
    catch {
        Print-Error "Failed to reach queue endpoint: $_"
    }
}

# Test: Submit Emails
function Test-SubmitEmails {
    Print-Section "TEST 3: Submit Bulk Emails (2 recipients)"
    
    Print-Request "POST" "/api/jobs/email/jobs"
    Write-Host "Body:" -ForegroundColor $Colors.Yellow
    $body = @{
        recipients = @("alice@example.com", "bob@example.com")
        subject    = "Welcome to Async Core"
        message    = "This is a test email from the background processing system"
    }
    Write-Host ($body | ConvertTo-Json)
    
    Print-Response
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/jobs/email/jobs" `
            -Method Post `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json)
        
        Write-Host ($response | ConvertTo-Json -Depth 10)
        
        $script:FirstJobId = $response.data.jobIds[0]
        Write-Host "First Job ID: $script:FirstJobId" -ForegroundColor $Colors.Yellow
        
        Print-Success "Email jobs submitted"
    }
    catch {
        Print-Error "Failed to submit emails: $_"
    }
}

# Test: Get Queue Stats
function Test-QueueStats {
    Print-Section "TEST 4: Email Queue Statistics"
    
    Print-Request "GET" "/api/jobs/email/stats"
    
    Print-Response
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/jobs/email/stats" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Queue statistics retrieved"
    }
    catch {
        Print-Error "Failed to retrieve queue stats: $_"
    }
}

# Test: Job Status
function Test-JobStatus {
    Print-Section "TEST 5: Check Job Status"
    
    if ([string]::IsNullOrEmpty($script:FirstJobId)) {
        Print-Info "Submitting test emails first..."
        Test-SubmitEmails
        Start-Sleep -Seconds 2
    }
    
    Print-Request "GET" "/api/jobs/email/jobs/$script:FirstJobId"
    
    Print-Response
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/jobs/email/jobs/$script:FirstJobId" -Method Get
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Job status retrieved"
    }
    catch {
        Print-Error "Failed to retrieve job status: $_"
    }
}

# Test: Error Handling - Missing Recipients
function Test-ErrorMissingRecipients {
    Print-Section "TEST 6: Error Handling - Missing Recipients"
    
    Print-Request "POST" "/api/jobs/email/jobs (missing recipients)"
    Write-Host "Body:" -ForegroundColor $Colors.Yellow
    $body = @{
        subject = "No Recipients"
        message = "This should fail"
    }
    Write-Host ($body | ConvertTo-Json)
    
    Print-Response "Expected 400"
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/jobs/email/jobs" `
            -Method Post `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json) `
            -ErrorAction Stop
        Write-Host ($response | ConvertTo-Json -Depth 10)
    }
    catch {
        Write-Host ($_.Exception.Response.StatusCode) -ForegroundColor $Colors.Yellow
        Print-Success "Error handling verified"
    }
}

# Test: Error Handling - Invalid Job ID
function Test-ErrorInvalidJobId {
    Print-Section "TEST 7: Error Handling - Invalid Job ID"
    
    Print-Request "GET" "/api/jobs/email/jobs/invalid-id-12345"
    
    Print-Response "Expected 404"
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/jobs/email/jobs/invalid-id-12345" `
            -Method Get `
            -ErrorAction Stop
        Write-Host ($response | ConvertTo-Json -Depth 10)
    }
    catch {
        Write-Host ($_.Exception.Response.StatusCode) -ForegroundColor $Colors.Yellow
        Print-Success "Error handling verified"
    }
}

# Test: Submit Many Emails
function Test-SubmitMany {
    Print-Section "TEST 8: Submit Bulk Emails (10 recipients)"
    
    Print-Request "POST" "/api/jobs/email/jobs (10 recipients)"
    
    Print-Response
    try {
        $body = @{
            recipients = @(
                "user1@example.com",
                "user2@example.com",
                "user3@example.com",
                "user4@example.com",
                "user5@example.com",
                "user6@example.com",
                "user7@example.com",
                "user8@example.com",
                "user9@example.com",
                "user10@example.com"
            )
            subject = "Bulk Email Test"
            message = "Testing bulk email submission with 10 recipients"
        }
        
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/jobs/email/jobs" `
            -Method Post `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json)
        
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Print-Success "Bulk emails submitted"
    }
    catch {
        Print-Error "Failed to submit bulk emails: $_"
    }
}

# Test: Full Workflow
function Test-AllWorkflow {
    Print-Section "FULL END-TO-END TESTING WORKFLOW"
    Write-Host "This will run all tests in sequence" -ForegroundColor $Colors.Yellow
    Write-Host ""
    
    Test-Health
    Write-Host ""
    
    Test-QueueHealth
    Write-Host ""
    
    Test-SubmitEmails
    Write-Host ""
    
    Start-Sleep -Seconds 2
    
    Test-QueueStats
    Write-Host ""
    
    Test-JobStatus
    Write-Host ""
    
    Test-ErrorMissingRecipients
    Write-Host ""
    
    Test-ErrorInvalidJobId
    Write-Host ""
    
    Test-SubmitMany
    Write-Host ""
    
    Start-Sleep -Seconds 2
    
    Test-QueueStats
    Write-Host ""
    
    Print-Section "ALL TESTS COMPLETED"
}

# Main logic
switch ($Test.ToLower()) {
    "health" {
        Test-Health
    }
    "queue-health" {
        Test-QueueHealth
    }
    "submit" {
        Test-SubmitEmails
    }
    "stats" {
        Test-QueueStats
    }
    "status" {
        Test-JobStatus
    }
    "errors" {
        Test-ErrorMissingRecipients
        Test-ErrorInvalidJobId
    }
    "bulk" {
        Test-SubmitMany
    }
    "all" {
        Test-AllWorkflow
    }
    default {
        Write-Host "Usage: .\test-api.ps1 -Test [test_name]" -ForegroundColor $Colors.Yellow
        Write-Host ""
        Write-Host "Available tests:" -ForegroundColor $Colors.Yellow
        Write-Host "  health       - Server health check"
        Write-Host "  queue-health - Queue health check"
        Write-Host "  submit       - Submit email jobs"
        Write-Host "  stats        - Queue statistics"
        Write-Host "  status       - Job status tracking"
        Write-Host "  errors       - Error handling tests"
        Write-Host "  bulk         - Submit bulk emails"
        Write-Host "  all          - Run all tests (default)"
    }
}
