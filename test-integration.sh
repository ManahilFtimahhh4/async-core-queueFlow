#!/bin/bash

# Async Core - Integration Test Suite
# Tests all major features of the system

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Async Core - Integration Test Suite                ║"
echo "║        Testing all system components                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api"
HEALTH_URL="http://localhost:3000/health"
TIMEOUT=5

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for tests
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_code=$4
    local description=$5

    echo -n "Testing: $description... "

    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            --connect-timeout $TIMEOUT)
    else
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" \
            --connect-timeout $TIMEOUT)
    fi

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, Got $http_code)"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test health check
echo "═══════════════════════════════════════════════════════════"
echo "1. Health Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo -n "Testing: Health endpoint... "
response=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" --connect-timeout $TIMEOUT)
http_code=$(echo "$response" | tail -n 1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} - Server not responding"
    echo "Make sure the server is running: npm run dev"
    exit 1
fi
echo ""

# Test Email API
echo "═══════════════════════════════════════════════════════════"
echo "2. Email Job Submission"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "POST" "/jobs/email/jobs" \
    '{"recipients":["test1@example.com"],"subject":"Test","message":"Test message"}' \
    "202" \
    "Submit single email job"

test_endpoint "POST" "/jobs/email/jobs" \
    '{"recipients":["user1@example.com","user2@example.com"],"subject":"Bulk Test","message":"Bulk message"}' \
    "202" \
    "Submit bulk email jobs (2 recipients)"

test_endpoint "POST" "/jobs/email/jobs" \
    '{"recipients":[],"subject":"Test","message":"Test"}' \
    "400" \
    "Reject empty recipients array"

test_endpoint "POST" "/jobs/email/jobs" \
    '{"recipients":["invalid-email"],"subject":"Test","message":"Test"}' \
    "400" \
    "Reject invalid email address"

echo ""

# Test Queue Stats
echo "═══════════════════════════════════════════════════════════"
echo "3. Queue Statistics"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "GET" "/jobs/email/stats" \
    "" \
    "200" \
    "Get email queue statistics"

test_endpoint "GET" "/jobs/email/stats" \
    "" \
    "200" \
    "Get queue stats (should have jobs)"

echo ""

# Test Dashboard
echo "═══════════════════════════════════════════════════════════"
echo "4. Dashboard Endpoints"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "GET" "/dashboard/overview" \
    "" \
    "200" \
    "Get dashboard overview"

test_endpoint "GET" "/dashboard/queues" \
    "" \
    "200" \
    "Get queue metrics"

test_endpoint "GET" "/dashboard/history?limit=10" \
    "" \
    "200" \
    "Get job history (limit=10)"

test_endpoint "GET" "/dashboard/metrics" \
    "" \
    "200" \
    "Get performance metrics"

test_endpoint "GET" "/dashboard/dlq?limit=5" \
    "" \
    "200" \
    "Get Dead Letter Queue jobs"

test_endpoint "GET" "/dashboard/redis" \
    "" \
    "200" \
    "Get Redis status"

echo ""

# Test Queue Health
echo "═══════════════════════════════════════════════════════════"
echo "5. System Health"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "GET" "/queue/health" \
    "" \
    "200" \
    "Get queue health status"

test_endpoint "GET" "/queue/stats" \
    "" \
    "200" \
    "Get overall queue stats"

echo ""

# Get a job ID for testing
echo "═══════════════════════════════════════════════════════════"
echo "6. Job Retrieval"
echo "═══════════════════════════════════════════════════════════"
echo ""

# First, submit a job to get a valid ID
echo -n "Submitting test job to get job ID... "
response=$(curl -s -X POST "$API_URL/jobs/email/jobs" \
    -H "Content-Type: application/json" \
    -d '{"recipients":["jobtest@example.com"],"subject":"Job Test","message":"Job test message"}')

job_id=$(echo "$response" | grep -o '"jobIds":\["[^"]*"' | grep -o '[a-z0-9-]*$' | head -1)

if [ -z "$job_id" ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} - Could not extract job ID, skipping job retrieval test"
else
    echo -e "${GREEN}✓${NC} Got job ID: $job_id"
    
    # Test getting job status
    test_endpoint "GET" "/jobs/email/jobs/$job_id" \
        "" \
        "200" \
        "Get job status by ID"
fi

echo ""

# Error Handling Tests
echo "═══════════════════════════════════════════════════════════"
echo "7. Error Handling"
echo "═══════════════════════════════════════════════════════════"
echo ""

test_endpoint "GET" "/jobs/email/jobs/invalid-job-id" \
    "" \
    "404" \
    "Handle non-existent job ID"

test_endpoint "POST" "/jobs/email/jobs" \
    '{"recipients":"not-an-array","subject":"Test","message":"Test"}' \
    "400" \
    "Handle invalid recipients format"

test_endpoint "POST" "/jobs/email/jobs" \
    '{"recipients":["test@example.com"],"subject":""}' \
    "400" \
    "Handle empty subject"

echo ""

# Test Results Summary
echo "═══════════════════════════════════════════════════════════"
echo "Test Results Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""

total=$((TESTS_PASSED + TESTS_FAILED))
pass_rate=$((TESTS_PASSED * 100 / total))

echo "Total Tests: $total"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Pass Rate: $pass_rate%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Visit http://localhost:3000 to view the dashboard"
    echo "2. Test the UI features manually"
    echo "3. Submit jobs through the web interface"
    echo "4. Monitor job processing in real-time"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure Redis is running: docker run -d -p 6379:6379 redis:alpine"
    echo "2. Ensure server is running: npm run dev"
    echo "3. Check server logs for errors"
    echo "4. Verify API endpoints are accessible"
    exit 1
fi
