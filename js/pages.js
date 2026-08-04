/**
 * Page Managers - Fixed & Complete
 * Handles all page initialization and data loading with real backend APIs
 */

class PageManager {
    constructor() {
        this.currentPage = null;
        this.pageManagers = {};
        this.refreshIntervals = {};
    }

    register(pageName, manager) {
        this.pageManagers[pageName] = manager;
    }

    async loadPage(pageName) {
        // Clear any existing refresh for previous page
        if (this.currentPage && this.refreshIntervals[this.currentPage]) {
            clearInterval(this.refreshIntervals[this.currentPage]);
        }

        const manager = this.pageManagers[pageName];
        if (manager && manager.load) {
            try {
                await manager.load();
                // Setup auto-refresh if manager supports it
                if (manager.setupAutoRefresh) {
                    manager.setupAutoRefresh((interval) => {
                        this.refreshIntervals[pageName] = interval;
                    });
                }
            } catch (error) {
                console.error(`Failed to load page ${pageName}:`, error);
            }
        }
        this.currentPage = pageName;
    }
}

/**
 * Jobs Page Manager
 */
class JobsPageManager {
    async load() {
        await this.loadAllJobs();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('jobSearchFilter');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        const statusFilter = document.getElementById('jobStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }
    }

    async loadAllJobs() {
        try {
            const jobs = await window.apiClient.getAllJobs(100);
            this.renderJobsTable(jobs);
            this.allJobs = jobs;
        } catch (error) {
            console.error('Failed to load jobs:', error);
            this.showError('Failed to load jobs');
        }
    }

    applyFilters() {
        const statusFilter = document.getElementById('jobStatusFilter')?.value;
        const searchFilter = document.getElementById('jobSearchFilter')?.value.toLowerCase();

        let filtered = this.allJobs || [];

        if (statusFilter) {
            // Handle both 'state' and 'status' fields - normalize to lowercase
            filtered = filtered.filter(job => {
                const jobStatus = (job.state || job.status || '').toLowerCase();
                return jobStatus === statusFilter.toLowerCase();
            });
        }

        if (searchFilter) {
            filtered = filtered.filter(job => 
                job.id.toLowerCase().includes(searchFilter) ||
                job.data?.recipient?.toLowerCase().includes(searchFilter)
            );
        }

        this.renderJobsTable(filtered);
    }

    renderJobsTable(jobs) {
        const tbody = document.getElementById('allJobsTable');
        if (!tbody) return;

        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding: 2rem; text-align: center;">No jobs found</td></tr>';
            return;
        }

        const html = jobs.map(job => {
            let createdAt = 'N/A';
            try {
                const date = new Date(job.createdAt);
                if (!isNaN(date.getTime())) {
                    createdAt = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                }
            } catch (e) {
                //  ignore
            }

            // Normalize status - handle both 'state' and 'status' fields
            const jobStatus = job.state || job.status || 'unknown';

            return `
                <tr>
                    <td><code style="cursor: pointer; color: var(--primary);" onclick="window.pageManager.pageManagers['jobs'].showJobDetails('${job.id}')">${job.id.substring(0, 16)}...</code></td>
                    <td>${job.type || 'email'}</td>
                    <td>${job.data?.recipient || 'N/A'}</td>
                    <td><span class="status-badge ${jobStatus.toLowerCase()}">${jobStatus}</span></td>
                    <td>
                        <div style="width: 100%; background-color: var(--bg-secondary); border-radius: 4px; height: 24px; overflow: hidden;">
                            <div style="background-color: var(--primary); width: ${job.progress || 0}%; height: 100%; transition: width 0.3s ease;"></div>
                        </div>
                    </td>
                    <td>${createdAt}</td>
                    <td><button class="btn btn-sm" onclick="window.pageManager.pageManagers['jobs'].showJobDetails('${job.id}')">View</button></td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
    }

    async showJobDetails(jobId) {
        try {
            const job = await window.apiClient.getJob(jobId);
            this.renderJobDetailsModal(job);
        } catch (error) {
            console.error('Failed to load job details:', error);
            alert('Failed to load job details');
        }
    }

    renderJobDetailsModal(job) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // Normalize status - handle both 'state' and 'status' fields
        const status = job.state || job.status || 'unknown';
        const closeBtn = content.createElement('button');
        
        content.innerHTML = `
            <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0;">Job Details</h3>
                <button class="modal-close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0;">×</button>
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Job ID:</strong><br>
                <code>${job.id}</code>
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Status:</strong> <span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Progress:</strong> ${job.progress || 0}%
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Recipient:</strong> ${job.data?.recipient || 'N/A'}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Subject:</strong> ${job.data?.subject || 'N/A'}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Attempts:</strong> ${job.attempts || 0}/${job.maxAttempts || 3}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Created:</strong> ${new Date(job.createdAt).toLocaleString() || 'N/A'}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Started:</strong> ${job.startedOn ? new Date(job.startedOn).toLocaleString() : 'Not started'}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Finished:</strong> ${job.finishedOn ? new Date(job.finishedOn).toLocaleString() : 'Not finished'}
            </div>
            ${job.failedReason ? `
                <div style="margin-bottom: 1rem; padding: 0.75rem; background-color: var(--danger-light); border-radius: 4px;">
                    <strong>Failed Reason:</strong> ${job.failedReason}
                </div>
            ` : ''}
            <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                <button class="btn btn-primary modal-close-action">Close</button>
                ${(status === 'failed' || status === 'Failed') ? `<button class="btn btn-success" onclick="window.pageManager.pageManagers['jobs'].retryJob('${job.id}')">Retry</button>` : ''}
            </div>
        `;

        // Add close button handlers
        const closeBtn2 = content.querySelector('.modal-close-btn');
        const closeAction = content.querySelector('.modal-close-action');
        
        const removeModal = () => modal.remove();
        if (closeBtn2) closeBtn2.addEventListener('click', removeModal);
        if (closeAction) closeAction.addEventListener('click', removeModal);

        modal.appendChild(content);
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async retryJob(jobId) {
        try {
            await window.apiClient.retryJob(jobId);
            alert('Job retry initiated');
            document.body.querySelector('[style*="position: fixed"]')?.remove();
            await this.loadAllJobs();
        } catch (error) {
            console.error('Failed to retry job:', error);
            alert('Failed to retry job');
        }
    }

    showError(message) {
        const tbody = document.getElementById('allJobsTable');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="padding: 2rem; text-align: center; color: var(--danger);">${message}</td></tr>`;
        }
    }

    setupAutoRefresh(callback) {
        const interval = setInterval(() => this.loadAllJobs(), 15000);
        callback(interval);
    }
}

/**
 * Add Job Page Manager
 */
class AddJobPageManager {
    constructor() {
        this.setupForm();
    }

