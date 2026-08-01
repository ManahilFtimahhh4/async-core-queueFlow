# Async Core – Background Processing System

A production-grade, scalable background job processing system built with Node.js, Express, BullMQ, and Redis.

## Overview

**Async Core** demonstrates a complete background processing system with:

- ✅ Email queue processing with job-per-recipient model
- ✅ Exponential backoff retry logic (up to 3 attempts)
- ✅ Dead Letter Queue for failed jobs
- ✅ Centralized queue management with BullMQ
- ✅ Redis-backed job storage and state management
- ✅ Scalable worker architecture (separate process)
- ✅ Clean separation of concerns
- ✅ Production-ready error handling and logging
- ✅ Comprehensive request/response handling
- ✅ Health check and monitoring endpoints

## Core Features

### Email Queue System

Submit bulk emails where each recipient creates one independent job:

```bash
POST /api/jobs/email/jobs
{
  "recipients": ["user1@email.com", "user2@email.com"],
  "subject": "Hello",
  "message": "Welcome to Async Core"
}
```

Response:
```json
{
  "success": true,
  "message": "Jobs queued successfully",
  "data": {
    "totalJobs": 2,
    "jobIds": ["email-1234567890-abc123", "email-1234567890-def456"]
  }
}
```

### Job Status Tracking

```bash
GET /api/jobs/email/jobs/:jobId
```

Returns job status, progress, attempt count, and failure reasons.

### Queue Statistics

```bash
GET /api/jobs/email/stats
```

Returns counts of waiting, active, completed, failed, and delayed jobs.

## API Endpoints

### Email Jobs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/jobs/email/jobs` | Submit bulk emails (one job per recipient) |
| GET | `/api/jobs/email/jobs/:jobId` | Get job status |
| GET | `/api/jobs/email/stats` | Get queue statistics |

### System Health

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Server health check |
| GET | `/api/queue/health` | Queue health check |
| GET | `/api/queue/stats` | Queue statistics |

## Project Structure

```
src/
├── config/
│   ├── env.js              # Environment validation
│   ├── redis.js            # Redis connection singleton
│   └── bullmq.js           # Queue & worker configuration
├── controllers/
│   ├── emailController.js  # Email job endpoints
│   └── queueController.js  # Queue health endpoints
├── routes/
│   ├── index.js            # Route aggregator
│   ├── email.js            # Email job routes
│   └── queue.js            # Queue routes
├── services/
│   ├── emailService.js     # Email job orchestration
│   └── queueService.js     # Generic queue operations
├── queues/
│   └── index.js            # Queue registry (email-queue, email-dlq)
├── workers/
│   ├── emailWorker.js      # Email processor with retry & DLQ logic
│   └── index.js            # Worker initialization
├── middleware/
│   ├── logging.js          # HTTP request logging
│   └── errorHandler.js     # Global error handling
├── utils/
│   ├── logger.js           # Structured logging
│   ├── validators.js       # Input validation
│   └── helpers.js          # Helper utilities
└── server.js               # Express app entry point
```

## How It Works

### Request Flow

```
POST /api/jobs/email/jobs
    ↓
emailController.submitEmails()
    ↓
emailService.submitEmailJobs()
    ↓
BullMQ: Create one job per recipient
    ↓
Redis: Store jobs in email-queue
    ↓
Response: Job IDs returned to client
    ↓
Worker polls queue and processes jobs
```

### Job Processing with Retry Logic

```
Job starts (attempt 1)
    ↓
Simulate email sending
    ↓
Success? → Store result, mark complete
    ↓
Failure? → Retry with exponential backoff
    ↓
Attempt 2 (delay: 2000ms)
    ↓
Failure? → Retry again
    ↓
Attempt 3 (delay: 4000ms)
    ↓
Failure? → Move to Dead Letter Queue
```

### Retry Strategy

- **Max Attempts:** 3
- **Strategy:** Exponential backoff
- **Initial Delay:** 2000ms (2 seconds)
- **Backoff Multiplier:** 2x per attempt
  - Attempt 1: Immediate
  - Attempt 2: 2000ms delay
  - Attempt 3: 4000ms delay
  - Failure: Move to DLQ

### Dead Letter Queue (DLQ)

Failed jobs after max retries are moved to a separate queue (`email-dlq`) with:
- Original job ID
- Original data (recipient, subject, message)
- Failure reason
- Attempt count
- Timestamp

This allows monitoring and manual recovery of failed emails.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Redis (local or Docker)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start Redis (Docker)
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Run the System

Terminal 1 - Start API Server:
```bash
npm run dev
```

