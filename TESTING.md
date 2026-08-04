# Testing Guide - Async Core Queue System

## Quick Start Testing

### 1. Start Redis
```bash
docker run -d -p 6379:6379 --name redis-test redis:alpine
```

### 2. Start Server (Terminal 1)
```bash
npm run dev
```

Expected output:
```
[timestamp] INFO   Redis connection established
[timestamp] INFO   Async Core server running on localhost:3000
```

### 3. Start Worker (Terminal 2)
```bash
npm run worker:dev
```

Expected output:
```
[timestamp] INFO   Email worker initialized
[timestamp] INFO   Worker process started
```

### 4. Access Dashboard
Open browser: http://localhost:3000

## Test Scenarios

### Scenario 1: Submit Email Jobs
1. Click "Add Job" in sidebar
2. Enter recipients:
   - test1@example.com
   - test2@example.com
3. Subject: "Test Email"
4. Message: "This is a test email"
5. Click "Submit Jobs"

**Expected Result:**
- Success message appears
- Dashboard stats update
- Jobs appear in "Jobs" page

### Scenario 2: Monitor Job Processing
1. Go to "Dashboard" page
2. Verify stat cards update with real data:
   - Total Jobs
   - Pending
   - Active
   - Completed
   - Failed
3. View "Recent Jobs" table

**Expected Result:**
- Charts display real data
- Tables update automatically every 30 seconds
- Job status shows: waiting → active → completed

### Scenario 3: View Queues
1. Click "Queues" in sidebar
2. Verify queue statistics display

**Expected Result:**
- Queue stats show accurate counts
- Table displays email-queue metrics

### Scenario 4: Check Failed Jobs & DLQ
1. Go to "Failed Jobs" page
2. View "Dead Letter Queue" page

**Expected Result:**
- Empty initially
- Failed jobs appear after retry exhaustion
- DLQ shows permanently failed jobs

### Scenario 5: Search & Filter
1. Use search bar to find jobs
2. Use filters on Jobs page

**Expected Result:**
- Filter functionality works
- Results update dynamically

## API Endpoints Testing

### Create Jobs
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["user@example.com"],
    "subject": "Test",
    "message": "Test message"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Jobs queued successfully",
  "data": {
    "totalJobs": 1,
    "jobIds": ["email-..."],
    "timestamp": "2024-01-15T..."
  }
}
```

### Get Job Status
```bash
curl http://localhost:3000/api/jobs/email/jobs/email-...
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "email-...",
    "recipient": "user@example.com",
    "status": "completed",
    "progress": 100,
    "attempts": 1,
    "maxAttempts": 3
  }
}
```

### Get Queue Stats
```bash
curl http://localhost:3000/api/jobs/email/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "waiting": 0,
    "active": 0,
    "completed": 5,
    "failed": 0,
    "delayed": 0,
    "total": 5
  }
}
```

### Dashboard Overview
```bash
curl http://localhost:3000/api/dashboard/overview
```

### Queue Metrics
```bash
curl http://localhost:3000/api/dashboard/queues
```

### Job History
```bash
curl http://localhost:3000/api/dashboard/history?limit=10
```

### Performance Metrics
```bash
curl http://localhost:3000/api/dashboard/metrics
```

## Verification Checklist

- [ ] Server starts without errors
- [ ] Worker process starts and logs initialization
- [ ] Dashboard loads and displays UI
- [ ] Redis connects successfully
- [ ] Email jobs can be submitted
- [ ] Job stats update in real-time
- [ ] Charts render with data
- [ ] Tables display job information
- [ ] Navigation between pages works
- [ ] Theme toggle works (light/dark)
- [ ] Sidebar toggle works
- [ ] No console errors
- [ ] No "Invalid Date" values appear
- [ ] All API endpoints return proper responses
- [ ] Retry logic works (jobs retry on failure)
- [ ] Failed jobs move to DLQ after max retries
- [ ] Email worker processes jobs correctly
- [ ] Progress tracking shows accurate values

## Troubleshooting

### Redis Connection Failed
- Ensure Redis is running: `docker ps | grep redis`
- Start Redis if needed: `docker run -d -p 6379:6379 redis:alpine`
- Check Redis host/port in .env

### Port 3000 Already in Use
- Kill existing process: `lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9`
- Or change PORT in .env

### Worker Not Processing Jobs
- Check worker logs
- Verify Redis connection
- Ensure worker process is running in separate terminal

### Dashboard Not Updating
- Check browser console for errors
- Verify API endpoints are responding
- Check server logs

## Load Testing

### Submit 100 Jobs
```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/jobs/email/jobs \
    -H "Content-Type: application/json" \
    -d "{\"recipients\": [\"user${i}@example.com\"], \"subject\": \"Test ${i}\", \"message\": \"Message ${i}\"}"
done
```

**Expected Behavior:**
- All jobs queue successfully
- Worker processes them with configured concurrency
- Dashboard updates with metrics
- System remains responsive

## Performance Metrics

Expected performance on modern hardware:
- Job submission: < 100ms
- Job processing: 300-1000ms (depending on simulation)
- Dashboard update: < 500ms
- API response: < 100ms

## Production Checklist

Before deploying to production:
- [ ] Configure real SMTP for email sending
- [ ] Set NODE_ENV=production
- [ ] Configure Redis with persistence
- [ ] Add authentication to API
- [ ] Enable HTTPS
- [ ] Setup monitoring/alerting
- [ ] Configure log aggregation
- [ ] Setup backup strategy
- [ ] Test failure scenarios
- [ ] Configure worker process management (PM2)
