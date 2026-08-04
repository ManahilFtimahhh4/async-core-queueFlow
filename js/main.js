/**
 * Main Application Setup
 * Initializes all managers and handles global events
 */

class DashboardApplication {
    constructor() {
        this.ready = false;
        this.managers = {};
    }

    /**
     * Initialize the entire application
     */
    async init() {
        try {
            // Check if all managers are available
            if (!window.themeManager) {
                console.error('Theme manager not initialized');
                return;
            }

            if (!window.sidebarManager) {
                console.error('Sidebar manager not initialized');
                return;
            }

            if (!window.apiClient) {
                console.error('API client not initialized');
                return;
            }

            // Initialize charts manager if not done
            if (!window.chartsManager) {
                console.log('Initializing charts manager');
                window.chartsManager = new ChartsManager();
                await window.chartsManager.initCharts();
            }

            // Initialize dashboard manager if not done
            if (!window.dashboardManager) {
                console.log('Initializing dashboard manager');
                window.dashboardManager = new DashboardManager();
                await window.dashboardManager.init();
            }

            // Store references
            this.managers = {
                theme: window.themeManager,
                sidebar: window.sidebarManager,
                api: window.apiClient,
                charts: window.chartsManager,
                dashboard: window.dashboardManager,
            };

            // Setup global shortcuts
            this.setupKeyboardShortcuts();

            // Setup responsive behavior
            this.setupResponsiveBehavior();

            // Setup error handling
            this.setupErrorHandling();

            // Setup focus management
            this.setupAccessibility();

            this.ready = true;
            console.log('Dashboard application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showInitializationError();
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K: Search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Cmd/Ctrl + D: Toggle theme
            if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
                e.preventDefault();
                if (this.managers.theme) {
                    this.managers.theme.toggle();
                }
            }

            // Escape: Close any modals or clear search
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput === document.activeElement) {
                    searchInput.blur();
                    searchInput.value = '';
                }
            }
        });
    }

    /**
     * Setup responsive behavior
     */
    setupResponsiveBehavior() {
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            this.handleResize();
        });

        // Check if viewport changed to mobile
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        mediaQuery.addEventListener('change', (e) => {
            if (e.matches) {
                // Switched to mobile
                if (this.managers.sidebar) {
                    this.managers.sidebar.expand();
                }
            }
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Recalculate layouts if needed
        // Trigger chart resize if Charts.js charts exist
        if (window.chartsManager && window.chartsManager.charts) {
            Object.values(window.chartsManager.charts).forEach(chart => {
                if (chart) {
                    chart.resize();
                }
            });
        }
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            // Log to server for monitoring
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            // Log to server for monitoring
        });
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Manage focus for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // Keep focus within modal if open
                const modal = document.querySelector('[role="dialog"]');
                if (modal) {
                    this.manageFocusInModal(modal, e);
                }
            }
        });

        // Announce page changes to screen readers
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-page-active') {
                    const pageTitle = document.querySelector('.page-title');
                    if (pageTitle) {
                        this.announceToScreenReader(`Navigated to ${pageTitle.textContent}`);
                    }
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            subtree: true,
        });
    }

    /**
     * Manage focus within modal
     */
    manageFocusInModal(modal, event) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Announce to screen reader
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            announcement.remove();
        }, 1000);
    }

    /**
     * Show initialization error
     */
    showInitializationError() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    gap: 1rem;
                    background-color: var(--bg-primary);
                    color: var(--text-primary);
                ">
                    <svg style="width: 48px; height: 48px; color: var(--danger);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h1 style="font-size: 1.5rem; font-weight: 700;">Failed to Initialize</h1>
                    <p style="color: var(--text-secondary);">The application failed to load. Please try refreshing the page.</p>
                    <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 1rem;">Reload Page</button>
                </div>
            `;
        }
    }
}

// Initialize application when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new DashboardApplication();
        window.app.init();
    });
} else {
    window.app = new DashboardApplication();
    window.app.init();
}

// Service Worker registration (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    });
}
