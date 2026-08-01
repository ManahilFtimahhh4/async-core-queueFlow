# Async Core - Quick Setup Guide

## Prerequisites

- **Node.js** >= 18.0.0
- **Redis** (local or remote)
- **npm** or **yarn**

## Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages:
- `express` - Web framework
- `bullmq` - Queue management
- `ioredis` - Redis client
- `nodemailer` - Email capability
- `dotenv` - Environment configuration
- `cors`, `morgan`, `compression` - HTTP middleware
- `uuid` - ID generation

### Step 2: Setup Redis

#### Option A: Local Redis (if installed)

```bash
# macOS with Homebrew
brew services start redis

# Linux
sudo systemctl start redis-server

# Verify it's running
redis-cli ping
# Output: PONG
```

#### Option B: Docker Redis

```bash
docker run -d -p 6379:6379 --name redis redis:alpine
docker ps  # Verify container is running
```

#### Option C: Redis Cloud (optional)

Get a free instance at [redis.com/try-free](https://redis.com/try-free)

### Step 3: Configure Environment

```bash
# Copy template to actual .env file
cp .env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=development
PORT=3000
HOST=localhost

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Leave empty if no password
REDIS_DB=0

# Queue Settings
QUEUE_CONCURRENCY=5      # Jobs processed simultaneously
QUEUE_MAX_ATTEMPTS=3     # Retry attempts per job
QUEUE_BACKOFF_DELAY=5000 # Delay between retries (ms)

# Email (optional for now)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@asynccore.dev

# Application
APP_NAME=Async Core
LOG_LEVEL=info            # debug, info, warn, error
```

## Running the Application

### Terminal 1: Start Main Server

```bash
# Development (with auto-reload on file changes)
npm run dev

# Production
npm start
```

Expected output:
```
[2024-01-15T10:30:00.000Z] INFO   Redis connected successfully
[2024-01-15T10:30:00.250Z] INFO   Async Core server running on localhost:3000
[2024-01-15T10:30:00.251Z] INFO   Environment: development
```

### Terminal 2: Start Worker Process

```bash
# Development (with auto-reload)
npm run worker:dev

# Production
npm run worker
```

Expected output:
```
[2024-01-15T10:30:05.000Z] INFO   Redis connected successfully
[2024-01-15T10:30:05.250Z] INFO   Worker started for queue: email-queue
[2024-01-15T10:30:05.251Z] INFO   Worker process started
```

## Verify Installation

### 1. Check Server Health

```bash
curl http://localhost:3000/health
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

### 2. Check Queue Health

```bash
curl http://localhost:3000/api/queue/health
```

### 3. Check Redis Connection

```bash
redis-cli ping
# Output: PONG
```

## Project Structure Overview

```
async-core/
├── src/
│   ├── config/           # Configuration management
│   │   ├── env.js        # Environment variables
│   │   ├── redis.js      # Redis connection
│   │   └── bullmq.js     # Queue setup
│   ├── controllers/       # HTTP handlers
│   ├── services/         # Business logic
│   ├── routes/           # API endpoints
│   ├── queues/           # Queue registry
│   ├── workers/          # Job processors
│   ├── middleware/       # Express middleware
│   ├── utils/            # Helper utilities
│   └── server.js         # Main entry point
├── .env.example          # Configuration template
├── package.json          # Dependencies
├── README.md             # Main documentation
├── ARCHITECTURE.md       # System design
└── SETUP.md              # This file
```

## Common Commands

```bash
# Development
npm run dev              # Server with auto-reload
npm run worker:dev       # Worker with auto-reload

# Production
npm start                # Start server
npm run worker           # Start worker

# Maintenance
npm run lint             # Run ESLint
npm test                 # Run tests (placeholder)
```

## Troubleshooting

### "Cannot find module" errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Redis connection refused

```bash
# Check Redis is running
redis-cli ping

# If not running:
# macOS: brew services start redis
# Docker: docker start redis
# Linux: sudo systemctl start redis-server

# Check Redis host/port in .env match your setup
```

### Port already in use (3000)

Option 1: Kill process on port 3000
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Option 2: Use different port
```bash
# In .env
PORT=3001
```

### Worker not processing jobs

1. Ensure worker process is running in separate terminal
2. Check Redis connection: `redis-cli ping`
3. Check logs for errors
4. Verify queue names match between server and worker

## Next Steps

1. **Read ARCHITECTURE.md** - Understand system design
2. **Review src/ structure** - Explore code organization
3. **Implement email queue** - Add email job processor
4. **Add API endpoints** - Create job submission endpoints
5. **Build dashboard** - Add web UI for monitoring
6. **Write tests** - Add unit and integration tests
7. **Deploy** - Containerize and deploy to production

## Performance Tips

### For Development

```env
LOG_LEVEL=debug          # Verbose logging
QUEUE_CONCURRENCY=1      # Single job at a time (easier debugging)
```

### For Production

```env
LOG_LEVEL=warn           # Only warnings and errors
QUEUE_CONCURRENCY=10     # Process multiple jobs
QUEUE_MAX_ATTEMPTS=5     # More retries for reliability
```

## Monitoring

### Redis CLI Inspection

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Check queue status
HGETALL "bull:email-queue:1"  # Replace 1 with job ID

# View pending jobs
LRANGE "bull:email-queue:wait" 0 -1

# Clear all data
FLUSHDB
```

### View Logs

```bash
# All logs go to stdout
# For file logging, pipe to a file:
npm run dev > server.log 2>&1
```

## Security Checklist

Before production:

- [ ] Change SMTP credentials to production values
- [ ] Enable Redis password in production
- [ ] Use environment-specific .env files (never commit)
- [ ] Enable CORS for specific origins only
- [ ] Add request rate limiting
- [ ] Add authentication to API endpoints
- [ ] Enable HTTPS/TLS
- [ ] Setup error monitoring (Sentry, etc)
- [ ] Configure CI/CD pipeline
- [ ] Setup database backups

## Support

For issues:

1. Check logs in terminal output
2. Review ARCHITECTURE.md for design patterns
3. Check Redis connection: `redis-cli ping`
4. Verify all environment variables are set
5. Ensure Redis and Node.js versions are compatible

---

Ready to go! Happy async processing! 🚀
