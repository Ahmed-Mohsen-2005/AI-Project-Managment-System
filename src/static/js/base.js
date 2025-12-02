document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('sidebar-toggle');
    const body = document.body;
    
    const boardsToggle = document.getElementById('boards-toggle');
    const boardsParent = document.getElementById('nav-boards-parent');
    
    // --- 1. Sidebar Toggle Functionality (for responsiveness) ---
    if (sidebar && toggleButton) {
        toggleButton.addEventListener('click', () => {
            // Toggles the sidebar visibility/layout shift on larger screens
            sidebar.classList.toggle('collapsed');
            body.classList.toggle('sidebar-collapsed');
        });
    }

    // --- 2. Nested Menu Toggle Functionality (Boards Menu) ---
    if (boardsToggle && boardsParent) {
        boardsToggle.addEventListener('click', () => {
            boardsParent.classList.toggle('open');
            // The CSS handles the max-height transition based on the 'open' class
        });
    }

    // --- 3. Active Navigation Link Styling (Handles Nested Links) ---
    const currentPath = window.location.pathname.replace(/\/$/, ""); // Normalize path
    const navItems = document.querySelectorAll('.main-nav a.nav-item');
    
    navItems.forEach(item => {
        const itemPath = item.getAttribute('href').replace(/\/$/, "");
        
        // Check for exact path match
        if (itemPath === currentPath) {
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
            // In a production app, this would trigger an API call or open a modal.
            console.log("Add New button clicked. Opening quick creation modal...");
        });
    }

});