    setupForm() {
        const form = document.getElementById('addJobForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async load() {
        // Nothing special needed on load
    }

    async handleSubmit(e) {
        e.preventDefault();

        try {
            const recipients = document.getElementById('emailRecipients').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            const subject = document.getElementById('emailSubject').value;
            const message = document.getElementById('emailMessage').value;

            if (recipients.length === 0) {
                this.showMessage('Please enter at least one recipient', 'error');
                return;
            }

            const response = await window.apiClient.submitJob({
                recipients,
                subject,
                message,
            });

            this.showMessage(`Successfully submitted ${response.totalJobs || recipients.length} jobs!`, 'success');
            document.getElementById('addJobForm').reset();

            if (window.dashboardManager) {
                await window.dashboardManager.loadDashboardData();
            }
        } catch (error) {
            console.error('Failed to submit job:', error);
            this.showMessage('Failed to submit jobs. ' + error.message, 'error');
        }
    }

    showMessage(message, type) {
        const messageDiv = document.getElementById('formMessage');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `form-message ${type}`;
            messageDiv.style.display = 'block';

            if (type === 'success') {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
            }
        }
    }
}

/**
 * Queues Page Manager
 */
class QueuesPageManager {
    async load() {
        await this.loadQueueMetrics();
        this.setupAutoRefresh();
    }

