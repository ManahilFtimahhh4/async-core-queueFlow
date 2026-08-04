# Async Core - Quick Start Guide

## Prerequisites
- Node.js 18+
- Redis (Docker or local)
- npm

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your settings (optional - defaults work for dev)
```

## Development

### Terminal 1 - Start Redis (if not running)
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Terminal 2 - Start API Server
```bash
npm run dev
```
Server runs at: http://localhost:3000

### Terminal 3 - Start Worker Process
```bash
npm run worker:dev
```

## Testing

### Submit Jobs via Web UI
1. Open http://localhost:3000
2. Click "Add Job" 
3. Enter recipients, subject, message
4. Click "Submit Jobs"
5. Watch dashboard update in real-time

### Submit Jobs via API
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["user@example.com"],
    "subject": "Hello",
    "message": "This is a test email"
  }'
```

### Monitor Queue
```bash
curl http://localhost:3000/api/jobs/email/stats
```

### Check Health
```bash
curl http://localhost:3000/health
```

## Dashboard Features

### Pages
- **Dashboard**: Real-time metrics and job overview
- **Jobs**: View all jobs with filtering
- **Add Job**: Submit new email jobs
- **Queues**: Queue statistics and details
- **Workers**: Worker status
- **Failed Jobs**: Jobs that failed processing
- **Retry**: Jobs queued for retry
- **Dead Letter Queue**: Permanently failed jobs
- **Logs**: System event logs
- **Analytics**: Performance metrics and charts

### Real-Time Updates
Dashboard updates every 30 seconds with latest metrics:
- Job counts (waiting, active, completed, failed)
- Queue statistics
- Recent jobs
- Failed jobs
- Performance metrics

## Production Deployment

### 1. Setup
```bash
# Set production mode
export NODE_ENV=production

# Configure Redis (use managed service or setup cluster)
export REDIS_HOST=your-redis-host
export REDIS_PORT=6379
export REDIS_PASSWORD=your-password

# Configure SMTP
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
```

### 2. Start Server
```bash
npm start
```

### 3. Start Worker (separate process)
```bash
npm run worker
```

### 4. Setup Process Management (PM2)
```bash
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name "async-core-api"
pm2 start src/workers/index.js --name "async-core-worker"

# Setup auto-restart
pm2 startup
pm2 save
```

### 5. Monitor
```bash
pm2 monit
```

## API Reference

### Submit Email Jobs
```
POST /api/jobs/email/jobs
Content-Type: application/json

{
  "recipients": ["user1@example.com", "user2@example.com"],
  "subject": "Email Subject",
  "message": "Email message body"
}

Response (202 Accepted):
{
  "success": true,
  "message": "Jobs queued successfully",
  "data": {
    "totalJobs": 2,
    "jobIds": ["email-...", "email-..."],
    "timestamp": "2024-01-15T..."
  }
}
```

### Get Job Status
```
GET /api/jobs/email/jobs/{jobId}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "email-...",
    "recipient": "user@example.com",
    "subject": "Email Subject",
    "status": "completed",
    "progress": 100,
    "attempts": 1,
    "maxAttempts": 3,
    "failedReason": null
  }
}
```

### Get Queue Statistics
```
GET /api/jobs/email/stats

Response (200 OK):
{
  "success": true,
  "data": {
    "waiting": 0,
    "active": 2,
    "completed": 45,
    "failed": 3,
    "delayed": 0,
    "total": 50
  }
}
```

### Dashboard Overview
```
GET /api/dashboard/overview

Response (200 OK):
{
  "success": true,
  "data": {
    "timestamp": "2024-01-15T...",
    "uptime": 3600000,
    "system": { ... },
    "performance": { ... },
    "health": { ... }
  }
}
```

### Queue Metrics
```
GET /api/dashboard/queues

Response (200 OK):
{
  "success": true,
  "data": {
    "email": { "waiting": 0, "active": 0, "completed": 10, ... },
    "dlq": { "waiting": 0, "active": 0, ... }
  }
}
```

### Job History
```
GET /api/dashboard/history?limit=20

Response (200 OK):
{
  "success": true,
  "data": {
    "queue": "email-queue",
    "limit": 20,
    "count": 10,
    "jobs": [
      {
        "id": "email-...",
        "status": "completed",
        "createdAt": "2024-01-15T...",
        ...
      }
    ]
  }
}
```

### Performance Metrics
```
GET /api/dashboard/metrics

Response (200 OK):
{
  "success": true,
  "data": {
    "processing": { "averageMs": 523, "longestMs": 1200, ... },
    "counts": { "processed": 100, "failed": 5, "retried": 8 },
    "rates": { "failureRate": 4.76, "successRate": 95.24 }
  }
}
```

### Dead Letter Queue
```
GET /api/dashboard/dlq?limit=20

Response (200 OK):
{
  "success": true,
  "data": {
    "queue": "email-dlq",
    "count": 3,
    "jobs": [
      {
        "id": "dlq-...",
        "originalJobId": "email-...",
        "failedReason": "SMTP connection failed",
        "attempts": 3,
        "failedAt": "2024-01-15T...",
        ...
      }
    ]
  }
}
```

### Health Check
```
GET /health

Response (200 OK):
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T...",
    "uptime": 3600000
  }
}
```

## Troubleshooting

### Port Already in Use
```bash
# Kill existing process
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Redis Connection Failed
```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis if needed
docker run -d -p 6379:6379 redis:alpine
```

### Worker Not Processing Jobs
- Check worker logs
- Verify Redis connection
- Ensure separate terminal is running worker process
- Check NODE_ENV setting

### Dashboard Not Updating
- Check browser console for errors
- Verify API endpoints responding: `curl http://localhost:3000/health`
- Check server logs

## Performance Tips

### Optimize Concurrency
```env
# In .env - balance with available CPU
QUEUE_CONCURRENCY=5
```

### Monitor Resource Usage
```bash
pm2 monit
```

### Database Queries
- Use pagination for large result sets
- Limit=20 is default for history queries
- Max limit is 100

### Redis Memory
```bash
# Monitor Redis
redis-cli info memory
```

## Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Check API health: `curl http://localhost:3000/health`
3. Check Redis connection: `redis-cli ping`
4. Review README.md for architecture details
5. Review TESTING.md for test scenarios

## Next Steps

1. ✅ System is fully functional
2. 🔐 Configure authentication for production
3. 📊 Setup monitoring and alerting
4. 📝 Configure log aggregation
5. 🔄 Setup CI/CD pipeline
6. 📦 Deploy to production infrastructure
