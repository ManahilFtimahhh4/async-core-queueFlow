# Async Core - Integration Test Suite (PowerShell)
# Tests all major features of the system

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Async Core - Integration Test Suite                ║" -ForegroundColor Cyan
Write-Host "║        Testing all system components                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:3000/api"
$HEALTH_URL = "http://localhost:3000/health"

$TESTS_PASSED = 0
$TESTS_FAILED = 0

# Helper function for API tests
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data,
        [string]$ExpectedCode,
        [string]$Description
    )

    Write-Host -NoNewline "Testing: $Description... "

    try {
        $params = @{
            Uri = "$API_URL$Endpoint"
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 5
        }

        if ($Method -eq "POST" -and $Data) {
            $params['Body'] = $Data
        }

        $response = Invoke-WebRequest @params
        $http_code = $response.StatusCode
        $body = $response.Content
    }
    catch {
        $http_code = $_.Exception.Response.StatusCode.Value
        $body = $_.Exception.Response | ConvertFrom-Json
    }

    if ($http_code -eq $ExpectedCode) {
        Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
        Write-Host " (HTTP $http_code)"
        $script:TESTS_PASSED++
        return $true
    }
    else {
        Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
        Write-Host " (Expected $ExpectedCode, Got $http_code)"
        if ($body) { Write-Host "Response: $body" }
        $script:TESTS_FAILED++
        return $false
    }
}

# Test health check
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "1. Health Check"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

Write-Host -NoNewline "Testing: Health endpoint... "
try {
    $response = Invoke-WebRequest -Uri $HEALTH_URL -TimeoutSec 5
    Write-Host "✓ PASS" -ForegroundColor Green
    $script:TESTS_PASSED++
}
catch {
    Write-Host "✗ FAIL" -ForegroundColor Red
    Write-Host "Make sure the server is running: npm run dev"
    exit 1
}
Write-Host ""

# Test Email API
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "2. Email Job Submission"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

Test-Endpoint "POST" "/jobs/email/jobs" `
    '{"recipients":["test1@example.com"],"subject":"Test","message":"Test message"}' `
    "202" `
    "Submit single email job"

Test-Endpoint "POST" "/jobs/email/jobs" `
    '{"recipients":["user1@example.com","user2@example.com"],"subject":"Bulk Test","message":"Bulk message"}' `
    "202" `
    "Submit bulk email jobs (2 recipients)"

Test-Endpoint "POST" "/jobs/email/jobs" `
    '{"recipients":[],"subject":"Test","message":"Test"}' `
    "400" `
    "Reject empty recipients array"

Test-Endpoint "POST" "/jobs/email/jobs" `
    '{"recipients":["invalid-email"],"subject":"Test","message":"Test"}' `
    "400" `
    "Reject invalid email address"

Write-Host ""

# Test Queue Stats
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "3. Queue Statistics"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

Test-Endpoint "GET" "/jobs/email/stats" "" "200" "Get email queue statistics"
Test-Endpoint "GET" "/jobs/email/stats" "" "200" "Get queue stats (should have jobs)"

Write-Host ""

# Test Dashboard
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "4. Dashboard Endpoints"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

Test-Endpoint "GET" "/dashboard/overview" "" "200" "Get dashboard overview"
Test-Endpoint "GET" "/dashboard/queues" "" "200" "Get queue metrics"
Test-Endpoint "GET" "/dashboard/history?limit=10" "" "200" "Get job history (limit=10)"
Test-Endpoint "GET" "/dashboard/metrics" "" "200" "Get performance metrics"
Test-Endpoint "GET" "/dashboard/dlq?limit=5" "" "200" "Get Dead Letter Queue jobs"
Test-Endpoint "GET" "/dashboard/redis" "" "200" "Get Redis status"

Write-Host ""

# Test Queue Health
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "5. System Health"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

Test-Endpoint "GET" "/queue/health" "" "200" "Get queue health status"
Test-Endpoint "GET" "/queue/stats" "" "200" "Get overall queue stats"

Write-Host ""

# Get a job ID for testing
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "6. Job Retrieval"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

Write-Host -NoNewline "Submitting test job to get job ID... "
try {
    $response = Invoke-WebRequest -Uri "$API_URL/jobs/email/jobs" -Method POST `
        -ContentType "application/json" `
        -Body '{"recipients":["jobtest@example.com"],"subject":"Job Test","message":"Job test message"}' `
        -TimeoutSec 5

    $data = $response.Content | ConvertFrom-Json
    $job_id = $data.data.jobIds[0]

    if ($job_id) {
        Write-Host "✓ Got job ID: $job_id" -ForegroundColor Green
        
        # Test getting job status
        Test-Endpoint "GET" "/jobs/email/jobs/$job_id" "" "200" "Get job status by ID"
    }
    else {
        Write-Host "⚠ Could not extract job ID" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ FAIL" -ForegroundColor Red
}

Write-Host ""

# Error Handling Tests
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "7. Error Handling"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

Test-Endpoint "GET" "/jobs/email/jobs/invalid-job-id" "" "404" "Handle non-existent job ID"
Test-Endpoint "POST" "/jobs/email/jobs" '{"recipients":"not-an-array","subject":"Test","message":"Test"}' "400" "Handle invalid recipients format"
Test-Endpoint "POST" "/jobs/email/jobs" '{"recipients":["test@example.com"],"subject":""}' "400" "Handle empty subject"

Write-Host ""

# Test Results Summary
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "Test Results Summary"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

$total = $TESTS_PASSED + $TESTS_FAILED
$pass_rate = if ($total -gt 0) { [math]::Round($TESTS_PASSED * 100 / $total) } else { 0 }

Write-Host "Total Tests: $total"
Write-Host "Passed: $TESTS_PASSED" -ForegroundColor Green
Write-Host "Failed: $TESTS_FAILED" -ForegroundColor Red
Write-Host "Pass Rate: $pass_rate%"
Write-Host ""

if ($TESTS_FAILED -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Visit http://localhost:3000 to view the dashboard"
    Write-Host "2. Test the UI features manually"
    Write-Host "3. Submit jobs through the web interface"
    Write-Host "4. Monitor job processing in real-time"
    exit 0
}
else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "1. Ensure Redis is running: docker run -d -p 6379:6379 redis:alpine"
    Write-Host "2. Ensure server is running: npm run dev"
    Write-Host "3. Check server logs for errors"
    Write-Host "4. Verify API endpoints are accessible"
    exit 1
}
