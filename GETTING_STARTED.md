# Getting Started with Async Core

## 📋 Quick Reference

**You are here:** Foundation complete ✅  
**Next:** Install & run the system  
**Goal:** Working background job processing in 5 minutes  

---

## 🎯 The Next 5 Minutes

### Minute 1: Install Dependencies

```bash
npm install
```

You'll see npm downloading 9 production packages:
- express
- bullmq
- ioredis
- nodemailer
- dotenv
- cors
- morgan
- uuid
- compression

### Minute 2: Setup Configuration

```bash
cp .env.example .env
```

This creates `.env` with default values. No changes needed for local development.

**Default configuration:**
```
NODE_ENV=development
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Minute 3: Start Redis

Choose one method:

**Docker (Recommended):**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Homebrew (macOS):**
```bash
brew services start redis
```

**Verify Redis is running:**
```bash
redis-cli ping
```
Should output: `PONG`

### Minute 4: Start Server

Open first terminal:
```bash
npm run dev
```

You should see:
```
[2024-01-15T10:30:00.000Z] INFO   Redis connected successfully
[2024-01-15T10:30:00.250Z] INFO   Async Core server running on localhost:3000
```

### Minute 5: Start Worker

Open second terminal:
```bash
npm run worker:dev
```

You should see:
```
[2024-01-15T10:30:05.000Z] INFO   Redis connected successfully
[2024-01-15T10:30:05.250Z] INFO   Worker started for queue: email-queue
[2024-01-15T10:30:05.251Z] INFO   Worker process started
```

---

## ✅ Verification

### Test 1: Server Health

```bash
curl http://localhost:3000/health
```

**Expected response:**
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

### Test 2: Redis Connection

```bash
redis-cli ping
```

**Expected:** `PONG`

### Test 3: Queue Health

```bash
curl http://localhost:3000/api/queue/health
```

**Expected response:**
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

---

## 📂 What You Have

```
async-core/
├── src/                   # All source code
│   ├── config/           # Configuration
│   ├── controllers/       # HTTP handlers
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── queues/           # Queue registry
│   ├── workers/          # Job processors
│   ├── middleware/       # HTTP middleware
│   ├── utils/            # Utilities
│   └── server.js         # Entry point
├── package.json          # Dependencies
├── .env.example          # Config template
├── .gitignore            # Git rules
└── Documentation files:
    ├── README.md         # Main guide
    ├── SETUP.md          # Detailed setup
    ├── ARCHITECTURE.md   # System design
    ├── PROJECT_SUMMARY.md # Overview
    └── GETTING_STARTED.md # This file
```

---

## 🚀 Development Workflow

### Terminal 1: API Server

```bash
# Development mode (auto-reload on file changes)
npm run dev