Terminal 2 - Start Worker Process:
```bash
npm run worker:dev
```

Terminal 3 - Test (optional):
```bash
curl http://localhost:3000/health
```

## Testing the Email Queue

### Submit Emails

```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["user1@example.com", "user2@example.com", "user3@example.com"],
    "subject": "Welcome",
    "message": "Thanks for joining Async Core!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Jobs queued successfully",
  "data": {
    "totalJobs": 3,
    "jobIds": [
      "email-1234567890-abc123",
      "email-1234567890-def456",
      "email-1234567890-ghi789"
    ]
  }
}
```

### Check Job Status

```bash
curl http://localhost:3000/api/jobs/email/jobs/email-1234567890-abc123
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "email-1234567890-abc123",
    "recipient": "user1@example.com",
    "subject": "Welcome",
    "status": "completed",
    "progress": 100,
    "attempts": 1,
    "maxAttempts": 3
  }
}
```

### View Queue Stats

```bash
curl http://localhost:3000/api/jobs/email/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "waiting": 0,
    "active": 0,
    "completed": 3,
    "failed": 0,
    "delayed": 0
  }
}
```

## Logging

The system logs all key events:

```
[2024-01-15T10:30:00.000Z] INFO   Redis connected successfully
[2024-01-15T10:30:00.500Z] INFO   Dead Letter Queue initialized: email-dlq
[2024-01-15T10:30:00.750Z] INFO   Email worker initialized for queue: email-queue
[2024-01-15T10:30:05.000Z] INFO   Email jobs submitted: totalJobs: 3, recipients: 3
[2024-01-15T10:30:05.500Z] INFO   Job started [email-123]: recipient, attempt 1/3
[2024-01-15T10:30:06.000Z] INFO   Job completed [email-123]: recipient successfully sent
[2024-01-15T10:30:06.500Z] WARN   Job failed [email-456]: attempt 1/3
[2024-01-15T10:30:08.500Z] INFO   Job started [email-456]: attempt 2/3
[2024-01-15T10:30:09.000Z] INFO   Job completed [email-456]: successfully sent
[2024-01-15T10:30:10.000Z] ERROR  Job max retries exceeded [email-789], moving to DLQ
[2024-01-15T10:30:10.500Z] WARN   Job moved to Dead Letter Queue: originalJobId, dlqJobId
```

## Architecture Patterns

### Separation of Concerns

- **Controllers:** HTTP request/response handling only
- **Services:** Business logic and queue orchestration
- **Workers:** Async job processing with retry logic
- **Configuration:** Centralized setup and validation

### Queue-Per-Recipient Model

Each recipient in a bulk email request creates one independent job:
- Parallel processing of recipients
- Individual retry logic per recipient
- Easy job tracking and recovery
- Scalable to thousands of recipients

### Retry Strategy with Exponential Backoff

Exponential backoff ensures:
- Failed jobs don't overwhelm the system
- Natural load balancing
- Better reliability for transient failures
- Configurable attempt count and delays

### Dead Letter Queue (DLQ)

Separates failed job concerns:
- Main queue: Actively processing jobs
- DLQ: Failed jobs for investigation
- Easy to identify patterns in failures
- Allows manual recovery and re-processing

## Error Handling

- **Validation errors (400):** Missing or invalid required fields
- **Not found errors (404):** Job ID doesn't exist
- **Internal errors (500):** Server errors (logged with context)
- **Worker failures:** Logged with attempt count and retry status
- **DLQ moves:** Logged when max retries exceeded

## Development Scripts

```bash
npm run dev              # Server with auto-reload
npm run worker:dev       # Worker with auto-reload
npm start                # Production server
npm run worker           # Production worker
npm run lint             # Run ESLint
npm test                 # Run tests
```

## Production Considerations

- [ ] Configure real SMTP for email sending in emailWorker.js
- [ ] Add authentication to API endpoints
- [ ] Enable Redis persistence (RDB or AOF)
- [ ] Setup worker process monitoring (PM2)
- [ ] Configure log aggregation
- [ ] Add metrics and alerting
- [ ] Implement graceful shutdown handlers
- [ ] Add request rate limiting
- [ ] Setup error tracking (Sentry)
- [ ] Configure backup strategy

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Server** | Node.js 18+, Express.js | HTTP API |
| **Queue** | BullMQ | Job queue management |
| **Storage** | Redis | Job state & data |
| **Email** | Nodemailer | Email sending (configurable) |
| **Utilities** | dotenv, cors, morgan, uuid, ioredis | Config, logging, utilities |

## License

MIT
