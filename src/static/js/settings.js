document.addEventListener('DOMContentLoaded', () => {
    
    // --- Element Mapping ---
    const tabButtons = document.querySelectorAll('.settings-tabs .tab-item');
    const tabPanes = document.querySelectorAll('.settings-content .tab-pane');
    const rbacUserSelect = document.getElementById('manage-user-select');
    const rbacSaveBtn = document.getElementById('save-rbac-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    
    // --- INITIALIZATION ---
    loadCurrentUserProfile();
    
    // --- EVENT LISTENERS ---
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabSwitch);
    });
    
    rbacUserSelect.addEventListener('change', loadUserPermissionsForEditing);
    rbacSaveBtn.addEventListener('click', saveRBACPermissions);
    deleteAccountBtn.addEventListener('click', confirmAccountDeletion);


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
        // --- SIMULATION of API GET /api/v1/users/profile/{user_id} ---
        
        const mockProfile = {
            email: "jana.ahmed@aipms.com",
            role: "Project Manager",
            permissions: ["manage_budget", "create_project", "view_reports"]
        };
        
        document.getElementById('user-email').textContent = mockProfile.email;
        // This simulates loading initial profile data
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
    function confirmAccountDeletion() {
        // Replace with custom modal confirmation UI (as required by rules)
        if (confirm("WARNING: Are you sure you want to permanently delete your account? This action is irreversible.")) {
            console.log("[ACCOUNT] Deleting account...");
            // API call to /api/v1/users/delete
        }
    }
    
    document.querySelectorAll('.disconnect-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const integration = e.currentTarget.dataset.integration;
            alert(`Disconnecting from ${integration.toUpperCase()}... (API call to Integration Service)`);
            // API call to /api/v1/integration/{type}/disconnect
        });
    });

});