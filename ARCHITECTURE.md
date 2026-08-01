# Async Core Architecture Guide

## System Design

```
┌─────────────────────────────────────────────────────┐
│                 Client Requests                      │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│         Express Server (Port 3000)                   │
│  ┌────────────────────────────────────────────────┐ │
│  │ Middleware Pipeline                            │ │
│  │ • CORS & Compression                           │ │
│  │ • Request Logging (Morgan)                     │ │
│  │ • JSON Parsing                                 │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ Routes (/api/queue/*)                          │ │
│  │ ↓                                              │ │
│  │ Controllers (Handle HTTP)                      │ │
│  │ ↓                                              │ │
│  │ Services (Business Logic)                      │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────┘
                   │
           ┌───────┴────────┐
           │                │
┌──────────▼──────┐  ┌──────▼──────────┐
│  BullMQ Queue  │  │ Redis Storage   │
│                │  │                 │
│ • email-queue  │  │ • Job Data      │
│ • notif-queue  │  │ • Job State     │
│ • report-queue │  │ • Metadata      │
└──────────┬──────┘  └─────────────────┘
           │
┌──────────▼──────────────────────────────┐
│  Worker Process (Separate Node Instance)│
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ BullMQ Worker Listener             │ │
│  │ • Poll queues                      │ │
│  │ • Execute processors               │ │
│  │ • Manage job lifecycle             │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Job Processors                     │ │
│  │ • Email Processor (email-queue)    │ │
│  │ • Notification Processor           │ │
│  │ • Report Generator                 │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Data Flow

### Job Submission Flow

```
1. Client POST /api/queue/jobs
   ↓
2. Controller validates input
   ↓
3. Service calls submitJob()
   ↓
4. BullMQ adds job to Redis queue
   ↓
5. Return job ID to client
   ↓
6. Worker picks up job from queue
   ↓
7. Processor executes job logic
   ↓
8. Job completed/failed status updated in Redis
```

### Job Status Check Flow

```
1. Client GET /api/queue/jobs/:jobId
   ↓
2. Controller validates jobId
   ↓
3. Service calls getJobStatus()
   ↓
4. BullMQ retrieves job from Redis
   ↓
5. Return job state, progress, attempts to client
```

## Configuration Hierarchy

```
Startup Sequence:

1. Load .env file (dotenv)
   ↓
2. Validate required env vars (src/config/env.js)
   ↓
3. Create Redis connection (src/config/redis.js)
   ↓
4. Initialize BullMQ queues (src/config/bullmq.js)
   ↓
5. Start Express server (src/server.js)
   ↓
6. Listen for HTTP requests

Worker Sequence (separate process):

1. Load .env file (dotenv)
   ↓
2. Validate required env vars (src/config/env.js)
   ↓
3. Create Redis connection (src/config/redis.js)
   ↓
4. Create workers for each queue (src/config/bullmq.js)
   ↓
5. Start listening for jobs
```

## Module Responsibilities

### `src/config/env.js`
- Loads environment variables with `dotenv`
- Validates all required variables at startup
- Exports typed configuration object
- Prevents undefined variable errors

### `src/config/redis.js`
- Creates Redis singleton connection
- Implements retry strategy
- Handles connection errors gracefully
- Provides cleanup on shutdown

### `src/config/bullmq.js`
- Creates and manages BullMQ queues
- Configures queue settings (retry, backoff)
- Creates worker instances with processors
- Handles worker errors and state transitions

### `src/services/queueService.js`
- High-level queue operations
- Job submission with options
- Job status checking
- Error handling and logging

### `src/controllers/queueController.js`
- Handles HTTP requests
- Input validation
- Calls service layer
- Formats responses

### `src/routes/queue.js`
- Defines HTTP routes
- Maps routes to controllers
- Groups related endpoints

### `src/workers/index.js`
- Entry point for worker process
- Registers job processors
- Handles graceful shutdown
- Manages worker lifecycle

### `src/middleware/logging.js`
- HTTP request logging with Morgan
- Configurable based on environment

### `src/middleware/errorHandler.js`
- Global error catching
- Consistent error responses
- Logs errors with context

### `src/utils/logger.js`
- Structured logging
- Multiple log levels
- Timestamp formatting

### `src/utils/validators.js`
- Input validation functions
- Reusable across layers
- Type checking utilities

### `src/utils/helpers.js`
- ID generation (uuid)
- Async utilities (wait, retry)
- Type conversions

## Key Design Patterns

### 1. Singleton Pattern
Redis and queues use singleton pattern to ensure single instances throughout application.

```javascript
// First call creates connection
const redis = getRedisConnection();