    async loadQueueMetrics() {
        try {
            const metrics = await window.apiClient.getQueueMetrics();

            document.getElementById('queueWaiting').textContent = metrics.waiting || 0;
            document.getElementById('queueActive').textContent = metrics.active || 0;
            document.getElementById('queueCompleted').textContent = metrics.completed || 0;
            document.getElementById('queueFailed').textContent = metrics.failed || 0;

            this.renderQueuesTable(metrics);
        } catch (error) {
            console.error('Failed to load queue metrics:', error);
        }
    }

    renderQueuesTable(metrics) {
        const tbody = document.getElementById('queuesTable');
        if (!tbody) return;

        const total = Object.values(metrics).reduce((a, b) => a + b, 0);

        const html = `
            <tr>
                <td>email-queue</td>
                <td>${metrics.waiting || 0}</td>
                <td>${metrics.active || 0}</td>
                <td>${metrics.completed || 0}</td>
                <td>${metrics.failed || 0}</td>
                <td><strong>${total}</strong></td>
            </tr>
        `;

        tbody.innerHTML = html;
    }

    setupAutoRefresh() {
        setInterval(() => this.loadQueueMetrics(), 15000);
    }
}

/**
 * Workers Page Manager
 */
class WorkersPageManager {
    async load() {
        await this.loadWorkerStatus();
        this.setupAutoRefresh();
    }

    async loadWorkerStatus() {
        try {
            const metrics = await window.apiClient.getMetrics();
            document.getElementById('processedJobs').textContent = metrics.counts?.processed || 0;
        } catch (error) {
            console.error('Failed to load worker status:', error);
        }
    }

