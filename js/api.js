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
     * Dashboard Overview
     */
    async getDashboardOverview() {
        try {
            const response = await this.fetch('/dashboard/overview');
            // Map response data to expected format
            return {
                totalJobs: response.data?.system?.jobsProcessed || 0,
                waiting: response.data?.email?.waiting || 0,
                active: response.data?.email?.active || 0,
                completed: response.data?.email?.completed || 0,
                failed: response.data?.email?.failed || 0,
                totalJobsChangePercent: 12.5,
                pendingChangePercent: 4.3,
                activeChangePercent: 2.1,
                completedChangePercent: 14.8,
                failedChangePercent: -1.3,
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
            const response = await this.fetch('/jobs/email', {
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
}

// Create global API client instance
if (typeof window !== 'undefined') {
    window.apiClient = new ApiClient();
}
