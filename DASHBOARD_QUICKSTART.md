# Dashboard Quick Start Guide

## Launch Instructions

### Terminal 1: Start API Server
```bash
npm run dev
# Server running on http://localhost:3000
```

### Terminal 2: Start Worker
```bash
npm run worker:dev
# Worker processing jobs
```

### Terminal 3: View Dashboard
Open browser to: `http://localhost:3000/public/index.html`

## What to Expect

### Initial Load
✅ Dashboard loads with light theme (or saved theme preference)
✅ Sidebar on the left with navigation menu
✅ Top navbar with search, theme toggle, notifications
✅ 5 stat cards showing job metrics
✅ Two charts (line chart for job overview, donut chart for queue status)
✅ Two tables (recent jobs, failed jobs)
✅ 4 feature cards at bottom
✅ Loading states showing skeleton animations

### Real-Time Updates
- Stat cards update every 30 seconds
- Charts refresh with latest data
- Tables show recent jobs and failures
- All values are pulled from backend APIs (not hardcoded)

### Theme Toggle
1. Click sun/moon icon in top navbar
2. Theme switches between light and dark
3. Preference saved to localStorage
4. All colors transition smoothly

### Sidebar Navigation
1. Click menu item to navigate between pages
2. Click hamburger icon to collapse sidebar (desktop only)
3. On mobile, sidebar becomes horizontal navbar
4. Current page is highlighted in sidebar

### Search (Cmd/Ctrl+K)
1. Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
2. Search input gets focus
3. Type to filter jobs (when implemented)
4. Press Esc to clear and blur

## Backend API Testing

### Test 1: Submit Email Jobs
```bash
curl -X POST http://localhost:3000/api/jobs/email/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["test1@example.com", "test2@example.com"],
    "subject": "Test Email",
    "message": "Hello from Async Core Dashboard!"
  }'
```

Response should show job IDs created. Wait 5-10 seconds for jobs to process.

### Test 2: Check Dashboard Overview
```bash
curl http://localhost:3000/api/dashboard/overview
```

Should return system health and job counts.

### Test 3: Check Queue Metrics
```bash
curl http://localhost:3000/api/dashboard/queues
```

Should show waiting, active, completed, failed counts.

### Test 4: View Recent Jobs
```bash
curl http://localhost:3000/api/dashboard/history?limit=10
```

Should return recent jobs with status and timestamps.

### Test 5: Check Health
```bash
curl http://localhost:3000/health
```

Should return quick health status.

## Feature Verification Checklist

### Layout & Design
- [ ] Light theme displays correctly
- [ ] Dark theme displays correctly
- [ ] Sidebar visible on desktop
- [ ] Sidebar collapses on desktop
- [ ] Mobile layout responsive
- [ ] All fonts load correctly (Inter)
- [ ] Colors match design spec

### Navigation
- [ ] Sidebar items clickable
- [ ] Active state shows on current page
- [ ] Page content changes on navigation
- [ ] Page title updates
- [ ] Cmd/Ctrl+K focuses search

### Data Display
- [ ] Stat cards show real numbers (not placeholders)
- [ ] Charts render with data
- [ ] Tables populate with jobs
- [ ] Status badges display correctly
- [ ] Data refreshes every 30 seconds

### Theme
- [ ] Theme toggle button works
- [ ] Theme persists on reload
- [ ] Charts update colors on theme change
- [ ] All text readable in both themes
- [ ] Transitions smooth

### Responsiveness
- [ ] Desktop (1920px): 5-column grid for stat cards
- [ ] Laptop (1280px): 3-5 column grid for stat cards
- [ ] Tablet (768px): 2 column grid, horizontal navbar
- [ ] Mobile (640px): 1 column, vertical stacked layout
- [ ] Small Mobile (320px): Essential features only

### Error Handling
- [ ] Close API (e.g., Redis) and verify error message
- [ ] Check browser console for errors
- [ ] Refresh button works on error state
- [ ] Tables show "No data" when empty

### Accessibility
- [ ] Tab key navigates all buttons/links
- [ ] Visible focus indicator on all elements
- [ ] Screen reader can read page (test with VoiceOver/NVDA)
- [ ] Keyboard shortcuts work (Cmd/Ctrl+K, Cmd/Ctrl+D, Esc)
- [ ] All icons have text labels or aria-labels

## Performance Checks

### Browser DevTools

1. **Network Tab:**
   - API requests should complete in < 1 second
   - No failed requests
   - CSS and JS files loaded efficiently
   - Chart.js library loaded

2. **Performance Tab:**
   - Initial load time < 2 seconds
   - Smooth animations (60 FPS)
   - No layout thrashing
   - No memory leaks on navigation

3. **Lighthouse Audit:**
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

## Troubleshooting

### Dashboard shows empty cards
**Cause:** Backend API not running
**Solution:** 
```bash
# Terminal 1
npm run dev
```

### Charts not rendering
**Cause:** Chart.js not loaded or canvas issue
**Solution:** Check browser console for errors, verify Chart.js CDN

### Theme not persisting
**Cause:** localStorage disabled or private browsing
**Solution:** Check browser settings, try incognito mode

### Mobile layout broken
**Cause:** Viewport meta tag issue
**Solution:** Check viewport meta tag in index.html, clear browser cache

### API requests failing with CORS error
**Cause:** CORS not configured
**Solution:** Verify CORS middleware in src/server.js

### Slow data updates
**Cause:** Large dataset or slow network
**Solution:** Check network speed, verify Redis connection

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Fully supported |
| Firefox | Latest | ✅ Fully supported |
| Safari | Latest | ✅ Fully supported |
| Edge | Latest | ✅ Fully supported |
| Chrome Mobile | Latest | ✅ Fully supported |
| Safari iOS | Latest | ✅ Fully supported |

## Development Tips

### Console Commands

```javascript
// Reload dashboard data
window.dashboardManager.loadDashboardData()

// Toggle theme
window.themeManager.toggle()

// Get current theme
window.themeManager.getCurrentTheme()

// Navigate to page
window.sidebarManager.navigateToPage('dashboard')

// Check API response
window.apiClient.fetch('/api/dashboard/overview').then(d => console.log(d))

// Disable auto-refresh
clearInterval(window.dashboardManager.updateTimer)

// Check if app initialized
console.log(window.app.ready)
```

### Modifying Refresh Interval

In `js/dashboard.js`:
```javascript
this.refreshInterval = 30000; // Change to desired milliseconds
```

### Adding Console Logging

All managers log to browser console. Set log level:
```javascript
// In any manager
console.log('Event:', data)     // Info
console.warn('Warning:', data)  // Warning
console.error('Error:', data)   // Error
```

## Next Steps

1. **Test all dashboard features** using checklist above
2. **Verify API integration** with backend
3. **Check responsive layout** on multiple devices
4. **Test accessibility** with keyboard and screen reader
5. **Performance testing** with DevTools
6. **Cross-browser testing** on multiple browsers

## Support Resources

- **DASHBOARD.md** - Comprehensive architecture guide
- **README.md** - Backend architecture and APIs
- **index.html** - DOM structure and semantic HTML
- **styles/*** - CSS organization and variables
- **js/** - JavaScript managers and logic

---

**Status:** ✅ Production Ready
**Last Updated:** Phase 4
