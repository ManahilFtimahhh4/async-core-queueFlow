# Testing Workflow - Async Core

This document provides complete end-to-end testing instructions for the background processing system.

## Prerequisites

Before testing, ensure:
1. Redis is running: `redis-cli ping` → should return `PONG`
2. Server is running: `npm run dev` (Terminal 1)
3. Worker is running: `npm run worker:dev` (Terminal 2)

## Testing Options

### Option 1: REST Client (VS Code Extension)

**Install REST Client extension** in VS Code (search for "REST Client")

**Usage:**
1. Open `test.http` file in VS Code
2. Click "Send Request" above any request
3. Response will appear in the side panel

**Available Requests:**
- **Health Checks**: Server and queue health endpoints
- **Submit Emails**: Single, bulk (2), and many (10) recipients
- **Job Status**: Check individual job status
- **Queue Stats**: View queue statistics
- **Error Tests**: Validation and error handling tests

### Option 2: PowerShell Script (Windows)

**Usage:**
```powershell
# Run all tests
.\test-api.ps1 -Test all

# Run specific test
.\test-api.ps1 -Test health
.\test-api.ps1 -Test submit
.\test-api.ps1 -Test stats
.\test-api.ps1 -Test status
.\test-api.ps1 -Test bulk
.\test-api.ps1 -Test errors
```

**Example Output:**
```
✅ Server is healthy
✅ Email jobs submitted
✅ Job status retrieved
✅ Queue statistics retrieved
```

### Option 3: Bash Script (macOS/Linux)

**Usage:**
```bash
# Make script executable
chmod +x test-api.sh

# Run all tests
bash test-api.sh all

# Run specific test
bash test-api.sh health
bash test-api.sh submit
bash test-api.sh stats
bash test-api.sh status
bash test-api.sh bulk
bash test-api.sh errors
```

### Option 4: curl Commands (Any OS)

**Server Health Check:**
```bash
curl http://localhost:3000/health
```

**Queue Health Check:**
```bash
curl http://localhost:3000/api/queue/health
```

**Submit Emails (2 recipients):**
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["alice@example.com", "bob@example.com"],
    "subject": "Welcome",
    "message": "This is a test email"
  }'
```

**Check Job Status:**
```bash
# Replace JOB_ID with actual ID from submission response
curl http://localhost:3000/api/jobs/email/jobs/JOB_ID
```

**Queue Statistics:**
```bash
curl http://localhost:3000/api/jobs/email/stats
```

**Submit 10 Emails:**
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
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
    "message": "Testing bulk email processing"
  }'
```

## Testing Workflow

### Step 1: Verify Server Health
```bash
curl http://localhost:3000/health
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "Async Core",
    "timestamp": "2026-08-01T10:51:41.915Z"
  }
}
```

### Step 2: Verify Queue Health
```bash
curl http://localhost:3000/api/queue/health
```

### Step 3: Submit Email Jobs

Submit an email to 2 recipients (creates 2 independent jobs):
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["alice@example.com", "bob@example.com"],
    "subject": "Welcome to Async Core",
    "message": "Your background job is being processed"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Jobs queued successfully",
  "data": {
    "totalJobs": 2,
    "jobIds": ["emailXXXXXXXXXXX1abc", "emailXXXXXXXXXXX2def"]
  }
}
```

### Step 4: Monitor Queue Statistics

Check how many jobs are waiting, active, completed, failed:
```bash
curl http://localhost:3000/api/jobs/email/stats
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "waiting": 1,
    "active": 1,
    "completed": 0,
    "failed": 0,
    "delayed": 0
  }
}
```

### Step 5: Track Individual Job Status

Use a job ID from Step 3:
```bash
curl http://localhost:3000/api/jobs/email/jobs/emailXXXXXXXXXXX1abc
```

Possible Responses:

**Active/Processing:**
```json
{
  "success": true,
  "data": {
    "id": "emailXXXXXXXXXXX1abc",
    "recipient": "alice@example.com",
    "subject": "Welcome to Async Core",
    "status": "active",
    "progress": 50,
    "attempts": 1,
    "maxAttempts": 3
  }
}
```

**Completed:**
```json
{
  "success": true,
  "data": {
    "id": "emailXXXXXXXXXXX1abc",
    "recipient": "alice@example.com",
    "subject": "Welcome to Async Core",
    "status": "completed",
    "progress": 100,
    "attempts": 1,
    "maxAttempts": 3
  }
}
```

**Retrying (Failed then Delayed):**
```json
{
  "success": true,
  "data": {
    "id": "emailXXXXXXXXXXX1abc",
    "recipient": "alice@example.com",
    "subject": "Welcome to Async Core",
    "status": "delayed",
    "progress": 0,
    "attempts": 1,
    "maxAttempts": 3,
    "failedReason": "Failed to send email to alice@example.com"
  }
}
```

## Expected Job Lifecycle

Each job follows this flow:

```
Submitted
  ↓
