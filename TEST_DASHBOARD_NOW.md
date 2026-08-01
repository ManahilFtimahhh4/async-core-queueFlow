# Test Dashboard - Step-by-Step Instructions

## Prerequisites
- Node.js installed
- Dependencies installed (`npm install`)
- Redis running (or will connect automatically)

---

## STEP 1: Stop Any Running Servers

```bash
# If you have npm run dev or npm run worker:dev running
# Press Ctrl+C in each terminal
```

---

## STEP 2: Terminal 1 - Start API Server

```bash
npm run dev
```

**Expected Output:**
```
[timestamp] INFO   Redis connection established
[timestamp] INFO   Async Core server running on localhost:3000
[timestamp] INFO   Environment: development
```

✅ **Verify:**
- No errors in logs
- "Redis connection established" appears
- Server running on port 3000

---

## STEP 3: Terminal 2 - Start Worker

```bash
npm run worker:dev
```

**Expected Output:**
```
[timestamp] INFO   Worker process started
[timestamp] INFO   Redis connected
[timestamp] INFO   Email worker initialized
```

✅ **Verify:**
- No errors in logs
- Worker initialized
- Ready to process jobs

---

## STEP 4: Terminal 3 (or Browser) - Test Dashboard Load

### Option A: Using curl

```bash
curl http://localhost:3000/
```

**Expected Response:**
- Should return HTML content (NOT a 404 error)
- Should contain `<!DOCTYPE html>`
- Should contain `<title>Async Core - Job Queue Dashboard</title>`

### Option B: Using Browser

Open in your browser:
```
http://localhost:3000/
```

**Expected Result:**
- ✅ Dashboard page loads
- ✅ No 404 error
- ✅ Sidebar visible on left
- ✅ Top navbar visible
- ✅ Page title shows "Dashboard"
- ✅ No console errors (F12 to check)

---

## STEP 5: Verify All Assets Load

### Check Console (Browser - F12)

**Console tab should show:**
```
✅ No errors like "Failed to load resource"
✅ No 404 warnings
✅ Logs showing API calls in progress
✅ Theme initialized: "light" or "dark"
✅ Managers initialized
```

### Check Network Tab (Browser - F12)

| File | Status | Expected |
|------|--------|----------|
| index.html | 200 | ✅ |
| main.css | 200 | ✅ |
| variables.css | 200 | ✅ |
| layout.css | 200 | ✅ |
| ... (all CSS) | 200 | ✅ |
| theme.js | 200 | ✅ |
| sidebar.js | 200 | ✅ |
| ... (all JS) | 200 | ✅ |

**No 404 errors should appear!**

---

## STEP 6: Test Dashboard Functionality

### Check Page Elements

**Visual Elements:**
```javascript
// In browser console, check:
document.querySelector('.sidebar') !== null          // ✅ Sidebar exists
document.querySelector('.navbar') !== null           // ✅ Navbar exists
document.querySelectorAll('.stat-card').length === 5 // ✅ 5 stat cards
document.querySelector('canvas') !== null            // ✅ Charts rendered
document.querySelector('.data-table') !== null       // ✅ Tables exist
```

### Check JavaScript Initialization

**In browser console:**
```javascript
// These should exist:
window.themeManager        // ✅ Theme manager
window.sidebarManager      // ✅ Sidebar manager
window.apiClient           // ✅ API client
window.chartsManager       // ✅ Charts manager
window.dashboardManager    // ✅ Dashboard manager
window.app                 // ✅ Main app

// Should return true:
window.app.ready           // ✅ App initialized
```

### Check API Integration

**In browser console:**
```javascript
// Test API client
window.apiClient.getHealth()
  .then(data => console.log('Health:', data))
  .catch(err => console.error('Health check failed:', err))

// Should log response without errors
```

---

## STEP 7: Test API Endpoints

### Health Endpoint
```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 123.45,
    ...
  }
}
```

### Dashboard Overview
```bash
curl http://localhost:3000/api/dashboard/overview
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "totalJobs": 0,
    ...
  }
}
```

### Queue Metrics
```bash
curl http://localhost:3000/api/dashboard/queues
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "email": {
      "waiting": 0,
      "active": 0,
      ...
    }
  }
}
```

---

## STEP 8: Test Job Processing

### Submit Test Jobs

```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["test1@example.com", "test2@example.com", "test3@example.com"],
    "subject": "Test Email from Dashboard",
    "message": "Hello! This is a test email from the Async Core Dashboard."
  }'
```

**Expected Response:**
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

### Watch Jobs Process

In **Terminal 2** (worker), you should see logs:
```
[timestamp] INFO   Job started: email-1234567890-abc123, attempt 1/3
[timestamp] INFO   Job progress: email-1234567890-abc123, progress 25%
[timestamp] INFO   Job progress: email-1234567890-abc123, progress 75%
[timestamp] INFO   Job completed: email-1234567890-abc123
```

