# Dashboard Implementation Guide

## Overview

The **Async Core Dashboard** is a production-ready, real-time monitoring interface for the background job processing system. Built with vanilla HTML5, CSS3, and JavaScript, it provides a comprehensive view of job queues, worker status, and system metrics.

## Features

✅ **Real-time Monitoring**
- Live job status tracking
- Queue metrics (waiting, active, completed, failed)
- Worker performance statistics
- System health indicators

✅ **Responsive Design**
- Desktop (1920px+)
- Laptop (1280px+)
- Tablet (768px+)
- Mobile (320px+)
- Full keyboard navigation support

✅ **Theme System**
- Light & Dark themes
- Persistent theme preference (localStorage)
- System theme detection
- Smooth theme transitions

✅ **Real API Integration**
- All data fetched from backend APIs
- No hardcoded values
- Graceful error handling
- Automatic data refresh

✅ **Accessibility**
- ARIA labels on all interactive elements
- Semantic HTML structure
- Keyboard shortcuts (Cmd/Ctrl+K for search)
- Focus management
- Screen reader support

## Architecture

### Directory Structure

```
public/
└── index.html                 # Main dashboard HTML

styles/
├── main.css                   # CSS orchestrator
├── variables.css              # Design tokens & CSS variables
├── base.css                   # Global resets & typography
├── layout.css                 # Page layout & grid system
├── sidebar.css                # Sidebar & navigation
├── navbar.css                 # Top navigation bar
├── cards.css                  # Stat & feature card styling
├── tables.css                 # Data table styling
├── charts.css                 # Chart container styling
├── buttons.css                # Button variants & states
├── theme.css                  # Dark/light theme overrides
├── animations.css             # Transition & animation library
└── responsive.css             # Media queries & responsive rules

js/
├── theme.js                   # Theme toggle & persistence
├── sidebar.js                 # Sidebar & navigation management
├── api.js                     # Backend API client
├── charts.js                  # Chart.js initialization
├── dashboard.js               # Dashboard data management
└── main.js                    # App initialization & global setup
```

### Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **UI Library:** Chart.js for data visualization
- **Icons:** Built-in SVG icons (Lucide style)
- **State:** localStorage for preferences
- **API:** Fetch API with error handling

## Component Breakdown

### 1. Theme Manager (`js/theme.js`)

Handles theme switching and persistence.

**Features:**
- Auto-detects system preference (prefers-color-scheme)
- Saves user preference to localStorage
- Smooth theme transitions
- Responds to system theme changes

**API:**
```javascript
themeManager.setTheme('dark')        // Set theme explicitly
themeManager.toggle()                // Toggle theme
themeManager.getCurrentTheme()       // Get current theme
```

### 2. Sidebar Manager (`js/sidebar.js`)

Manages sidebar navigation and state.

**Features:**
- Collapse/expand with smooth animation
- Page navigation
- Active page tracking
- Keyboard shortcuts (Cmd/Ctrl+K)
- Responsive behavior

**API:**
```javascript
sidebarManager.toggle()              // Toggle sidebar
sidebarManager.collapse()            // Collapse sidebar
sidebarManager.expand()              // Expand sidebar
sidebarManager.navigateToPage(id)    // Navigate to page
```

### 3. API Client (`js/api.js`)

Handles all backend communication.

**Endpoints:**
```
/health                  - Server health check
/api/dashboard/overview  - System overview & stats
/api/dashboard/queues    - Queue metrics
/api/dashboard/history   - Job history
/api/dashboard/metrics   - Performance metrics
/api/dashboard/dlq       - Dead Letter Queue
/api/dashboard/redis     - Redis status
/api/jobs/email/stats    - Email queue stats
/api/jobs/email/jobs/:id - Individual job status
```

**Error Handling:**
- 10-second timeout per request
- Automatic retry logic
- Graceful fallback to cached data
- Detailed error logging

### 4. Charts Manager (`js/charts.js`)

Manages Chart.js initialization and data.

**Charts:**
- **Line Chart:** Job Overview (Completed, Active, Pending, Failed)
- **Donut Chart:** Queue Status distribution

**Features:**
- Responsive sizing
- Theme-aware colors
- Auto-scaling based on data
- Smooth animations
- Interactive tooltips
- Legend with real values

### 5. Dashboard Manager (`js/dashboard.js`)

Orchestrates dashboard data flow.

