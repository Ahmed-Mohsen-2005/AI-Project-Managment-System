document.addEventListener('DOMContentLoaded', () => {
    
    // --- Element Mapping ---
    const appContainer = document.getElementById('app-container');
    const boardsParent = document.getElementById('nav-boards-parent');
    const boardsToggle = document.getElementById('boards-toggle');
    const globalSearch = document.getElementById('global-search');
    
    // Notification Panel Elements
    const notificationBtn = document.getElementById('notification-btn');
    const notificationPanel = document.getElementById('notification-panel');
    const closeNotificationBtn = document.getElementById('close-notifications');
    
    // Logout Modal Elements
    const logoutButton = document.getElementById('logout-button');
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    
    // --- 1. Navigation & Toggle Logic ---
    
    // Global Sidebar Toggle (for responsive mode and desktop utility)
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        // Toggles mobile sidebar open class on the container
        appContainer.classList.toggle('sidebar-open');
        appContainer.classList.toggle('sidebar-collapsed'); // Toggle desktop collapsed state
        
        // Close notification panel if sidebar is opened over it (mobile UX fix)
        if (appContainer.classList.contains('sidebar-open') && notificationPanel && notificationPanel.classList.contains('open')) {
             notificationPanel.classList.remove('open');
        }
    });

    // Nested Boards Menu Toggle
    if (boardsToggle && boardsParent) {
        boardsToggle.addEventListener('click', () => {
            boardsParent.classList.toggle('open');
        });
    }

    // Active Navigation Link Styling & Initial Submenu State
    const currentPath = window.location.pathname.replace(/\/$/, ""); 
    document.querySelectorAll('.main-nav a.nav-item').forEach(item => {
        const itemPath = item.getAttribute('href').replace(/\/$/, "");
        
        // Match the current URL to the navigation item
        if (itemPath === currentPath) {
            item.classList.add('active');
            
            // If nested item is active, ensure its parent is open
            if (item.closest('.nav-item-parent')) {
                item.closest('.nav-item-parent').classList.add('open');
            }
        }
    });

    // --- 2. Notification Panel Logic (CRITICAL FIX FOR PAGES) ---
    // This handler ensures the notification button works on ALL pages by attaching
    // the listener only if the elements exist.
    if (notificationBtn && notificationPanel && closeNotificationBtn) {
        notificationBtn.addEventListener('click', () => {
            notificationPanel.classList.toggle('open');
            // Close sidebar if it's open on mobile for better UX
            if (appContainer.classList.contains('sidebar-open')) {
                appContainer.classList.remove('sidebar-open');
            }
        });
        
        closeNotificationBtn.addEventListener('click', () => {
            notificationPanel.classList.remove('open');
        });
    }
    
    // --- 3. Logout Modal Logic ---
    if (logoutButton && logoutModal) {
        // Open modal when logout button is clicked
        logoutButton.addEventListener('click', () => {
            logoutModal.classList.remove('hidden');
            logoutModal.style.display = 'flex'; // Make visible
            
            // Close notification panel if open
            if (notificationPanel && notificationPanel.classList.contains('open')) {
                 notificationPanel.classList.remove('open');
            }
        });

        // Close modal when cancel button is clicked
        cancelLogoutBtn.addEventListener('click', () => {
            logoutModal.classList.add('hidden');
            logoutModal.style.display = 'none';
        });

        // Close modal when clicking outside of it
        window.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.classList.add('hidden');
                logoutModal.style.display = 'none';
            }
        });
        
        // Final action: Confirm logout
        confirmLogoutBtn.addEventListener('click', () => {
            console.log("[LOGOUT] User confirmed logout. Executing session termination...");
            // Clear user session from localStorage
            localStorage.removeItem('currentUser');
            window.location.href = '/';
        });
    }

    // --- 4. Update Header Avatar with User Info ---
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const headerAvatar = document.querySelector('.user-profile-link .profile-avatar');

    if (currentUser && currentUser.name && headerAvatar) {
        const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
        headerAvatar.src = `https://placehold.co/36x36/3498db/FFFFFF?text=${initials}`;
        headerAvatar.alt = currentUser.name;
    }

    // --- 5. Global Action Handlers ---
    
    // Quick Add Button
    document.getElementById('add-new-btn').addEventListener('click', () => {
        console.log("Global 'Add New' clicked. Opening universal creation modal...");
    });

    // Global Search Utility (Ctrl+K)
    document.addEventListener('keydown', (e) => {
        // Check for Ctrl + K (or Cmd + K on Mac)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            globalSearch.focus();
            globalSearch.select();
        }
    });

    if (globalSearch) {
        globalSearch.addEventListener('input', () => {
            console.log(`Searching globally for: ${globalSearch.value}`);
        });
    }
    // --- 5. Dark Mode Logic ---

    // Select the toggle switch input (inside the .switch label)
    const themeToggleCheckbox = document.querySelector('.switch .input');
    
    // 1. Check Local Storage on Load
    // If the user previously selected 'dark', apply it immediately
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (themeToggleCheckbox) {
            themeToggleCheckbox.checked = true; // Make sure the toggle looks "on"
        }
    }

    // 2. Listen for Switch Changes
    if (themeToggleCheckbox) {
        themeToggleCheckbox.addEventListener('change', function(e) {
            if (e.target.checked) {
                // User turned ON dark mode
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                console.log("Theme switched to Dark");
            } else {
                // User turned OFF dark mode (back to light)
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                console.log("Theme switched to Light");
            }
        });
    }
});