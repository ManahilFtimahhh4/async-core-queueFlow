# Async Core - Quick Reference Card

## 🚀 Start (Copy & Paste)

```bash
# Terminal 1: Server
npm install
npm run dev

# Terminal 2: Worker
npm run worker:dev

# Terminal 3: Redis (if needed)
redis-cli
```

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Server health |
| GET | `/api/queue/health` | Queue health |
| GET | `/api/queue/stats` | Queue statistics |

## 🏗️ File Structure

```
src/
├── server.js             # Start here!
├── config/
│   ├── env.js           # Configuration
│   ├── redis.js         # Redis connection
│   └── bullmq.js        # Queue setup
├── routes/              # API endpoints
├── controllers/         # HTTP handlers
├── services/            # Business logic
├── workers/             # Job processors
├── middleware/          # Express middleware
└── utils/               # Utilities
```

## 🛠️ npm Commands

```bash
npm run dev             # Server with auto-reload
npm run worker:dev      # Worker with auto-reload
npm start               # Production server
npm run worker          # Production worker
npm run lint            # Run ESLint
npm test                # Run tests
```

## 📖 Documentation

| File | Purpose |
|------|---------|
| GETTING_STARTED.md | Start here! (5 min) |
| SETUP.md | Installation & config |
| ARCHITECTURE.md | How it works |
| README.md | Full documentation |
| PROJECT_SUMMARY.md | Overview |

## ⚙️ Configuration

File: `.env`

```
NODE_ENV=development
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
QUEUE_CONCURRENCY=5
LOG_LEVEL=info
```

## 🧪 Test the System

```bash
# Test server health
curl http://localhost:3000/health

# Check Redis
redis-cli ping

# View Redis data
redis-cli
KEYS *
```

## 🔍 Check Logs

```bash
# Server logs
npm run dev            # Watch in terminal

# Worker logs
npm run worker:dev     # Watch in terminal

# Redis logs
redis-cli              # Connect directly
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Redis refused | `brew services start redis` or `docker run -d -p 6379:6379 redis:alpine` |
| Port in use | Change PORT in .env |
| Module not found | `npm install` |
| Worker not working | Check worker process is running |

## 📊 Architecture at a Glance

```
Client Request
     ↓
Express Server (port 3000)
     ↓
Routes → Controllers → Services
     ↓
BullMQ Queue
     ↓
Redis Storage
     ↓
Worker Process
     ↓
Job Processor
     ↓
Result
```

## 🎯 What's Implemented

✅ Server setup  
✅ Redis connection  
✅ BullMQ configuration  
✅ Worker process  
✅ Error handling  
✅ Logging  
✅ Health checks  
✅ Configuration management  

## 📝 What to Add

- [ ] Email queue processor
- [ ] Job submission endpoints
- [ ] Job status endpoints
- [ ] Web dashboard
- [ ] Monitoring/metrics
- [ ] Tests

## 🚀 Quick Development Cycle

```bash
# 1. Make code changes
# 2. Auto-reload triggers (--watch flag)
# 3. Restart your server/worker automatically
# 4. Test endpoints
# 5. Repeat
```

## 💾 Redis Commands

```bash
redis-cli ping              # Test connection
redis-cli KEYS *            # See all keys
redis-cli FLUSHDB           # Clear database
redis-cli INFO server       # Server info
redis-cli MONITOR           # Watch commands
```

## 🔑 Key Concepts

| Term | Meaning |
|------|---------|
| **Queue** | Job storage |
| **Job** | Unit of work |
| **Worker** | Job processor |
| **Redis** | Data storage |
| **BullMQ** | Queue library |

## 📦 Technologies

- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **BullMQ** - Queue management
- **Redis** - Data storage
- **Nodemailer** - Email capability

## ✨ Production Checklist

- [ ] Environment variables set
- [ ] Redis configured
- [ ] Worker process supervised (PM2)
- [ ] Logging configured
- [ ] Error monitoring setup
- [ ] Health checks enabled
- [ ] Database backups done
- [ ] Security review complete

## 📞 Common Issues

**"Cannot connect to Redis"**
```bash
redis-cli ping
brew services start redis  # if needed
```

**"Port 3000 already in use"**
```bash
PORT=3001 npm run dev
```

**"Module not found"**
```bash
npm install
```

**"Worker not processing"**
```bash
# Check processes running
npm run dev
npm run worker:dev
```

---

**Next: Read GETTING_STARTED.md**
