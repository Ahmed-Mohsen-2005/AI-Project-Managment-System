document.addEventListener('DOMContentLoaded', () => {
    
    // --- Element Mapping ---
    const appContainer = document.getElementById('app-container');
    const boardsParent = document.getElementById('nav-boards-parent');
    const boardsToggle = document.getElementById('boards-toggle');
    const globalSearch = document.getElementById('global-search');
    const languageSelect = document.getElementById('header-language-select');
    
    // Notification Panel Elements
    const notificationBtn = document.getElementById('notification-btn');
    const notificationPanel = document.getElementById('notification-panel');
    const closeNotificationBtn = document.getElementById('close-notifications');
    
    // Logout Modal Elements
    const logoutButton = document.getElementById('logout-button');
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    
    // --- 0. LANGUAGE SWITCHER (Global) ---
    if (languageSelect) {
        languageSelect.addEventListener('change', handleLanguageChange);
    }
    
    function handleLanguageChange(e) {
        const selectedLanguage = e.target.value;
        console.log(`[LANGUAGE] Changing language to: ${selectedLanguage}`);
        
        // Send language preference to server
        fetch('/api/v1/settings/language', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ language: selectedLanguage })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`[LANGUAGE] Language changed to ${selectedLanguage}`);
                // Reload page to apply translations
                window.location.reload();
            } else {
                console.error('[LANGUAGE] Error changing language:', data.error);
                alert('Failed to change language: ' + data.error);
                // Reset select to previous value on error
                e.target.value = e.target.defaultValue;
            }
        })
        .catch(error => {
            console.error('[LANGUAGE] Error:', error);
            alert('Error changing language');
            // Reset select to previous value on error
            e.target.value = e.target.defaultValue;
        });
    }
    
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

    // Project Creation Modal Elements
    const addNewBtn = document.getElementById('add-new-btn');
    const projectModal = document.getElementById('create-project-modal');
    const closeProjectModalBtn = document.getElementById('close-project-modal');
    const cancelProjectBtn = document.getElementById('cancel-project-btn');
    const createProjectForm = document.getElementById('create-project-form');

    // Open Project Modal
    if (addNewBtn && projectModal) {
        addNewBtn.addEventListener('click', () => {
            projectModal.classList.remove('hidden');
            projectModal.style.display = 'flex';
            // Set default start date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('proj-start').value = today;
        });
    }

    // Close Project Modal
    if (closeProjectModalBtn && projectModal) {
        closeProjectModalBtn.addEventListener('click', () => {
            projectModal.classList.add('hidden');
            projectModal.style.display = 'none';
        });
    }

    if (cancelProjectBtn && projectModal) {
        cancelProjectBtn.addEventListener('click', () => {
            projectModal.classList.add('hidden');
            projectModal.style.display = 'none';
        });
    }

    // Close on outside click
    if (projectModal) {
        window.addEventListener('click', (e) => {
            if (e.target === projectModal) {
                projectModal.classList.add('hidden');
                projectModal.style.display = 'none';
            }
        });
    }

    // Handle Project Form Submission
    if (createProjectForm) {
        createProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('proj-name').value,
                description: document.getElementById('proj-desc').value,
                start_date: document.getElementById('proj-start').value,
                end_date: document.getElementById('proj-end').value || null,
                budget: parseFloat(document.getElementById('proj-budget').value) || 0
            };

            try {
                const response = await fetch('/api/v1/projects/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Project created successfully!');
                    projectModal.classList.add('hidden');
                    projectModal.style.display = 'none';
                    createProjectForm.reset();

                    // Reload page to show new project in selector
                    if (window.location.pathname.includes('/dashboard')) {
                        window.location.reload();
                    }
                } else {
                    alert(result.error || 'Failed to create project');
                }
            } catch (error) {
                console.error('Error creating project:', error);
                alert('Failed to create project. Please try again.');
            }
        });
    }

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