/**
 * Theme Management
 * Handles light/dark mode toggle with localStorage persistence
 */

class ThemeManager {
    constructor() {
        this.storageKey = 'dashboard-theme';
        this.darkClass = 'dark';
        this.init();
    }

    init() {
        // Load saved theme or default to light
        const savedTheme = this.getSavedTheme();
        this.setTheme(savedTheme);

        // Bind theme toggle button
        this.setupThemeToggle();

        // Listen for system theme changes
        this.listenToSystemTheme();
    }

    getSavedTheme() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return saved;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    setTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem(this.storageKey, 'dark');
        } else {
            html.removeAttribute('data-theme');
            localStorage.setItem(this.storageKey, 'light');
        }

        this.updateThemeToggleState(theme);
    }

    toggle() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        }
    }

    updateThemeToggleState(theme) {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.setAttribute('data-theme', theme);
        }
    }

    listenToSystemTheme() {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only update if user hasn't manually set a preference
                if (!localStorage.getItem(this.storageKey)) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}
