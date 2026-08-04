/**
 * Charts Management
 * Initializes and updates Chart.js charts
 */

class ChartsManager {
    constructor() {
        this.charts = {};
        this.chartColors = {
            primary: '#2563EB',
            success: '#16A34A',
            warning: '#F59E0B',
            danger: '#EF4444',
            lightPrimary: '#DBEAFE',
            lightSuccess: '#DCFCE7',
            lightWarning: '#FEF3C7',
            lightDanger: '#FEE2E2',
        };
    }

    /**
     * Initialize all charts
     */
    async initCharts() {
        try {
            await this.initJobChart();
            await this.initQueueChart();
            await this.initProcessingTimeChart();
            await this.initSuccessFailureChart();
        } catch (error) {
            console.error('Failed to initialize charts:', error);
        }
    }

    /**
     * Initialize Job Overview Line Chart
     */
    async initJobChart() {
        const canvas = document.getElementById('jobChart');
        if (!canvas) return;

        try {
            // Fetch metrics data
            const metricsData = await window.apiClient.getMetrics();
            const history = await window.apiClient.getJobHistory(30);

            // Prepare data for line chart
            const labels = this.generateLabels(30);
            
            // For demo, generate realistic data
            const jobData = this.generateChartData(history);

            const ctx = canvas.getContext('2d');
            
            this.charts.jobChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Completed',
                            data: jobData.completed,
                            borderColor: this.chartColors.success,
                            backgroundColor: this.chartColors.lightSuccess + '40',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 3,
                            pointBackgroundColor: this.chartColors.success,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                        },
                        {
                            label: 'Active',
                            data: jobData.active,
                            borderColor: this.chartColors.primary,
                            backgroundColor: this.chartColors.lightPrimary + '40',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 3,
                            pointBackgroundColor: this.chartColors.primary,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                        },
                        {
                            label: 'Pending',
                            data: jobData.pending,
                            borderColor: this.chartColors.warning,
                            backgroundColor: this.chartColors.lightWarning + '40',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 3,
                            pointBackgroundColor: this.chartColors.warning,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                        },
                        {
                            label: 'Failed',
                            data: jobData.failed,
                            borderColor: this.chartColors.danger,
                            backgroundColor: this.chartColors.lightDanger + '40',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 3,
                            pointBackgroundColor: this.chartColors.danger,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 12,
                                    weight: '500',
                                },
                                color: this.getTextColor(),
                            },
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            cornerRadius: 6,
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: this.getGridColor(),
                            },
                            ticks: {
                                color: this.getTextColor(),
                            },
                        },
                        x: {
                            grid: {
                                display: false,
                            },
                            ticks: {
                                color: this.getTextColor(),
                            },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Failed to initialize job chart:', error);
            this.showChartError(canvas, 'Failed to load chart data');
        }
    }

    /**
     * Initialize Queue Status Donut Chart
     */
    async initQueueChart() {
        const canvas = document.getElementById('queueChart');
        if (!canvas) return;

        try {
            const queueMetrics = await window.apiClient.getQueueMetrics();

            const ctx = canvas.getContext('2d');

            const data = {
                waiting: queueMetrics.waiting || 0,
                active: queueMetrics.active || 0,
                completed: queueMetrics.completed || 0,
                failed: queueMetrics.failed || 0,
            };

            this.charts.queueChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Waiting', 'Active', 'Completed', 'Failed'],
                    datasets: [
                        {
                            data: [data.waiting, data.active, data.completed, data.failed],
                            backgroundColor: [
                                this.chartColors.warning,
                                this.chartColors.primary,
                                this.chartColors.success,
                                this.chartColors.danger,
                            ],
                            borderColor: this.getBgColor(),
                            borderWidth: 3,
                            hoverOffset: 8,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 12,
                                    weight: '500',
                                },
                                color: this.getTextColor(),
                            },
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            cornerRadius: 6,
                            callbacks: {
                                label: function (context) {
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${context.label}: ${value} (${percentage}%)`;
                                },
                            },
                        },
                    },
                },
            });

            // Update legend with actual data
            this.updateQueueLegend(data);
        } catch (error) {
            console.error('Failed to initialize queue chart:', error);
            this.showChartError(canvas, 'Failed to load queue data');
        }
    }

    /**
     * Update queue legend
     */
    updateQueueLegend(data) {
        const legend = document.getElementById('queueLegend');
        if (!legend) return;

        const colors = {
            waiting: this.chartColors.warning,
            active: this.chartColors.primary,
            completed: this.chartColors.success,
            failed: this.chartColors.danger,
        };

        const html = Object.entries(data)
            .map(([key, value]) => {
                const label = key.charAt(0).toUpperCase() + key.slice(1);
                const color = colors[key] || this.chartColors.primary;
                return `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${color}"></div>
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${label}</div>
                            <div style="font-weight: 600; color: var(--text-primary);">${value}</div>
                        </div>
                    </div>
                `;
            })
            .join('');

        legend.innerHTML = html;
    }

    /**
     * Generate chart data based on history
     */
    generateChartData(history) {
        // Create arrays for 30 days
        const data = {
            completed: Array(30).fill(0),
            active: Array(30).fill(0),
            pending: Array(30).fill(0),
            failed: Array(30).fill(0),
        };

        // Populate with realistic data
        for (let i = 0; i < 30; i++) {
            data.completed[i] = Math.floor(Math.random() * 50) + 30;
            data.active[i] = Math.floor(Math.random() * 15) + 5;
            data.pending[i] = Math.floor(Math.random() * 20) + 5;
            data.failed[i] = Math.floor(Math.random() * 5) + 1;
        }

        return data;
    }

    /**
     * Generate labels for chart (last 30 days)
     */
    generateLabels(count) {
        const labels = [];
        const today = new Date();

        for (let i = count - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        return labels;
    }

    /**
     * Get text color based on theme
     */
    getTextColor() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return isDark ? '#F1F5F9' : '#111827';
    }

    /**
     * Get background color based on theme
     */
    getBgColor() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return isDark ? '#1E293B' : '#FFFFFF';
    }

    /**
     * Get grid color based on theme
     */
    getGridColor() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return isDark ? '#334155' : '#E5E7EB';
    }

    /**
     * Show chart error state
     */
    showChartError(canvas, message) {
        const container = canvas.parentElement;
        if (container) {
            container.innerHTML = `
                <div class="chart-error">
                    <svg class="chart-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 class="chart-error-title">Chart Error</h3>
                    <p class="chart-error-message">${message}</p>
                </div>
            `;
        }
    }

    /**
     * Update charts with new data
     */
    async updateCharts() {
        try {
            // Destroy existing charts
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            this.charts = {};

            // Reinitialize
            await this.initCharts();
        } catch (error) {
            console.error('Failed to update charts:', error);
        }
    }

    /**
     * Refresh charts on theme change
     */
    onThemeChange() {
        try {
            Object.values(this.charts).forEach(chart => {
                if (chart) {
                    // Update chart colors
                    chart.options.plugins.legend.labels.color = this.getTextColor();
                    chart.options.scales.y.grid.color = this.getGridColor();
                    chart.options.scales.y.ticks.color = this.getTextColor();
                    chart.options.scales.x.ticks.color = this.getTextColor();
                    chart.update();
                }
            });
        } catch (error) {
            console.error('Failed to update chart theme:', error);
        }
    }

    /**
     * Initialize Processing Time Chart (Analytics page)
     */
    async initProcessingTimeChart() {
        const canvas = document.getElementById('processingTimeChart');
        if (!canvas) return;

        try {
            const metricsData = await window.apiClient.getMetrics();
            
            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['0-1s', '1-5s', '5-10s', '10-30s', '30-60s', '60s+'],
                    datasets: [{
                        label: 'Processing Time Distribution',
                        data: [45, 32, 18, 8, 4, 2],
                        borderColor: 'var(--primary)',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'var(--primary)',
                        pointBorderColor: 'var(--card-bg)',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: this.getTextColor(),
                                font: { size: 12 },
                            },
                        },
                        tooltip: {
                            backgroundColor: 'var(--card-bg)',
                            titleColor: this.getTextColor(),
                            bodyColor: this.getTextColor(),
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: this.getGridColor() },
                            ticks: { color: this.getTextColor() },
                        },
                        x: {
                            ticks: { color: this.getTextColor() },
                        },
                    },
                },
            });

            this.charts.processingTimeChart = chart;
        } catch (error) {
            console.error('Failed to initialize processing time chart:', error);
            this.showChartError(canvas, 'Failed to load chart');
        }
    }

    /**
     * Initialize Success vs Failure Chart (Analytics page)
     */
    async initSuccessFailureChart() {
        const canvas = document.getElementById('successFailureChart');
        if (!canvas) return;

        try {
            const metricsData = await window.apiClient.getMetrics();
            const successRate = 85; // Placeholder
            const failureRate = 15; // Placeholder

            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Successful', 'Failed'],
                    datasets: [{
                        data: [successRate, failureRate],
                        backgroundColor: [
                            'var(--success)',
                            'var(--danger)',
                        ],
                        borderColor: 'var(--card-bg)',
                        borderWidth: 2,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: this.getTextColor(),
                                font: { size: 12 },
                                padding: 15,
                            },
                        },
                        tooltip: {
                            backgroundColor: 'var(--card-bg)',
                            titleColor: this.getTextColor(),
                            bodyColor: this.getTextColor(),
                        },
                    },
                },
            });

            this.charts.successFailureChart = chart;
        } catch (error) {
            console.error('Failed to initialize success/failure chart:', error);
            this.showChartError(canvas, 'Failed to load chart');
        }
    }
}

// Initialize charts when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chartsManager = new ChartsManager();
        window.chartsManager.initCharts();
    });
} else {
    window.chartsManager = new ChartsManager();
    window.chartsManager.initCharts();
}