Queued (waiting in email-queue)
  ↓
Processing (worker picks up job)
  ↓
Success → Completed ✅
  OR
Failure → Retry with exponential backoff
  ↓
Attempt 2 (after 2 seconds)
  ↓
Success → Completed ✅
  OR
Failure → Retry again
  ↓
Attempt 3 (after 4 seconds)
  ↓
Success → Completed ✅
  OR
Failure → Moved to Dead Letter Queue 💀
```

## Error Testing

### Test 1: Missing Recipients
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "No Recipients",
    "message": "This should fail"
  }'
```

Expected: **400 Bad Request**

### Test 2: Empty Recipients Array
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [],
    "subject": "Empty Recipients",
    "message": "This should fail"
  }'
```

Expected: **400 Bad Request**

### Test 3: Missing Subject
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["test@example.com"],
    "message": "No subject"
  }'
```

Expected: **400 Bad Request**

### Test 4: Missing Message
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["test@example.com"],
    "subject": "No Message"
  }'
```

Expected: **400 Bad Request**

### Test 5: Invalid Job ID
```bash
curl http://localhost:3000/api/jobs/email/jobs/invalid-job-id-12345
```

Expected: **404 Not Found**

## API Endpoints Reference

### Health & Status

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Server health check |
| GET | `/api/queue/health` | Queue health check |
| GET | `/api/queue/stats` | Generic queue stats |

### Email Queue Operations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/jobs/email/jobs` | Submit email jobs (one per recipient) |
| GET | `/api/jobs/email/jobs/:jobId` | Get individual job status |
| GET | `/api/jobs/email/stats` | Email queue statistics |

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  }
}
```

## Common Issues

### Issue: "Connection refused"
**Solution:** Ensure Redis is running and server/worker are started
```bash
# Check Redis
redis-cli ping

# Start server (Terminal 1)
npm run dev

# Start worker (Terminal 2)
npm run worker:dev
```

### Issue: "Job not found"
**Solution:** Job ID is incorrect or job has been removed (removeOnComplete is set to true)
- Use correct job ID from the submission response
- Check queue stats to see active jobs

### Issue: "Max retries exceeded, moving to DLQ"
**Solution:** This is expected behavior. Job failed 3 times and is now in Dead Letter Queue
- Check logs in worker terminal
- Job data is preserved in DLQ for investigation

### Issue: Job stuck in "delayed" status
**Solution:** Job is waiting for retry. Wait for the delay period:
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay

## Next Steps

After testing is complete, you can:

1. **Monitor in Real-Time**: Watch logs in server and worker terminals
2. **Analyze Patterns**: Use queue stats to understand job flow
3. **Dead Letter Queue**: Query DLQ for failed jobs (in production, implement manual recovery)
4. **Scale Up**: Submit 100+ emails and monitor system performance
5. **Implement Real SMTP**: Replace email simulation with actual Nodemailer integration

## Performance Notes

- Current implementation simulates email delivery with ~10% failure rate
- Each job processes in ~500ms (simulated)
- Concurrent processing: 5 jobs at a time (configurable via QUEUE_CONCURRENCY)
- Retry strategy ensures reliability even with transient failures