// Subsequent calls return same instance
const redis2 = getRedisConnection();
// redis === redis2 ✓
```

### 2. Registry Pattern
Queues are registered globally for easy access.

```javascript
// Register queue
createQueue('email-queue');

// Access anywhere
const queue = getQueue('email-queue');
```

### 3. Middleware Pipeline
Express middleware handles cross-cutting concerns.

```
Request → CORS → Compression → Logging → Parsing → Routes → ErrorHandler
```

### 4. Service Layer
Controllers delegate to services for testability.

```
HTTP Request → Controller → Service → BullMQ → Redis
```

### 5. Worker Pattern
Jobs execute in separate process for scalability.

```
Main Process: Accept jobs
Worker Process: Execute jobs
Shared: Redis queue storage
```

## Error Handling Strategy

### Configuration Errors
```
Caught at startup → Fast fail → Clear error message
```

### Connection Errors
```
Redis down → Retry with backoff → Log warning → Keep trying
```

### Request Errors
```
Invalid input → Validation error → 400 response
Missing resource → Not found error → 404 response
Unexpected error → Global handler → 500 response + log
```

### Job Errors
```
Job fails → Logged in BullMQ → Retry with backoff → Max attempts reached → Move to failed set
```

## Scaling Considerations

### Horizontal Scaling

**Multiple Server Instances:**
```
Load Balancer
    ↓
  ┌─┴─┐
  │   │
  ▼   ▼
Server1 Server2 (Both connect to shared Redis)
```

**Multiple Workers:**
```
Worker1 ─┐
Worker2 ─┼─ Shared Redis Queue ─ Shared queue storage
Worker3 ─┘
```

### Queue Prioritization

Jobs can be added with priority:
```javascript
submitJob(queueName, jobData, {
  priority: 1 // Higher number = higher priority
});
```

### Concurrency Control

Workers respect concurrency limit:
```javascript
QUEUE_CONCURRENCY=10  // Process 10 jobs simultaneously
```

### Job Timeouts

Jobs have maximum lock duration:
```javascript
lockDuration: 30000  // Job lock valid for 30 seconds
lockRenewTime: 15000  // Renew lock every 15 seconds
```

## Monitoring Points

1. **Server Health**: GET /health
2. **Queue Health**: GET /api/queue/health
3. **Queue Stats**: GET /api/queue/stats
4. **Logs**: stdout with structured logging
5. **Redis CLI**: `redis-cli` for queue inspection

## Production Checklist

- [ ] Environment variables configured
- [ ] Redis persistence enabled (RDB or AOF)
- [ ] Worker process monitoring (PM2/systemd)
- [ ] Log aggregation configured
- [ ] Metrics/monitoring dashboard
- [ ] Error alerting setup
- [ ] Database backups configured
- [ ] Rate limiting on API
- [ ] Request tracing implemented
- [ ] Circuit breaker pattern for failures

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|-----------|
| **Logging** | `dev` format (colorized) | `combined` format (parseable) |
| **Error Details** | Full stack traces | Message only |
| **Auto-reload** | `--watch` enabled | Static compilation |
| **Node Restart** | Manual on code change | PM2/systemd supervised |
| **Redis** | Local development | Managed service (AWS ElastiCache, etc) |

## Next Steps for Development

1. **Email Queue**: Implement email job processor and Nodemailer integration
2. **Dashboard**: Add web UI for queue monitoring
3. **Retry Logic**: Implement advanced retry strategies
4. **Metrics**: Add Prometheus metrics
5. **Testing**: Unit and integration tests
6. **Documentation**: API documentation with Swagger/OpenAPI
7. **Deployment**: Docker, Kubernetes ready
8. **Security**: API authentication/authorization
