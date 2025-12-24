document.addEventListener('DOMContentLoaded', () => {
    
    // --- Element Mapping ---
    const tabButtons = document.querySelectorAll('.settings-tabs .tab-item');
    const tabPanes = document.querySelectorAll('.settings-content .tab-pane');
    const rbacUserSelect = document.getElementById('manage-user-select');
    const rbacSaveBtn = document.getElementById('save-rbac-btn');
    const updateProfileBtn = document.getElementById('update-profile-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    
    // --- INITIALIZATION ---
    loadCurrentUserProfile();
    
    // Store user_id in localStorage for delete functionality
    const userIdElement = document.querySelector('.settings-container[data-user-id]');
    if (userIdElement) {
        const userId = userIdElement.getAttribute('data-user-id');
        localStorage.setItem('user_id', userId);
        console.log('[INIT] Stored user_id:', userId);
    }
    
    // --- EVENT LISTENERS ---
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabSwitch);
    });
    
    rbacUserSelect.addEventListener('change', loadUserPermissionsForEditing);
    rbacSaveBtn.addEventListener('click', saveRBACPermissions);
    updateProfileBtn.addEventListener('click', redirectToProfile);
    deleteAccountBtn.addEventListener('click', confirmAccountDeletion);
    
    // Language change handler
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', handleLanguageChange);
    }


    // --- 1. TAB SWITCHING LOGIC ---
    function handleTabSwitch(e) {
        const targetTabId = e.currentTarget.dataset.tab;

        // Deactivate all
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // Activate selected tab and pane
        e.currentTarget.classList.add('active');
        document.getElementById(`pane-${targetTabId}`).classList.add('active');
        
        // If switching to Security, load the default user data
        if (targetTabId === 'security') {
            loadUserPermissionsForEditing();
        }
    }
    
    // --- 2. GENERAL PROFILE LOADING ---
    function loadCurrentUserProfile() {
        // Read actual user email from template (already rendered by Flask)
        const userEmail = document.getElementById('user-email').textContent;
        const userRole = document.getElementById('current-role')?.textContent || "Project Manager";
        
        // Log the loaded profile data for debugging
        console.log('[PROFILE] Loaded user email:', userEmail);
        console.log('[PROFILE] Loaded user role:', userRole);
        // Profile data is already displayed in the template, no need to overwrite
    }

    // --- 3. RBAC MANAGEMENT (FR-201, Admin Sequence Diagram) ---
    function loadUserPermissionsForEditing() {
        const selectedUserId = rbacUserSelect.value;
        console.log(`[RBAC] Loading permissions for User ID: ${selectedUserId}`);
        
        // --- SIMULATION: Fetch current user's permissions ---
        // In reality, this would be a secure GET call to /api/v1/users/{user_id}/permissions
        
        const mockUserPermissions = {
            '1': { role: 'Team Member', can_manage_budget: false, can_create_project: true },
            '2': { role: 'Project Manager', can_manage_budget: true, can_create_project: false }
        };
        
        const data = mockUserPermissions[selectedUserId];
        document.getElementById('current-role').textContent = data.role;
        
        // Set toggle states based on fetched data
        document.querySelector('input[data-permission="manage_budget"]').checked = data.can_manage_budget;
        document.querySelector('input[data-permission="create_project"]').checked = data.can_create_project;
    }
    
    function saveRBACPermissions() {
        const selectedUserId = rbacUserSelect.value;
        const manageBudgetStatus = document.querySelector('input[data-permission="manage_budget"]').checked;
        const createProjectStatus = document.querySelector('input[data-permission="create_project"]').checked;
        
        const payload = {
            userId: selectedUserId,
            permissions: {
                manage_budget: manageBudgetStatus,
                create_project: createProjectStatus
            }
        };
        
        console.log("[RBAC] Attempting to save new permissions:", payload);
        
        // --- REAL API CALL Placeholder (PUT to /api/v1/users/{id}/permissions) ---
        // This simulates the critical step in the Administrator Sequence Diagram.
        
        // alert() is used here as a placeholder for a non-blocking toast/message box
        alert(`Permissions saved for User ${selectedUserId}. (API call simulated)`);
    }


    // --- 4. INTEGRATION & DELETE LOGIC ---
    function redirectToProfile() {
        // Redirect to profile page
        window.location.href = '/profile';
    }

    function confirmAccountDeletion() {
        // Redirect to profile page (same as update profile button)
        window.location.href = '/profile';
    }
    
    document.querySelectorAll('.disconnect-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const integration = e.currentTarget.dataset.integration;
            alert(`Disconnecting from ${integration.toUpperCase()}... (API call to Integration Service)`);
            // API call to /api/v1/integration/{type}/disconnect
        });
    });
    
    // --- 5. LANGUAGE CHANGE HANDLER ---
    function handleLanguageChange(event) {
        const selectedLanguage = event.target.value;
        console.log('[LANGUAGE] Changing language to:', selectedLanguage);
        
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
                console.log('[LANGUAGE] Language changed successfully to:', selectedLanguage);
                // Reload the page to apply new language
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                alert('Failed to change language: ' + data.error);
            }
        })
        .catch(error => {
            console.error('[LANGUAGE] Error changing language:', error);
            alert('Error changing language');
        });
    }

});