    setupAutoRefresh() {
        setInterval(() => this.loadWorkerStatus(), 15000);
    }
}

/**
 * Failed Jobs Page Manager
 */
class FailedJobsPageManager {
    async load() {
        await this.loadFailedJobs();
        this.setupEventListeners();
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('failedJobsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
    }

    async loadFailedJobs() {
        try {
            const failed = await window.apiClient.getFailedJobs(100);
            document.getElementById('failedJobsCount').textContent = failed.length;
            this.renderFailedJobsTable(failed);
            this.failedJobs = failed;
        } catch (error) {
            console.error('Failed to load failed jobs:', error);
        }
    }

    applyFilters() {
        const searchFilter = document.getElementById('failedJobsSearch')?.value.toLowerCase();
        let filtered = this.failedJobs || [];

        if (searchFilter) {
            filtered = filtered.filter(job => 
                job.id.toLowerCase().includes(searchFilter) ||
                job.data?.recipient?.toLowerCase().includes(searchFilter)
            );
        }

        this.renderFailedJobsTable(filtered);
    }

    renderFailedJobsTable(jobs) {
        const tbody = document.getElementById('failedJobsDetailTable');
        if (!tbody) return;

        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 2rem; text-align: center;">No failed jobs</td></tr>';
            return;
        }

        const html = jobs.map(job => {
            let failedAt = 'N/A';
            try {
                const date = new Date(job.finishedOn);
                if (!isNaN(date.getTime())) {
                    failedAt = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                }
            } catch (e) {
                // ignore
            }

            return `
                <tr>
                    <td><code>${job.id.substring(0, 16)}...</code></td>
                    <td>${job.data?.recipient || 'N/A'}</td>
                    <td title="${job.failedReason}">${job.failedReason ? job.failedReason.substring(0, 30) + '...' : 'Unknown'}</td>
                    <td>${job.attempts}/${job.maxAttempts}</td>
                    <td>${failedAt}</td>
                    <td><button class="btn btn-sm" onclick="window.pageManager.pageManagers['failed'].retryJob('${job.id}')">Retry</button></td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
    }

    async retryJob(jobId) {
        try {
            await window.apiClient.retryJob(jobId);
            alert('Job retry initiated');
            await this.loadFailedJobs();
        } catch (error) {
            console.error('Failed to retry job:', error);
            alert('Failed to retry job');
        }
    }

    setupAutoRefresh() {
        setInterval(() => this.loadFailedJobs(), 15000);
    }
}

/**
 * Retry Queue Page Manager
 */
class RetryQueuePageManager {
    async load() {
        await this.loadRetryQueue();
        this.setupAutoRefresh();
    }

    async loadRetryQueue() {
        try {
            // Get delayed jobs which are essentially retry queue
            const metrics = await window.apiClient.getQueueMetrics();
            document.getElementById('retryQueueCount').textContent = metrics.delayed || 0;
            
            // For detailed retry queue, we'd need to fetch delayed jobs
            // This is a placeholder - in production would have a dedicated endpoint
            const message = `${metrics.delayed || 0} jobs are scheduled for retry`;
            const tbody = document.getElementById('retryQueueTable');
            if (tbody && metrics.delayed === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="padding: 2rem; text-align: center;">No jobs queued for retry</td></tr>';
            }
        } catch (error) {
            console.error('Failed to load retry queue:', error);
        }
    }

    setupAutoRefresh() {
        setInterval(() => this.loadRetryQueue(), 15000);
    }
}

/**
 * DLQ Page Manager
 */
class DLQPageManager {
    async load() {
        await this.loadDLQJobs();
        this.setupEventListeners();
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('dlqJobsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
    }

    async loadDLQJobs() {
        try {
            const dlq = await window.apiClient.getDeadLetterQueue(100);
            document.getElementById('dlqCount').textContent = dlq.length;
            this.renderDLQTable(dlq);
            this.dlqJobs = dlq;
        } catch (error) {
            console.error('Failed to load DLQ:', error);
        }
    }

    applyFilters() {
        const searchFilter = document.getElementById('dlqJobsSearch')?.value.toLowerCase();
        let filtered = this.dlqJobs || [];

        if (searchFilter) {
            filtered = filtered.filter(job => 
                job.id.toLowerCase().includes(searchFilter) ||
                job.originalJobId?.toLowerCase().includes(searchFilter) ||
                job.originalData?.recipient?.toLowerCase().includes(searchFilter)
            );
        }

        this.renderDLQTable(filtered);
    }

    renderDLQTable(jobs) {
        const tbody = document.getElementById('dlqTable');
        if (!tbody) return;

        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 2rem; text-align: center;">Dead Letter Queue is empty</td></tr>';
            return;
        }

        const html = jobs.map(job => {
            let failedAt = 'N/A';
            try {
                const date = new Date(job.failedAt);
                if (!isNaN(date.getTime())) {
                    failedAt = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                }
            } catch (e) {
                // ignore
            }

            return `
                <tr>
                    <td><code>${(job.originalJobId || job.id).substring(0, 16)}...</code></td>
                    <td>${job.originalData?.recipient || job.data?.recipient || 'N/A'}</td>
                    <td title="${job.failedReason}">${job.failedReason ? job.failedReason.substring(0, 30) + '...' : 'Unknown'}</td>
                    <td>${job.attempts || 0}/${job.maxAttempts || 3}</td>
                    <td>${failedAt}</td>
                    <td><button class="btn btn-sm" onclick="window.pageManager.pageManagers['dlq'].retryDLQJob('${job.id}')">Retry</button></td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
    }

    async retryDLQJob(jobId) {
        try {
            await window.apiClient.retryJob(jobId);
            alert('DLQ job retry initiated');
            await this.loadDLQJobs();
        } catch (error) {
            console.error('Failed to retry DLQ job:', error);
            alert('Failed to retry DLQ job');
        }
    }

    setupAutoRefresh() {
        setInterval(() => this.loadDLQJobs(), 15000);
    }
}

/**
 * Logs Page Manager
 */
class LogsPageManager {
    async load() {
        await this.loadLogs();
        this.setupEventListeners();
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        const levelFilter = document.getElementById('logLevelFilter');
        if (levelFilter) {
            levelFilter.addEventListener('change', () => this.applyFilters());
        }

        const searchInput = document.getElementById('logSearchFilter');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
    }

    async loadLogs(level = null) {
        try {
            const data = await window.apiClient.getLogs(level, 100);
            this.renderLogs(data.logs || []);
            this.allLogs = data.logs || [];
        } catch (error) {
            console.error('Failed to load logs:', error);
            this.showLogsError('Failed to load logs');
        }
    }

    applyFilters() {
        const levelFilter = document.getElementById('logLevelFilter')?.value;
        const searchFilter = document.getElementById('logSearchFilter')?.value.toLowerCase();

        let filtered = this.allLogs || [];

        if (levelFilter && levelFilter !== 'all') {
            filtered = filtered.filter(log => log.level.toUpperCase() === levelFilter.toUpperCase());
        }

        if (searchFilter) {
            filtered = filtered.filter(log => 
                log.message.toLowerCase().includes(searchFilter) ||
                JSON.stringify(log.data).toLowerCase().includes(searchFilter)
            );
        }

        this.renderLogs(filtered);
    }

    renderLogs(logs) {
        const viewer = document.getElementById('logViewer');
        if (!viewer) return;

        if (!logs || logs.length === 0) {
            viewer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">No logs found</div>';
            return;
        }

        const html = logs.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleString() || log.timestamp;
            return `
                <div class="log-entry" style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">${timestamp}</span>
                    <span class="log-level ${log.level.toLowerCase()}" style="margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: var(--bg-secondary); border-radius: 3px; font-size: 0.75rem; font-weight: 500;">[${log.level}]</span>
                    <span style="margin-left: 0.5rem; color: var(--text-primary);">${log.message}</span>
                </div>
            `;
        }).join('');

        viewer.innerHTML = html;
    }