**Responsibilities:**
- Fetch data from APIs
- Update stat cards
- Populate tables
- Handle auto-refresh (30s interval)
- Error state management
- Search/filter functionality

**Data Flow:**
```
Load Data → Update UI → Setup Auto-refresh → Listen to Events
```

### 6. Main Application (`js/main.js`)

Global app initialization and event handling.

**Setup:**
- Initialize all managers
- Setup keyboard shortcuts
- Setup responsive behavior
- Setup error handling
- Setup accessibility features

**Shortcuts:**
- `Cmd/Ctrl+K` - Focus search
- `Cmd/Ctrl+D` - Toggle theme
- `Esc` - Clear search/close dialogs

## Design System

### Color Palette

**Light Mode:**
- Primary Background: `#F5F7FB`
- Secondary Background: `#FFFFFF`
- Primary Color: `#2563EB`
- Success: `#16A34A`
- Warning: `#F59E0B`
- Danger: `#EF4444`

**Dark Mode:**
- Primary Background: `#0F172A`
- Secondary Background: `#1E293B`
- Text Primary: `#F1F5F9`
- Text Secondary: `#94A3B8`

### Typography

- **Font Family:** Inter (system fallback)
- **Page Title:** 32px, 700 weight
- **Section Title:** 22px, 600 weight
- **Card Value:** 34px, 700 weight
- **Body:** 15-16px, 400 weight

### Spacing

- Used consistent 4px base unit (0.25rem)
- Scales up to 3rem (12 × 4px) max
- Maintains visual hierarchy
- Supports responsive adjustments

### Animations

- `fadeIn` - 300ms smooth appearance
- `slideIn[Direction]` - 300ms directional entrance
- `scaleIn` - 300ms size emergence
- `pulse` - 2s breathing effect
- `shimmer` - Skeleton loading effect
- `spin` - Loading indicator

## API Integration

### Example: Fetching Dashboard Overview

```javascript
// In dashboard.js
const overview = await window.apiClient.getDashboardOverview();

// Response structure:
{
  totalJobs: 1523,
  waiting: 45,
  active: 12,
  completed: 1456,
  failed: 10,
  totalJobsChangePercent: 12.5,
  pendingChangePercent: 4.3,
  // ... more metrics
}
```

### Error Handling Pattern

```javascript
try {
  const data = await window.apiClient.getQueueMetrics();
  this.updateStatCards(data);
} catch (error) {
  console.error('Failed to load data:', error);
  this.showError('Failed to load dashboard data');
}
```

## Responsive Behavior

### Breakpoints

- **Desktop:** 1920px+ (6 stat cards across)
- **Laptop:** 1280px+ (5 stat cards, 2 columns for tables)
- **Tablet:** 768px+ (Sidebar becomes horizontal, 2 stat cards)
- **Mobile:** 640px (1 stat card, stacked layout)
- **Small Mobile:** 380px (Minimal layout, essential features only)

### Layout Changes

| Screen | Sidebar | Charts | Tables | Cards |
|--------|---------|--------|--------|-------|
| Desktop | Vertical, 170px | Side-by-side | 2 columns | 5 row |
| Laptop | Vertical, 170px | Side-by-side | 1 column | 3-5 row |
| Tablet | Horizontal navbar | Stacked | 1 column | 2 row |
| Mobile | Horizontal navbar | Stacked | 1 column (scroll) | 1 row |
| Small | Horizontal navbar | Stacked | Hidden | 1 row |

## State Management

### LocalStorage Keys

```javascript
'dashboard-theme'      // Current theme (light/dark)
'sidebar-collapsed'    // Sidebar collapse state
'current-page'         // Last visited page
```

### Auto-refresh

- Refreshes every 30 seconds
- Updates stat cards, charts, tables
- Pauses on page visibility change
- Resumes when page regains focus

## Keyboard Navigation

**Global Shortcuts:**
- `Tab` - Navigate between focusable elements
- `Shift+Tab` - Navigate backwards
- `Enter` - Activate buttons/links
- `Space` - Toggle checkboxes/buttons

**Application Shortcuts:**
- `Cmd/Ctrl+K` - Focus search input
- `Cmd/Ctrl+D` - Toggle theme
- `Esc` - Clear search / close modals

## Accessibility Features

✅ **Semantic HTML**
- Proper heading hierarchy
- Landmark elements (<nav>, <main>, <footer>)
- Form labels associated with inputs
- ARIA roles where needed

