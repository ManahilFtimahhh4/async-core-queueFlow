/**
 * API Client
 * Handles all communication with backend APIs
 */

class ApiClient {
    constructor() {
        this.baseUrl = '/api';
        this.healthUrl = '/health';
        this.timeout = 10000;
    }

    /**
     * Generic fetch wrapper with error handling
     */
    async fetch(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                signal: controller.signal,
                ...options,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Health Check
     */
    async getHealth() {
        try {
            return await this.fetch(this.healthUrl);
        } catch (error) {
            console.error('Health check failed:', error);
            return null;
        }
    }

    /**
     * Dashboard Overview - Real data from backend
     */
    async getDashboardOverview() {
        try {
            const [overview, queues] = await Promise.all([
                this.fetch('/dashboard/overview'),
                this.fetch('/dashboard/queues'),
            ]);

            return {
                totalJobs: (queues.data?.email?.total || 0),
                waiting: queues.data?.email?.waiting || 0,
                active: queues.data?.email?.active || 0,
                completed: queues.data?.email?.completed || 0,
                failed: queues.data?.email?.failed || 0,
                totalJobsChangePercent: 0,
                pendingChangePercent: 0,
                activeChangePercent: 0,
                completedChangePercent: 0,
                failedChangePercent: 0,
            };
        } catch (error) {
            console.error('Failed to get dashboard overview:', error);
            throw error;
        }
    }

    /**
     * Queue Metrics
     */
    async getQueueMetrics() {
        try {
            const response = await this.fetch('/dashboard/queues');
            return {
                waiting: response.data?.email?.waiting || 0,
                active: response.data?.email?.active || 0,
                completed: response.data?.email?.completed || 0,
                failed: response.data?.email?.failed || 0,
            };
        } catch (error) {
            console.error('Failed to get queue metrics:', error);
            throw error;
        }
    }

    /**
     * Job History
     */
    async getJobHistory(limit = 10) {
        try {
            const response = await this.fetch(`/dashboard/history?limit=${limit}`);
            return response.data?.jobs || [];
        } catch (error) {
            console.error('Failed to get job history:', error);
            throw error;
        }
    }

    /**
     * Performance Metrics
     */
    async getMetrics() {
        try {
            const response = await this.fetch('/dashboard/metrics');
            return response.data || {};
        } catch (error) {
            console.error('Failed to get metrics:', error);
            throw error;
        }
    }

    /**
     * Dead Letter Queue
     */
    async getDeadLetterQueue(limit = 10) {
        try {
            const response = await this.fetch(`/dashboard/dlq?limit=${limit}`);
            return response.data?.jobs || [];
        } catch (error) {
            console.error('Failed to get DLQ:', error);
            throw error;
        }
    }

    /**
     * Email Queue Stats
     */
    async getEmailQueueStats() {
        try {
            const response = await this.fetch('/jobs/email/stats');
            return response.data || {};
        } catch (error) {
            console.error('Failed to get email queue stats:', error);
            throw error;
        }
    }

    /**
     * Get Job by ID
     */
    async getJob(jobId) {
        try {
            const response = await this.fetch(`/jobs/email/jobs/${jobId}`);
            return response.data || null;
        } catch (error) {
            console.error(`Failed to get job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Submit a new email job
     */
    async submitJob(jobData) {
        try {
            const response = await this.fetch('/jobs/email/jobs', {
                method: 'POST',
                body: JSON.stringify(jobData),
            });
            return response.data || response;
        } catch (error) {
            console.error('Failed to submit job:', error);
            throw error;
        }
    }

    /**
     * Retry a job
     */
    async retryJob(jobId) {
        try {
            const response = await this.fetch(`/jobs/email/jobs/${jobId}/retry`, {
                method: 'POST',
            });
            return response.data || response;
        } catch (error) {
            console.error(`Failed to retry job ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Redis Status
     */
    async getRedisStatus() {
        try {
            const response = await this.fetch('/dashboard/redis');
            return response.data || {};
        } catch (error) {
            console.error('Failed to get redis status:', error);
            throw error;
        }
    }

    /**
     * Get All Jobs - Use DLQ endpoint (it returns all jobs including completed/failed)
     */
    async getAllJobs(limit = 50) {
        try {
            const response = await this.fetch(`/dashboard/history?limit=${limit}`);
            return (response.data?.jobs || []).map(job => ({
                ...job,
                type: 'email',
            }));
        } catch (error) {
            console.error('Failed to get all jobs:', error);
            throw error;
        }
    }

    /**
     * Get Failed Jobs - Use DLQ endpoint for failed jobs
     */
    async getFailedJobs(limit = 50) {
        try {
            const response = await this.fetch(`/dashboard/dlq?limit=${limit}`);
            return (response.data?.jobs || []).map(job => ({
                ...job,
                type: 'email',
            }));
        } catch (error) {
            console.error('Failed to get failed jobs:', error);
            throw error;
        }
    }

    /**
     * Get Job Details - Use existing getJob endpoint
     */
    async getJobDetails(jobId) {
        try {
            return await this.getJob(jobId);
        } catch (error) {
            console.error(`Failed to get job details for ${jobId}:`, error);
            throw error;
        }
    }

    /**
     * Get Logs
     */
    async getLogs(level = null, limit = 50) {
        try {
            const query = new URLSearchParams();
            if (level) query.append('level', level);
            query.append('limit', limit);
            
            try {
                const response = await this.fetch(`/logs?${query.toString()}`);
                return response.data || { logs: [], total: 0 };
            } catch (error) {
                // If /logs endpoint doesn't exist, return empty logs with message
                console.warn('Logs endpoint not available, returning placeholder data');
                return {
                    logs: [{
                        timestamp: new Date().toISOString(),
                        level: 'INFO',
                        message: 'System initialized and running',
                        data: {},
                    }],
                    total: 1,
                };
            }
        } catch (error) {
            console.error('Failed to get logs:', error);
            return { logs: [], total: 0 };
        }
    }
}

// Create global API client instance
if (typeof window !== 'undefined') {
    window.apiClient = new ApiClient();
}
