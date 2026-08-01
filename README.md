# Async Core – Background Processing System

A production-grade, scalable background job processing system built with Node.js, Express, BullMQ, and Redis.

## Overview

**Async Core** is a portfolio-quality backend project that demonstrates modern asynchronous architecture patterns including:

- ✅ Centralized queue management with BullMQ
- ✅ Redis-backed job storage and state management
- ✅ Scalable worker architecture (separate process)
- ✅ Clean separation of concerns (controllers, services, workers)
- ✅ Production-ready error handling and logging
- ✅ Environment validation and configuration management
- ✅ Graceful shutdown and resource cleanup
- ✅ Health check endpoints

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Server** | Node.js 18+, Express.js |
| **Queue** | BullMQ |
| **Storage** | Redis |
| **Email** | Nodemailer |
| **Utilities** | dotenv, cors, morgan, uuid, ioredis |

## Project Structure

```
src/
├── config/              # Configuration management
│   ├── env.js          # Environment variables & validation
│   ├── redis.js        # Redis connection singleton
│   └── bullmq.js       # BullMQ queue & worker setup
├── controllers/         # HTTP request handlers
├── routes/             # API route definitions
├── services/           # Business logic & orchestration
├── queues/             # Queue name registry
├── workers/            # Job processors (separate process)
├── middleware/         # Express middleware
│   ├── logging.js      # HTTP request logging
│   └── errorHandler.js # Global error handling
├── utils/              # Utility functions
│   ├── logger.js       # Centralized logging
│   ├── validators.js   # Input validation
│   └── helpers.js      # Helper functions
└── server.js           # Express app initialization
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Required variables:
- `NODE_ENV` - development or production
- `PORT` - Server port (default: 3000)
- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)

### 3. Start Redis

Ensure Redis is running on your system:

```bash
# macOS
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:alpine

# Linux
sudo systemctl start redis-server
```

### 4. Start the Server

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

### 5. Start Worker Process (Separate Terminal)

```bash
npm run worker
```

Or with auto-reload:

```bash
npm run worker:dev
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "Async Core",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Queue Health

```http
GET /api/queue/health
```

### Queue Statistics

```http
GET /api/queue/stats
```

## Architecture Patterns

### 1. Centralized Configuration

All configuration is validated at startup in `src/config/env.js`. This ensures the application fails fast if required variables are missing.

### 2. Redis Connection Pooling

A singleton Redis connection is created in `src/config/redis.js` with automatic reconnection and error handling.

### 3. BullMQ Queue Registry

Queues are created on-demand and registered globally in `src/config/bullmq.js`. This ensures a single queue instance per queue name.

### 4. Worker Separation

Workers run in a separate Node.js process (`npm run worker`). This allows:
- Independent scaling
- Isolated failures
- Cleaner process management

### 5. Global Error Handling

All errors are caught by the centralized error handler middleware, ensuring consistent error responses across the API.

### 6. Structured Logging

The `logger` utility provides structured logging with levels (debug, info, warn, error) based on `LOG_LEVEL` environment variable.

## Development Workflow

### 1. Add a New Queue

In `src/queues/index.js`:

```javascript
export const QUEUE_NAMES = {
  email: 'email-queue',
  myQueue: 'my-queue', // Add here
};
```

### 2. Add a Worker

In `src/workers/index.js`:

```javascript
const myWorker = createWorker(QUEUE_NAMES.myQueue, async (job) => {
  logger.info(`Processing job [${job.id}]:`, job.data);
  // Add business logic here
  return { result: 'success' };
});
workers.push(myWorker);
```

### 3. Add an API Endpoint

Create a controller in `src/controllers/`, then add a route in `src/routes/`.

### 4. Add Business Logic

Use the service layer (`src/services/`) to orchestrate queue operations and business logic.

## Production Considerations

- [ ] Implement job retry logic with exponential backoff
- [ ] Add queue monitoring and alerting
- [ ] Implement graceful worker shutdown
- [ ] Add request rate limiting
- [ ] Implement request ID tracing
- [ ] Add job result persistence
- [ ] Implement queue prioritization
- [ ] Add comprehensive error recovery
- [ ] Implement circuit breaker pattern
- [ ] Add metrics and observability

## Testing

Tests coming soon. Test structure will follow:

```
tests/
├── unit/
├── integration/
└── e2e/
```

## Common Issues

### Redis Connection Failed

- Ensure Redis is running: `redis-cli ping`
- Check Redis host/port in `.env`
- Verify Redis password if required

### Worker Not Processing Jobs

- Ensure worker process is running: `npm run worker`
- Check Redis connection from worker
- Review logs for errors

### Port Already in Use

- Change PORT in `.env`
- Or kill existing process on that port

## License

MIT

## Author

Senior Backend Architect - Portfolio Project
