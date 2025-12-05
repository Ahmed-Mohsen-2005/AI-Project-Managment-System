document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('sidebar-toggle');
    const globalSearch = document.getElementById('global-search');
    
    const boardsToggle = document.getElementById('boards-toggle');
    const boardsParent = document.getElementById('nav-boards-parent');
    
    // Check if we are on a mobile device based on screen width
    const isMobile = () => window.innerWidth <= 768;

    // --- 1. Sidebar Toggle Functionality ---
    if (sidebar && toggleButton) {
        toggleButton.addEventListener('click', () => {
            if (isMobile()) {
                // Mobile: Toggle overlay state
                appContainer.classList.toggle('sidebar-open');
            } else {
                // Desktop: Toggle collapsed state (grid layout shift)
                appContainer.classList.toggle('sidebar-collapsed');
                // Ensure nested menu closes if collapsed on desktop
                if (appContainer.classList.contains('sidebar-collapsed') && boardsParent.classList.contains('open')) {
                    boardsParent.classList.remove('open');
                }
            }
        });

        // Close mobile overlay if clicking main content when open
        document.getElementById('main-content').addEventListener('click', () => {
             if (appContainer.classList.contains('sidebar-open')) {
                appContainer.classList.remove('sidebar-open');
             }
        });
    }

    // --- 2. Nested Menu Toggle Functionality (Boards Menu) ---
    if (boardsToggle && boardsParent) {
        boardsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            boardsParent.classList.toggle('open');
            // The CSS handles the max-height transition based on the 'open' class
        });

        // Close nested menu if clicking outside (on desktop)
        document.addEventListener('click', (e) => {
            if (!boardsParent.contains(e.target) && boardsParent.classList.contains('open') && !isMobile()) {
                boardsParent.classList.remove('open');
            }
        });
    }

    // --- 3. Active Navigation Link Styling ---
    const currentPath = window.location.pathname.replace(/\/$/, ""); // Normalize path
    const navItems = document.querySelectorAll('.main-nav a.nav-item');
    
    navItems.forEach(item => {
        const itemPath = item.getAttribute('href') ? item.getAttribute('href').replace(/\/$/, "") : null;
        
        if (itemPath && itemPath === currentPath) {
            item.classList.add('active');
            
            // If the active item is a submenu item, ensure its parent is open
            if (item.classList.contains('submenu-item')) {
                const parent = item.closest('.nav-item-parent');
                if (parent) {
                    parent.classList.add('open');
                }
            }
        }
    });

    // --- 4. Global Add New Button Handler ---
    const addNewBtn = document.getElementById('add-new-btn');
    if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
            console.log("Add New button clicked. Triggering quick creation modal...");
            // Add your modal/API logic here
        });
    }

    // --- 5. Keyboard Shortcut for Search ---
    if (globalSearch) {
        document.addEventListener('keydown', (e) => {
            // Check for Ctrl+K (or Cmd+K on Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                globalSearch.focus();
            }
        });
    }
});