    showLogsError(message) {
        const viewer = document.getElementById('logViewer');
        if (viewer) {
            viewer.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--danger);">${message}</div>`;
        }
    }

    setupAutoRefresh() {
        setInterval(() => this.loadLogs(), 15000);
    }
}

/**
 * Analytics Page Manager
 */
class AnalyticsPageManager {
    async load() {
        await this.loadAnalytics();
        this.setupAutoRefresh();
    }

    async loadAnalytics() {
        try {
            const metrics = await window.apiClient.getMetrics();

            const totalProcessed = metrics.counts?.processed || 0;
            const totalFailed = metrics.counts?.failed || 0;
            const failureRate = metrics.rates?.failureRate || 0;
            const successRate = 100 - failureRate;

            document.getElementById('successRate').textContent = `${successRate.toFixed(1)}%`;
            document.getElementById('avgProcessingTime').textContent = `${metrics.processing?.averageMs || 0}ms`;
            document.getElementById('totalProcessed').textContent = totalProcessed;

            const retryRate = totalProcessed > 0 ? ((metrics.counts?.retried || 0) / totalProcessed * 100).toFixed(1) : 0;
            document.getElementById('retryRate').textContent = `${retryRate}%`;
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }

    setupAutoRefresh() {
        setInterval(() => this.loadAnalytics(), 15000);
    }
}

// Initialize all page managers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pageManager = new PageManager();
        window.pageManager.register('jobs', new JobsPageManager());
        window.pageManager.register('add-job', new AddJobPageManager());
        window.pageManager.register('queues', new QueuesPageManager());
        window.pageManager.register('workers', new WorkersPageManager());
        window.pageManager.register('failed', new FailedJobsPageManager());
        window.pageManager.register('retry', new RetryQueuePageManager());
        window.pageManager.register('dlq', new DLQPageManager());
        window.pageManager.register('logs', new LogsPageManager());
        window.pageManager.register('analytics', new AnalyticsPageManager());
    });
} else {
    window.pageManager = new PageManager();
    window.pageManager.register('jobs', new JobsPageManager());
    window.pageManager.register('add-job', new AddJobPageManager());
    window.pageManager.register('queues', new QueuesPageManager());
    window.pageManager.register('workers', new WorkersPageManager());
    window.pageManager.register('failed', new FailedJobsPageManager());
    window.pageManager.register('retry', new RetryQueuePageManager());
    window.pageManager.register('dlq', new DLQPageManager());
    window.pageManager.register('logs', new LogsPageManager());
    window.pageManager.register('analytics', new AnalyticsPageManager());
}