✅ **ARIA Support**
- `aria-label` on icon buttons
- `aria-live` for dynamic updates
- `role="status"` for announcements
- `aria-hidden` for decorative elements

✅ **Focus Management**
- Visible focus indicators
- Logical tab order
- Focus trap in modals
- Skip to main content link

✅ **Visual Indicators**
- Color + icons (not color alone)
- Sufficient contrast ratios
- Clear error messages
- Loading states

## Performance Optimizations

✅ **CSS**
- Critical CSS inlined in <head>
- CSS split into logical modules
- Minimal specificity conflicts
- Efficient selectors

✅ **JavaScript**
- Event delegation for dynamic content
- Debounced resize/scroll handlers
- Lazy initialization of charts
- Minimal DOM queries

✅ **Network**
- Parallel API requests
- Request caching where appropriate
- Efficient data structures
- Compression enabled (gzip)

✅ **Rendering**
- CSS transitions use transform/opacity
- Minimal layout thrashing
- Batched DOM updates
- Smooth 60fps animations

## Development Workflow

### Adding a New Page

1. **Add HTML section in public/index.html:**
```html
<div id="page-jobs" class="page-content">
  <div class="placeholder-content">
    <h2>Jobs</h2>
    <!-- Page content -->
  </div>
</div>
```

2. **Add nav item in sidebar:**
```html
<a href="#" class="nav-item" data-page="jobs">
  <svg class="nav-icon"><!-- icon --></svg>
  <span class="nav-label">Jobs</span>
</a>
```

3. **Navigation auto-wired via `data-page` attribute**

### Adding a New API Endpoint

1. **Add method in js/api.js:**
```javascript
async getCustomData() {
  try {
    return await this.fetch('/api/custom/endpoint');
  } catch (error) {
    console.error('Failed:', error);
    throw error;
  }
}
```

2. **Use in js/dashboard.js:**
```javascript
const data = await window.apiClient.getCustomData();
this.updateUI(data);
```

### Adding a New Animation

1. **Define in styles/animations.css:**
```css
@keyframes slideDown {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.slide-down { animation: slideDown 300ms ease-out; }
```

2. **Apply to elements:**
```html
<div class="slide-down">Animated content</div>
```

## Debugging Tips

### Browser DevTools

**Console Commands:**
```javascript
// Check theme
window.themeManager.getCurrentTheme()

// Toggle theme
window.themeManager.toggle()

// Check sidebar state
window.sidebarManager.sidebar.classList.contains('collapsed')

// Check if app ready
window.app.ready

// Manual data refresh
window.dashboardManager.loadDashboardData()

// Inspect API responses
window.apiClient.fetch('/api/dashboard/overview').then(d => console.log(d))
```

**Network Tab:**
- Monitor API requests
- Check response times
- Verify data structure
- Monitor error responses

**Performance Tab:**
- Profile chart rendering
- Check for layout thrashing
- Monitor memory usage
- Profile long tasks

### Common Issues

| Issue | Solution |
|-------|----------|
| Charts not rendering | Check if Chart.js is loaded, verify canvas IDs |
| API requests failing | Check CORS, verify backend is running |
| Theme not persisting | Check localStorage, verify browser support |
| Mobile layout broken | Check viewport meta tag, verify CSS media queries |
| Animations stuttering | Check GPU acceleration, reduce animation complexity |

## Deployment Checklist

- [ ] Verify all API endpoints are accessible
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Verify theme persistence works
- [ ] Check keyboard navigation
- [ ] Verify all ARIA labels
- [ ] Test error states
- [ ] Verify responsive layout
- [ ] Check console for errors
- [ ] Verify loading states
- [ ] Test chart responsiveness
- [ ] Verify auto-refresh works

## Future Enhancements

🚀 **Planned Features:**
- [ ] Real-time WebSocket updates (instead of polling)
- [ ] Job detail modal with full job information
- [ ] Advanced filtering and search
- [ ] Export data as CSV/JSON
- [ ] Custom dashboard layouts (drag & drop)
- [ ] Alert configuration (email, Slack)
- [ ] Job retry UI with modal confirmation
- [ ] Worker health indicators
- [ ] Performance graph comparison
- [ ] Activity timeline view

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend API is running
3. Check network requests in DevTools
4. Review server logs
5. Verify Redis connection

---

**Created:** Phase 4 of Async Core
**Last Updated:** 2024
**Status:** Production Ready