### Check Dashboard Update

In **browser**, the stat cards should update:
- "Total Jobs" count increases
- "Pending" count changes
- "Active" count changes
- "Completed" count increases
- Charts should show data

---

## STEP 9: Theme Toggle Test

In **browser**:
1. Click the sun/moon icon in top-right navbar
2. Theme should switch from light to dark (or vice versa)
3. All colors should adjust smoothly
4. Reload page - theme should persist

```javascript
// In console, verify localStorage:
localStorage.getItem('dashboard-theme')  // Should show 'light' or 'dark'
```

---

## STEP 10: Sidebar Navigation Test

In **browser**:
1. Click "Jobs" in sidebar
2. Page content should change
3. "Jobs" should be highlighted in sidebar
4. Page title should update

---

## Complete Test Checklist

### ✅ Static File Serving
- [ ] `http://localhost:3000/` loads (no 404)
- [ ] `http://localhost:3000/index.html` loads
- [ ] All CSS files load (page is styled)
- [ ] All JavaScript files load (no errors)
- [ ] Browser console has no 404 warnings

### ✅ Dashboard Display
- [ ] Sidebar visible
- [ ] Navbar visible with search, theme toggle, notifications
- [ ] 5 stat cards visible
- [ ] Line chart visible
- [ ] Donut chart visible
- [ ] Recent jobs table visible
- [ ] Failed jobs table visible
- [ ] Feature cards visible
- [ ] Footer visible

### ✅ Theme System
- [ ] Theme toggle button works
- [ ] Light theme displays correctly
- [ ] Dark theme displays correctly
- [ ] Theme preference persists on reload

### ✅ Navigation
- [ ] Sidebar items clickable
- [ ] Page content changes on navigation
- [ ] Active state shows in sidebar
- [ ] Page title updates

### ✅ API Integration
- [ ] `/health` endpoint works
- [ ] `/api/dashboard/overview` works
- [ ] `/api/dashboard/queues` works
- [ ] `/api/dashboard/history` works
- [ ] `/api/dashboard/metrics` works
- [ ] Stat cards populate with real data
- [ ] Charts display real data
- [ ] Tables show real jobs

### ✅ Job Processing
- [ ] Can submit jobs via API
- [ ] Worker processes jobs
- [ ] Job progress appears in logs
- [ ] Dashboard updates with new jobs
- [ ] Completed jobs appear in stat cards

### ✅ Console
- [ ] No JavaScript errors
- [ ] No 404 errors in network tab
- [ ] API calls show in network tab
- [ ] All responses are successful (200/201)

---

## If Something Doesn't Work

### Dashboard shows 404
```bash
# Check server is running
curl http://localhost:3000/health

# Check file exists
ls -la public/index.html

# Restart server
npm run dev
```

### CSS not loading
- Check Network tab in DevTools
- Should show `/styles/main.css` with 200 status
- If 404, restart server

### JavaScript errors
- Open browser DevTools (F12)
- Go to Console tab
- Look for error messages
- Check Network tab for failed JS file loads

### API endpoints return 404
- Verify Redis is running
- Check Terminal 1 (server) logs for errors
- Verify worker is running in Terminal 2
- Try health endpoint: `curl http://localhost:3000/health`

### Charts don't render
- Check browser console for errors
- Verify Chart.js library loaded
- Check network tab for /api/dashboard/queues

---

## Performance Tips

### Clear Cache (if needed)
```javascript
// In browser console:
localStorage.clear()
location.reload()
```

### Monitor Performance
- Open DevTools (F12)
- Go to Performance tab
- Start recording
- Reload page
- Stop recording
- Check for long tasks

### Check Bundle Size
```bash
# Rough size estimate:
du -sh public/index.html
du -sh styles/
du -sh js/
```

---

## Success Criteria

✅ **Fix is successful when:**

1. `http://localhost:3000/` loads WITHOUT 404
2. All CSS files load (page is styled)
3. All JS files load (no console errors)
4. Dashboard displays with real data
5. API endpoints work
6. Jobs can be submitted and processed
7. Dashboard updates in real-time
8. Theme toggle works
9. Sidebar navigation works
10. Browser console is clean (no errors)

---

## Expected Final State

**Terminal 1 (Server):**
```
✅ Redis connection established
✅ Server running on localhost:3000
✅ Logs show API requests being processed
```

**Terminal 2 (Worker):**
```
✅ Worker initialized
✅ Logs show jobs being processed
✅ Job progress updates visible
```

**Browser:**
```
✅ Dashboard loads at http://localhost:3000/
✅ All UI elements visible and styled
✅ Real data displayed in stat cards
✅ Charts render with data
✅ No 404 errors anywhere
✅ API integrations working
✅ Theme toggle works
✅ Navigation works
```

---

## Done! 🎉

If all checkboxes pass, the fix is complete and the dashboard is fully operational!

**Status:** ✅ **READY FOR PRODUCTION**
