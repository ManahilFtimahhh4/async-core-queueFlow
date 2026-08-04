/**
 * Sidebar Management
 * Handles sidebar toggle and navigation
 */

class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.querySelector('.sidebar-toggle');
        this.navItems = document.querySelectorAll('.nav-item');
        this.init();
    }

    init() {
        this.setupToggle();
        this.setupNavigation();
        this.loadSavedState();
    }

    setupToggle() {
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.toggle();
            });
        }
    }

    setupNavigation() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get the page to show
                const pageId = item.getAttribute('data-page');
                if (pageId) {
                    this.navigateToPage(pageId, item);
                }
            });
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K for search focus
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    toggle() {
        this.sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', this.sidebar.classList.contains('collapsed'));
    }

    collapse() {
        this.sidebar.classList.add('collapsed');
        localStorage.setItem('sidebar-collapsed', 'true');
    }

    expand() {
        this.sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebar-collapsed', 'false');
    }

    navigateToPage(pageId, navItem) {
        // Update active nav item
        this.navItems.forEach(item => item.classList.remove('active'));
        navItem.classList.add('active');

        // Update page content
        const pages = document.querySelectorAll('.page-content');
        pages.forEach(page => page.classList.remove('active'));

        const activePage = document.getElementById(`page-${pageId}`);
        if (activePage) {
            activePage.classList.add('active');

            // Update page title
            const pageTitle = navItem.querySelector('.nav-label')?.textContent || 'Dashboard';
            const pageTitleElement = document.querySelector('.page-title');
            if (pageTitleElement) {
                pageTitleElement.textContent = pageTitle;
            }

            // Load page data if manager exists
            if (window.pageManager) {
                window.pageManager.loadPage(pageId);
            }
        }

        // Close sidebar on mobile when navigating
        if (window.innerWidth <= 768) {
            this.expand();
        }

        // Save current page
        localStorage.setItem('current-page', pageId);
    }

    loadSavedState() {
        // Load sidebar state
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        if (isCollapsed && window.innerWidth > 768) {
            this.sidebar.classList.add('collapsed');
        }

        // Load last visited page
        const lastPage = localStorage.getItem('current-page') || 'dashboard';
        const lastPageItem = Array.from(this.navItems).find(
            item => item.getAttribute('data-page') === lastPage
        );
        if (lastPageItem) {
            this.navigateToPage(lastPage, lastPageItem);
        }
    }
}

// Initialize sidebar manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.sidebarManager = new SidebarManager();
    });
} else {
    window.sidebarManager = new SidebarManager();
}

// Handle responsive behavior
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768) {
        // On larger screens, allow sidebar to be shown
        sidebar.classList.remove('collapsed');
    }
});