# Production mode
npm start
```

**What it does:**
- Starts Express server on port 3000
- Connects to Redis
- Initializes queues
- Listens for HTTP requests
- Serves `/health`, `/api/queue/*` endpoints

### Terminal 2: Worker Process

```bash
# Development mode (auto-reload on file changes)
npm run worker:dev

# Production mode
npm run worker
```

**What it does:**
- Connects to Redis
- Listens to job queues
- Processes jobs as they arrive
- Handles retries on failure
- Reports job status

### Terminal 3: Optional – Redis CLI

```bash
redis-cli

# Now you can inspect data:
KEYS *              # See all Redis keys
HGETALL bull:*      # View BullMQ data
LLEN bull:*:wait    # Check pending jobs
FLUSHDB             # Clear all data
EXIT                # Exit redis-cli
```

---

## 📝 Common Commands

```bash
# Development
npm run dev              # Server with auto-reload
npm run worker:dev       # Worker with auto-reload

# Production
npm start                # Start server
npm run worker           # Start worker

# Code quality
npm run lint             # Run ESLint
npm test                 # Run tests

# Redis (in separate terminal)
redis-cli                # Connect to Redis
redis-cli ping           # Test connection
redis-cli info server    # Check Redis info
```

---

## 🔍 Understanding the Flow

### When You Start the System

```
1. npm run dev
   ↓
2. src/server.js loads .env via dotenv
   ↓
3. src/config/env.js validates required variables
   ↓
4. src/config/redis.js creates Redis connection
   ↓
5. src/server.js initializes Express
   ↓
6. Express listens on port 3000
   ↓
✅ Server ready to accept requests
```

```
1. npm run worker:dev
   ↓
2. src/workers/index.js loads .env
   ↓
3. Create Redis connection
   ↓
4. Create workers for each queue
   ↓
5. Workers listen to Redis queues
   ↓
✅ Workers ready to process jobs
```

### When You Submit a Job

```
1. HTTP POST /api/queue/jobs (future endpoint)
   ↓
2. Controller validates request
   ↓
3. Service calls submitJob()
   ↓
4. BullMQ adds job to Redis queue
   ↓
5. Server returns job ID to client
   ↓
6. Worker picks up job from queue (polling)
   ↓
7. Processor function executes
   ↓
8. Result stored in Redis
   ↓
✅ Job completed
```

---

## 🎓 Code Navigation

### Entry Points

**Server startup:** `src/server.js` (start here!)  
**Worker startup:** `src/workers/index.js`  
**Configuration:** `src/config/env.js` (validates everything)  

### Request Flow

HTTP Request → `src/routes/queue.js` → `src/controllers/queueController.js` → `src/services/queueService.js` → BullMQ/Redis

### Data Flow

Redis ← BullMQ ← Worker ← Queue ← Service ← Controller ← Route ← Client

---

## 🛠️ Troubleshooting

### Problem: "Redis connection refused"

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis:
docker run -d -p 6379:6379 redis:alpine
# OR
brew services start redis
```

### Problem: "Port 3000 already in use"

**Solution:**
```bash
# Option 1: Use different port
echo "PORT=3001" >> .env

# Option 2: Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Problem: "Cannot find module"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Worker not processing jobs"

**Solution:**
```bash
1. Check worker is running: npm run worker:dev
2. Check Redis: redis-cli ping
3. Check logs in worker terminal
4. Verify queue names match between server and worker
```

### Problem: "Module not found: bullmq"

**Solution:**
```bash
npm install bullmq ioredis
```

---

## 📚 Documentation Map

| Document | When to Read | Duration |
|----------|-------------|----------|
| **GETTING_STARTED.md** | Before anything else | 5 min |
| **SETUP.md** | Installation issues | 10 min |
| **README.md** | Understanding features | 15 min |
| **ARCHITECTURE.md** | How it works | 20 min |
| **PROJECT_SUMMARY.md** | Design decisions | 15 min |

**Total learning time: ~1 hour**

---

## 🎯 Your First Task

Once everything is running:

### View the Logs

In server terminal, you'll see:
```
[2024-01-15T10:30:00.000Z] INFO   Redis connected successfully
[2024-01-15T10:30:00.250Z] INFO   Async Core server running on localhost:3000
```

In worker terminal, you'll see:
```
[2024-01-15T10:30:05.000Z] INFO   Worker started for queue: email-queue
```

### Make a Request

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/queue/health
```

### Inspect Redis

```bash
redis-cli
KEYS *
EXIT
```

You've now seen the complete system in action!

---

## 🚀 Next Steps

### Short Term (This Session)

- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Start Redis
- [ ] Run `npm run dev`
- [ ] Run `npm run worker:dev`
- [ ] Test endpoints with curl
- [ ] Read `ARCHITECTURE.md`

### Medium Term (This Week)

- [ ] Implement email queue processor
- [ ] Add job submission endpoint
- [ ] Add job status endpoint
- [ ] Test with actual job submission

### Long Term (This Month)

- [ ] Build web dashboard
- [ ] Add monitoring/metrics
- [ ] Write comprehensive tests
- [ ] Deploy to production

---

## 💡 Key Concepts

### Queue
A Redis data structure that holds jobs waiting to be processed.

### Job
A unit of work with data that needs to be processed asynchronously.

### Worker
A Node.js process that listens to a queue and processes jobs.

### Processor
A function that executes the actual job logic.

### Redis
In-memory data store that holds job data and state.

### BullMQ
Library that manages queues, workers, retries, and scheduling.

---

## ⚡ Performance Tips

### For Testing/Development

```env
LOG_LEVEL=debug           # See everything
QUEUE_CONCURRENCY=1       # Process one job at a time
```

### For Production

```env
LOG_LEVEL=warn            # Only errors and warnings
QUEUE_CONCURRENCY=10      # Process multiple jobs
QUEUE_MAX_ATTEMPTS=5      # More retries
```

---

## 🎓 What You're Learning

By running this system, you understand:

✅ **Asynchronous Processing** - Jobs don't block HTTP requests  
✅ **Message Queues** - How jobs are stored and ordered  
✅ **Worker Pattern** - Separate process for background work  
✅ **Redis** - Fast in-memory data storage  
✅ **BullMQ** - Production job queue library  
✅ **Node.js Architecture** - Scalable backend patterns  
✅ **Clean Code** - Modular, maintainable structure  

---

## ✨ You're Ready!

Everything is installed and configured. The system is running.

**Next:** Read `ARCHITECTURE.md` to understand how it works.

---

*Questions? Check SETUP.md or ARCHITECTURE.md for detailed explanations.*
