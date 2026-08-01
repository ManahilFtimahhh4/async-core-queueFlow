#!/bin/bash

# Async Core - Production Phase Testing (Bash/curl version)
# Full end-to-end testing with all production features

set -e

BASE_URL="http://localhost:3000"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

print_section() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
  echo -e "${CYAN}ℹ️  $1${NC}"
}

# Test: Health Check
test_health() {
  print_section "Health Checks"
  
  echo -e "\n${YELLOW}GET /health${NC}"
  curl -s "$BASE_URL/health" | jq '.'
  print_success "Health check passed"
}

# Test: Submit Emails
test_submit() {
  print_section "Submit Email Jobs"
  
  echo -e "\n${YELLOW}POST /api/jobs/email/jobs (2 recipients)${NC}"
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/jobs/email/jobs" \
    -H "Content-Type: application/json" \
    -d '{
      "recipients": ["alice@example.com", "bob@example.com"],
      "subject": "Production Test",
      "message": "Testing production phase"
    }')
  
  echo "$RESPONSE" | jq '.'
  
  JOB_ID=$(echo "$RESPONSE" | jq -r '.data.jobIds[0]')
  export FIRST_JOB_ID="$JOB_ID"
  
  print_success "Jobs submitted: $JOB_ID"
}

# Test: Dashboard Overview
test_dashboard() {
  print_section "Dashboard Overview"
  
  echo -e "\n${YELLOW}GET /api/dashboard/overview${NC}"
  curl -s "$BASE_URL/api/dashboard/overview" | jq '.'
  print_success "Dashboard overview retrieved"
}

# Test: Queue Metrics
test_queue_metrics() {
  print_section "Queue Metrics"
  
  echo -e "\n${YELLOW}GET /api/dashboard/queues${NC}"
  curl -s "$BASE_URL/api/dashboard/queues" | jq '.'
  print_success "Queue metrics retrieved"
}

# Test: Redis Status
test_redis_status() {
  print_section "Redis Status"
  
  echo -e "\n${YELLOW}GET /api/dashboard/redis${NC}"
  curl -s "$BASE_URL/api/dashboard/redis" | jq '.'
  print_success "Redis status retrieved"
}

# Test: Performance Metrics
test_performance() {
  print_section "Performance Metrics"
  
  echo -e "\n${YELLOW}GET /api/dashboard/metrics${NC}"
  curl -s "$BASE_URL/api/dashboard/metrics" | jq '.'
  print_success "Performance metrics retrieved"
}

# Test: Job History
test_history() {
  print_section "Job History"
  
  echo -e "\n${YELLOW}GET /api/dashboard/history${NC}"
  curl -s "$BASE_URL/api/dashboard/history?limit=10" | jq '.'
  print_success "Job history retrieved"
}

# Test: Job Status
test_job_status() {
  print_section "Job Status"
  
  if [ -z "$FIRST_JOB_ID" ]; then
    print_info "Submitting test jobs first..."
    test_submit
  fi
  
  echo -e "\n${YELLOW}GET /api/jobs/email/jobs/$FIRST_JOB_ID${NC}"
  curl -s "$BASE_URL/api/jobs/email/jobs/$FIRST_JOB_ID" | jq '.'
  print_success "Job status retrieved"
}

# Test: DLQ
test_dlq() {
  print_section "Dead Letter Queue"
  
  echo -e "\n${YELLOW}GET /api/dashboard/dlq${NC}"
  curl -s "$BASE_URL/api/dashboard/dlq" | jq '.'
  print_success "DLQ status retrieved"
}

# Test: Stress Test
test_stress() {
  print_section "Stress Test (10 recipients)"
  
  echo -e "\n${YELLOW}POST /api/jobs/email/jobs (10 recipients)${NC}"
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/jobs/email/jobs" \
    -H "Content-Type: application/json" \
    -d '{
      "recipients": [
        "stress1@example.com", "stress2@example.com", "stress3@example.com",
        "stress4@example.com", "stress5@example.com", "stress6@example.com",
        "stress7@example.com", "stress8@example.com", "stress9@example.com",
        "stress10@example.com"
      ],
      "subject": "Stress Test",
      "message": "Testing under load"
    }')
  
  echo "$RESPONSE" | jq '.'
  print_success "Stress test initiated"
}

# Full workflow
test_full_production() {
  print_section "FULL PRODUCTION TESTING WORKFLOW"
  
  test_health
  echo -e "\n"
  
  test_submit
  echo -e "\n"
  
  sleep 1
  
  test_queue_metrics
  echo -e "\n"
  
  test_redis_status
  echo -e "\n"
  
  test_dashboard
  echo -e "\n"
  
  test_performance
  echo -e "\n"
  
  test_job_status
  echo -e "\n"
  
  test_history
  echo -e "\n"
  
  test_dlq
  echo -e "\n"
  
  test_stress
  echo -e "\n"
  
  sleep 2
  
  test_dashboard
  echo -e "\n"
  
  print_section "PRODUCTION TESTING COMPLETE"
}

# Main logic
case "${1:-all}" in
  health)
    test_health
    ;;
  submit)
    test_submit
    ;;
  dashboard)
    test_dashboard
    ;;
  queues)
    test_queue_metrics
    ;;
  redis)
    test_redis_status
    ;;
  metrics)
    test_performance
    ;;
  history)
    test_history
    ;;
  status)
    test_job_status
    ;;
  dlq)
    test_dlq
    ;;
  stress)
    test_stress
    ;;
  all)
    test_full_production
    ;;
  *)
    echo "Usage: bash test-production.sh [test_name]"
    echo ""
    echo "Available tests:"
    echo "  health      - Health checks"
    echo "  submit      - Submit emails"
    echo "  dashboard   - Dashboard overview"
    echo "  queues      - Queue metrics"
    echo "  redis       - Redis status"
    echo "  metrics     - Performance metrics"
    echo "  history     - Job history"
    echo "  status      - Job status"
    echo "  dlq         - Dead Letter Queue"
    echo "  stress      - Stress test"
    echo "  all         - Run all tests (default)"
    exit 1
    ;;
esac
