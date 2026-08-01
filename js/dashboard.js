/**
 * Dashboard Data Management
 * Fetches and populates dashboard with real data from backend APIs
 */

class DashboardManager {
    constructor() {
        this.refreshInterval = 30000; // 30 seconds
        this.updateTimer = null;
        this.isLoading = false;
    }

    /**
     * Initialize dashboard
     */
    async init() {
        try {
            await this.loadDashboardData();
            this.setupAutoRefresh();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    /**
     * Load all dashboard data
     */
    async loadDashboardData() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            // Fetch all data in parallel
            const [overview, queueMetrics, history, dlq] = await Promise.allSettled([
                window.apiClient.getDashboardOverview(),
                window.apiClient.getQueueMetrics(),
                window.apiClient.getJobHistory(10),
                window.apiClient.getDeadLetterQueue(5),
            ]);

            // Update stat cards
            if (overview.status === 'fulfilled') {
                this.updateStatCards(overview.value);
            }

            // Update recent jobs table
            if (history.status === 'fulfilled') {
                this.updateRecentJobsTable(history.value);
            }

            // Update failed jobs table (use DLQ data)
            if (dlq.status === 'fulfilled') {
                this.updateFailedJobsTable(dlq.value);
            }

            this.isLoading = false;
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.isLoading = false;
            throw error;
        }
    }

    /**
     * Update stat cards with real data
     */
    updateStatCards(data) {
        // Total Jobs
        this.updateStatCard('totalJobsValue', data.totalJobs || 0);
        this.updateStatCard('totalJobsChange', `+${data.totalJobsChangePercent || 0}% from yesterday`);

        // Pending
        this.updateStatCard('pendingValue', data.waiting || 0);
        this.updateStatCard('pendingChange', `${data.pendingChangePercent >= 0 ? '+' : ''}${data.pendingChangePercent || 0}% from yesterday`);

        // Active
        this.updateStatCard('activeValue', data.active || 0);
        this.updateStatCard('activeChange', `${data.activeChangePercent >= 0 ? '+' : ''}${data.activeChangePercent || 0}% from yesterday`);

        // Completed
        this.updateStatCard('completedValue', data.completed || 0);
        this.updateStatCard('completedChange', `+${data.completedChangePercent || 0}% from yesterday`);

        // Failed
        this.updateStatCard('failedValue', data.failed || 0);
        const failedChange = document.getElementById('failedChange');
        if (failedChange) {
            failedChange.textContent = `${data.failedChangePercent || 0}% from yesterday`;
            failedChange.className = (data.failedChangePercent || 0) < 0 ? 'stat-change negative' : 'stat-change positive';
        }
    }

    /**
     * Update a single stat card value
     */
    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Update recent jobs table
     */
    updateRecentJobsTable(jobs) {
        const tbody = document.getElementById('recentJobsTable');
        if (!tbody) return;

        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="4" style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                        No recent jobs found
                    </td>
                </tr>
            `;
            return;
        }

        const html = jobs.map(job => {
            const createdAt = new Date(job.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            const statusBadgeClass = this.getStatusBadgeClass(job.status);

            return `
                <tr>
                    <td title="${job.id}">${this.truncateId(job.id)}</td>
                    <td>${job.type || 'email'}</td>
                    <td>
                        <span class="status-badge ${statusBadgeClass}">
                            ${this.capitalizeStatus(job.status)}
                        </span>
                    </td>
                    <td>${createdAt}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
    }

    /**
     * Update failed jobs table
     */
    updateFailedJobsTable(jobs) {
        const tbody = document.getElementById('failedJobsTable');
        if (!tbody) return;

        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="4" style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                        No failed jobs
                    </td>
                </tr>
            `;
            return;
        }

        const html = jobs.map(job => {
            const attempts = job.attempt || 0;
            const maxAttempts = job.maxAttempts || 3;

            return `
                <tr>
                    <td title="${job.id}">${this.truncateId(job.id)}</td>
                    <td>${job.type || 'email'}</td>
                    <td title="${job.failedReason || 'Unknown error'}">${this.truncate(job.failedReason || 'Unknown error', 30)}</td>
                    <td>
                        <span class="status-badge retry">
                            ${attempts}/${maxAttempts}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
    }

    /**
     * Get status badge class
     */
    getStatusBadgeClass(status) {
        const statusMap = {
            'completed': 'completed',
            'active': 'active',
            'waiting': 'pending',
            'pending': 'pending',
            'failed': 'failed',
            'delayed': 'pending',
            'paused': 'pending',
        };
        return statusMap[status] || 'pending';
    }

    /**
     * Capitalize status text
     */
    capitalizeStatus(status) {
        const statusMap = {
            'waiting': 'Waiting',
            'pending': 'Pending',
            'active': 'Active',
            'completed': 'Completed',
            'failed': 'Failed',
            'delayed': 'Delayed',
            'paused': 'Paused',
        };
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    }

    /**
     * Truncate job ID for display
     */
    truncateId(id) {
        return id ? `${id.substring(0, 8)}...` : 'N/A';
    }

    /**
     * Truncate text for display
     */
    truncate(text, length) {
        if (!text) return 'N/A';
        return text.length > length ? `${text.substring(0, length)}...` : text;
    }

    /**
     * Setup auto-refresh
     */
    setupAutoRefresh() {
        this.updateTimer = setInterval(() => {
            this.loadDashboardData().catch(error => {
                console.error('Auto-refresh failed:', error);
            });

            // Also update charts
            if (window.chartsManager) {
                window.chartsManager.updateCharts().catch(error => {
                    console.error('Chart update failed:', error);
                });
            }
        }, this.refreshInterval);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // New Job Button
        const newJobBtn = document.getElementById('newJobBtn');
        if (newJobBtn) {
            newJobBtn.addEventListener('click', () => this.handleNewJob());
        }

        // Chart filter
        const chartFilter = document.querySelector('.chart-filter');
        if (chartFilter) {
            chartFilter.addEventListener('change', (e) => {
                this.handleChartFilterChange(e.target.value);
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Theme change listener for chart colors
        const observer = new MutationObserver(() => {
            if (window.chartsManager) {
                window.chartsManager.onThemeChange();
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
    }

    /**
     * Handle new job button click
     */
    handleNewJob() {
        // Show modal or navigate to add job page
        console.log('New job clicked');
        // TODO: Implement new job modal/form
    }

    /**
     * Handle chart filter change
     */
    handleChartFilterChange(period) {
        console.log('Chart period changed to:', period);
        // TODO: Update charts based on period (today, week, month)
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        console.log('Search query:', query);
        // TODO: Filter jobs/queues based on search query
    }

    /**
     * Show error message
     */
    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-state';
            errorDiv.innerHTML = `
                <svg class="error-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>${message}</h3>
                <p>Please try again or contact support if the problem persists.</p>
                <button class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
            `;
            mainContent.insertBefore(errorDiv, mainContent.firstChild);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
    }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboardManager = new DashboardManager();
        window.dashboardManager.init();
    });
} else {
    window.dashboardManager = new DashboardManager();
    window.dashboardManager.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboardManager) {
        window.dashboardManager.destroy();
    }
});
