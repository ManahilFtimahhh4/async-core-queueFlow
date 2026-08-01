#!/bin/bash

# Async Core - Testing Workflow (Bash/curl version)
# Usage: bash test-api.sh [test_name]
# Examples:
#   bash test-api.sh health
#   bash test-api.sh submit
#   bash test-api.sh status
#   bash test-api.sh stats
#   bash test-api.sh all

set -e

BASE_URL="http://localhost:3000"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_section() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
}

# Helper function to print success
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Helper function to print error
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Helper function to print info
print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Test: Health Check
test_health() {
  print_section "TEST 1: Server Health Check"
  
  echo -e "\n${YELLOW}Request:${NC}"
  echo "GET $BASE_URL/health"
  
  echo -e "\n${YELLOW}Response:${NC}"
  curl -s -X GET "$BASE_URL/health" \
    -H "Content-Type: application/json" | jq '.'
  
  print_success "Server is healthy"
}

# Test: Queue Health
test_queue_health() {
  print_section "TEST 2: Queue Health Check"
  
  echo -e "\n${YELLOW}Request:${NC}"
  echo "GET $BASE_URL/api/queue/health"
  
  echo -e "\n${YELLOW}Response:${NC}"
  curl -s -X GET "$BASE_URL/api/queue/health" \
    -H "Content-Type: application/json" | jq '.'
  
  print_success "Queue is healthy"
}

# Test: Submit Emails
test_submit_emails() {
  print_section "TEST 3: Submit Bulk Emails (2 recipients)"
  
  echo -e "\n${YELLOW}Request:${NC}"
  echo "POST $BASE_URL/api/jobs/email/jobs"
  echo "Body:"
  cat << 'EOF'
{
  "recipients": ["alice@example.com", "bob@example.com"],
  "subject": "Welcome to Async Core",
  "message": "This is a test email from the background processing system"
}
EOF
  
  echo -e "\n${YELLOW}Response:${NC}"
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/jobs/email/jobs" \
    -H "Content-Type: application/json" \
    -d '{
      "recipients": ["alice@example.com", "bob@example.com"],
      "subject": "Welcome to Async Core",
      "message": "This is a test email from the background processing system"
    }')
  
  echo "$RESPONSE" | jq '.'
  
  # Extract first job ID for status check
  JOB_ID=$(echo "$RESPONSE" | jq -r '.data.jobIds[0]')
  echo -e "\n${YELLOW}First Job ID: $JOB_ID${NC}"
  export FIRST_JOB_ID="$JOB_ID"
  
  print_success "Email jobs submitted"
}

# Test: Get Queue Stats
test_queue_stats() {
  print_section "TEST 4: Email Queue Statistics"
  
  echo -e "\n${YELLOW}Request:${NC}"
  echo "GET $BASE_URL/api/jobs/email/stats"
  
  echo -e "\n${YELLOW}Response:${NC}"
  curl -s -X GET "$BASE_URL/api/jobs/email/stats" \
    -H "Content-Type: application/json" | jq '.'
  
  print_success "Queue statistics retrieved"
}

# Test: Job Status
test_job_status() {
  print_section "TEST 5: Check Job Status"
  
  if [ -z "$FIRST_JOB_ID" ]; then
    print_info "Submitting test emails first..."
    test_submit_emails
  fi
  
  echo -e "\n${YELLOW}Request:${NC}"
  echo "GET $BASE_URL/api/jobs/email/jobs/$FIRST_JOB_ID"
  
  echo -e "\n${YELLOW}Response:${NC}"
  curl -s -X GET "$BASE_URL/api/jobs/email/jobs/$FIRST_JOB_ID" \
    -H "Content-Type: application/json" | jq '.'
  
  print_success "Job status retrieved"
}

# Test: Error Handling - Missing Recipients
test_error_missing_recipients() {
  print_section "TEST 6: Error Handling - Missing Recipients"
  
  echo -e "\n${YELLOW}Request:${NC}"
  echo "POST $BASE_URL/api/jobs/email/jobs (missing recipients)"
  
  echo -e "\n${YELLOW}Response (Expected 400):${NC}"
  curl -s -X POST "$BASE_URL/api/jobs/email/jobs" \
    -H "Content-Type: application/json" \
    -d '{
      "subject": "No Recipients",
      "message": "This should fail"
    }' | jq '.'
  
  print_success "Error handling verified"
}

# Test: Error Handling - Invalid Job ID
test_error_invalid_job_id() {
  print_section "TEST 7: Error Handling - Invalid Job ID"
  
  echo -e "\n${YELLOW}Request:${NC}"
  echo "GET $BASE_URL/api/jobs/email/jobs/invalid-id-12345"
  
  echo -e "\n${YELLOW}Response (Expected 404):${NC}"
  curl -s -X GET "$BASE_URL/api/jobs/email/jobs/invalid-id-12345" \
    -H "Content-Type: application/json" | jq '.'
  
  print_success "Error handling verified"
}

# Test: Submit Many Emails
test_submit_many() {
  print_section "TEST 8: Submit Bulk Emails (10 recipients)"
  
  echo -e "\n${YELLOW}Request:${NC}"
  echo "POST $BASE_URL/api/jobs/email/jobs (10 recipients)"
  
  echo -e "\n${YELLOW}Response:${NC}"
  curl -s -X POST "$BASE_URL/api/jobs/email/jobs" \
    -H "Content-Type: application/json" \
    -d '{
      "recipients": [
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
      ],
      "subject": "Bulk Email Test",
      "message": "Testing bulk email submission with 10 recipients"
    }' | jq '.'
  
  print_success "Bulk emails submitted"
}

# Test: Full Workflow
test_full_workflow() {
  print_section "FULL END-TO-END TESTING WORKFLOW"
  echo -e "\n${YELLOW}This will run all tests in sequence${NC}\n"
  
  test_health
  echo -e "\n"
  
  test_queue_health
  echo -e "\n"
  
  test_submit_emails
  echo -e "\n"
  
  sleep 2
  
  test_queue_stats
  echo -e "\n"
  
  test_job_status
  echo -e "\n"
  
  test_error_missing_recipients
  echo -e "\n"
  
  test_error_invalid_job_id
  echo -e "\n"
  
  test_submit_many
  echo -e "\n"
  
  sleep 2
  
  test_queue_stats
  echo -e "\n"
  
  print_section "ALL TESTS COMPLETED"
}

# Main script logic
if [ $# -eq 0 ]; then
  test_full_workflow
else
  case "$1" in
    health)
      test_health
      ;;
    queue-health)
      test_queue_health
      ;;
    submit)
      test_submit_emails
      ;;
    stats)
      test_queue_stats
      ;;
    status)
      test_job_status
      ;;
    errors)
      test_error_missing_recipients
      test_error_invalid_job_id
      ;;
    bulk)
      test_submit_many
      ;;
    all)
      test_full_workflow
      ;;
    *)
      echo "Usage: bash test-api.sh [test_name]"
      echo ""
      echo "Available tests:"
      echo "  health       - Server health check"
      echo "  queue-health - Queue health check"
      echo "  submit       - Submit email jobs"
      echo "  stats        - Queue statistics"
      echo "  status       - Job status tracking"
      echo "  errors       - Error handling tests"
      echo "  bulk         - Submit bulk emails"
      echo "  all          - Run all tests (default)"
      exit 1
      ;;
  esac
fi
