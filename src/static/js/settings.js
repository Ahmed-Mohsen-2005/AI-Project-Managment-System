/**
 * AIPMS Settings Page - Complete Functionality (FIXED DARK MODE)
 * Handles all settings management, dark mode, integrations, and user preferences
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==================== INITIALIZATION ====================
    
    // Initialize theme on page load
    initializeTheme();
    
    // Store user_id in localStorage
    const userIdElement = document.querySelector('.settings-container[data-user-id]');
    if (userIdElement) {
        const userId = userIdElement.getAttribute('data-user-id');
        localStorage.setItem('user_id', userId);
        console.log('[INIT] Stored user_id:', userId);
    }
    
    // Load current user profile
    loadCurrentUserProfile();
    
    // ==================== ELEMENT REFERENCES ====================
    
    const tabButtons = document.querySelectorAll('.settings-tabs .tab-item');
    const tabPanes = document.querySelectorAll('.settings-content .tab-pane');
    
    // Buttons
    const updateProfileBtn = document.getElementById('update-profile-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const disconnectBtns = document.querySelectorAll('.disconnect-btn');
    const connectBtns = document.querySelectorAll('.connect-btn');
    const exportAuditBtn = document.getElementById('export-audit-log-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Other elements
    const languageSelect = document.getElementById('language-select');
    const pageSearch = document.getElementById('page-search');
    const toggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
    
    // Modal elements
    const confirmModal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm');
    const modalCancelBtn = document.getElementById('modal-cancel');
    const modalClose = document.querySelector('.modal-close');
    
    // Toast notification
    const toastNotification = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    
    // ==================== EVENT LISTENERS ====================
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabSwitch);
    });
    
    // Button actions
    updateProfileBtn?.addEventListener('click', handleUpdateProfile);
    deleteAccountBtn?.addEventListener('click', handleDeleteAccount);
    exportAuditBtn?.addEventListener('click', handleExportAuditLog);
    themeToggleBtn?.addEventListener('click', toggleTheme);
    
    // Integration buttons
    disconnectBtns.forEach(btn => {
        btn.addEventListener('click', handleIntegrationDisconnect);
    });
    
    connectBtns.forEach(btn => {
        btn.addEventListener('click', handleIntegrationConnect);
    });
    
    // Language change
    languageSelect?.addEventListener('change', handleLanguageChange);
    
    // Toggle switches (AI features)
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', handleToggleSetting);
    });
    
    // Search functionality
    pageSearch?.addEventListener('input', handleSearch);
    
    // Modal controls
    modalConfirmBtn?.addEventListener('click', executeModalAction);
    modalCancelBtn?.addEventListener('click', closeModal);
    modalClose?.addEventListener('click', closeModal);
    confirmModal?.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeModal();
    });
    
    // ==================== THEME MANAGEMENT ====================
    
    function initializeTheme() {
        console.log('[THEME] Initializing theme...');
        
        // Get saved theme from localStorage or use system preference
        let savedTheme = localStorage.getItem('theme-preference');
        console.log('[THEME] Saved preference:', savedTheme);
        
        if (!savedTheme) {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            savedTheme = prefersDark ? 'dark' : 'light';
            console.log('[THEME] System preference:', savedTheme);
        }
        
        applyTheme(savedTheme);
    }
    
    function toggleTheme() {
        console.log('[THEME] Toggle button clicked');
        
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log('[THEME] Current:', currentTheme, '→ New:', newTheme);
        
        applyTheme(newTheme);
    }
    
    function applyTheme(theme) {
        console.log('[THEME] Applying theme:', theme);
        
        const html = document.documentElement;
        const toggleBtn = document.getElementById('theme-toggle');
        const toggleText = toggleBtn?.querySelector('.toggle-text');
        const toggleIcon = toggleBtn?.querySelector('i');
        
        // Set theme on HTML element
        html.setAttribute('data-theme', theme);
        console.log('[THEME] Set data-theme attribute to:', theme);
        
        // Save preference
        localStorage.setItem('theme-preference', theme);
        console.log('[THEME] Saved to localStorage:', theme);
        
        // Update button appearance
        if (toggleBtn) {
            if (theme === 'dark') {
                console.log('[THEME] Switching to dark mode button appearance');
                toggleIcon?.classList.remove('fa-moon');
                toggleIcon?.classList.add('fa-sun');
                if (toggleText) toggleText.textContent = 'Light Mode';
            } else {
                console.log('[THEME] Switching to light mode button appearance');
                toggleIcon?.classList.remove('fa-sun');
                toggleIcon?.classList.add('fa-moon');
                if (toggleText) toggleText.textContent = 'Dark Mode';
            }
        }
        
        console.log('[THEME] Theme successfully applied:', theme);
    }
    
    // ==================== TAB MANAGEMENT ====================
    
    function handleTabSwitch(e) {
        const targetTabId = e.currentTarget.dataset.tab;
        
        // Deactivate all tabs and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Activate selected tab and pane
        e.currentTarget.classList.add('active');
        const targetPane = document.getElementById(`pane-${targetTabId}`);
        if (targetPane) {
            targetPane.classList.add('active');
        }
        
        console.log('[TAB] Switched to:', targetTabId);
    }
    
    // ==================== PROFILE MANAGEMENT ====================
    
    function loadCurrentUserProfile() {
        const userEmail = document.getElementById('user-email')?.textContent;
        const userRole = document.getElementById('current-role')?.textContent;
        
        console.log('[PROFILE] User Email:', userEmail);
        console.log('[PROFILE] User Role:', userRole);
    }
    
    function handleUpdateProfile() {
        showModal(
            'Update Profile',
            'You will be redirected to your profile page to make updates.',
            () => {
                window.location.href = '/profile';
            }
        );
    }
    
    // ==================== ACCOUNT MANAGEMENT ====================
    
    function handleDeleteAccount() {
        showModal(
            'Delete Account',
            'WARNING: This action cannot be undone. Your account and all associated data will be permanently deleted. Are you sure?',
            () => {
                console.log('[ACCOUNT] Deleting account...');
                
                const userId = localStorage.getItem('user_id');
                
                fetch(`/api/v1/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => {
                    if (response.ok) {
                        showToast('Account deleted successfully. Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = '/logout';
                        }, 2000);
                    } else {
                        showToast('Error deleting account. Please try again.', 'error');
                    }
                })
                .catch(error => {
                    console.error('[ACCOUNT] Delete error:', error);
                    showToast('Error deleting account.', 'error');
                });
            },
            'danger'
        );
    }
    
    // ==================== LANGUAGE MANAGEMENT ====================
    
    function handleLanguageChange(event) {
        const selectedLanguage = event.target.value;
        console.log('[LANGUAGE] Changing to:', selectedLanguage);
        
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
                console.log('[LANGUAGE] Changed successfully');
                showToast(`Language changed to ${selectedLanguage}`, 'success');
                
                // Reload page after 1 second
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast('Failed to change language: ' + (data.error || 'Unknown error'), 'error');
                // Reset dropdown
                languageSelect.value = localStorage.getItem('current_language') || 'en';
            }
        })
        .catch(error => {
            console.error('[LANGUAGE] Error:', error);
            showToast('Error changing language', 'error');
        });
    }
    
    // ==================== INTEGRATION MANAGEMENT ====================
    
    function handleIntegrationDisconnect(e) {
        const integration = e.currentTarget.dataset.integration;
        const integrationName = {
            'github': 'GitHub',
            'slack': 'Slack',
            'gdrive': 'Google Drive'
        }[integration] || integration;
        
        showModal(
            `Disconnect ${integrationName}`,
            `Are you sure you want to disconnect from ${integrationName}?`,
            () => {
                console.log('[INTEGRATION] Disconnecting:', integration);
                
                fetch(`/api/v1/integrations/${integration}/disconnect`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showToast(`Disconnected from ${integrationName}`, 'success');
                        // Reload to update UI
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        showToast('Failed to disconnect. Please try again.', 'error');
                    }
                })
                .catch(error => {
                    console.error('[INTEGRATION] Disconnect error:', error);
                    showToast('Error disconnecting integration', 'error');
                });
            }
        );
    }
    
    function handleIntegrationConnect(e) {
        const integration = e.currentTarget.dataset.integration;
        const integrationName = {
            'github': 'GitHub',
            'slack': 'Slack',
            'gdrive': 'Google Drive'
        }[integration] || integration;
        
        console.log('[INTEGRATION] Connecting:', integration);
        
        // In production, redirect to OAuth endpoint
        const oauthEndpoints = {
            'github': '/api/v1/integrations/github/oauth',
            'slack': '/api/v1/integrations/slack/oauth',
            'gdrive': '/api/v1/integrations/gdrive/oauth'
        };
        
        const endpoint = oauthEndpoints[integration];
        if (endpoint) {
            window.location.href = endpoint;
        } else {
            showToast(`Integration endpoint not found for ${integrationName}`, 'error');
        }
    }
    
    // ==================== AI GOVERNANCE ====================
    
    function handleToggleSetting(e) {
        const setting = e.currentTarget.dataset.setting;
        const isEnabled = e.currentTarget.checked;
        
        console.log('[AI_SETTINGS] Toggling:', setting, '=', isEnabled);
        
        fetch('/api/v1/settings/ai-features', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                [setting]: isEnabled
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const message = isEnabled ? 'enabled' : 'disabled';
                showToast(`${setting.replace(/_/g, ' ')} ${message}`, 'success');
            } else {
                // Revert toggle if API fails
                e.currentTarget.checked = !isEnabled;
                showToast('Failed to update setting. Please try again.', 'error');
            }
        })
        .catch(error => {
            console.error('[AI_SETTINGS] Error:', error);
            // Revert toggle
            e.currentTarget.checked = !isEnabled;
            showToast('Error updating setting', 'error');
        });
    }
    
    function handleExportAuditLog() {
        console.log('[AUDIT] Exporting audit log...');
        
        showToast('Generating audit log export...', 'info');
        
        fetch('/api/v1/settings/audit-log/export', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (response.ok) {
                // Create a blob and download
                return response.blob().then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                    showToast('Audit log exported successfully', 'success');
                });
            } else {
                showToast('Failed to export audit log', 'error');
            }
        })
        .catch(error => {
            console.error('[AUDIT] Export error:', error);
            showToast('Error exporting audit log', 'error');
        });
    }
    
    // ==================== SEARCH FUNCTIONALITY ====================
    
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('[SEARCH] Searching for:', searchTerm);
        
        if (!searchTerm) {
            // Show all sections
            document.querySelectorAll('.setting-section').forEach(section => {
                section.style.display = '';
            });
            return;
        }
        
        document.querySelectorAll('.setting-section').forEach(section => {
            const text = section.textContent.toLowerCase();
            section.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
    
    // ==================== MODAL & TOAST UTILITIES ====================
    
    let currentModalCallback = null;
    
    function showModal(title, message, callback, severity = 'warning') {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        currentModalCallback = callback;
        
        // Update button severity
        const confirmBtn = document.getElementById('modal-confirm');
        confirmBtn.classList.remove('btn-danger', 'btn-primary', 'btn-warning');
        if (severity === 'danger') {
            confirmBtn.classList.add('btn-danger');
        } else if (severity === 'warning') {
            confirmBtn.classList.add('btn-warning');
        } else {
            confirmBtn.classList.add('btn-primary');
        }
        
        confirmModal.style.display = 'flex';
    }
    
    function closeModal() {
        confirmModal.style.display = 'none';
        currentModalCallback = null;
    }
    
    function executeModalAction() {
        if (currentModalCallback) {
            currentModalCallback();
        }
        closeModal();
    }
    
    function showToast(message, type = 'info') {
        toastMessage.textContent = message;
        toastNotification.className = `toast toast-${type}`;
        toastNotification.style.display = 'flex';
        
        console.log(`[TOAST] ${type.toUpperCase()}: ${message}`);
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            toastNotification.style.display = 'none';
        }, 4000);
    }
    
    // ==================== KEYBOARD SHORTCUTS ====================
    
    document.addEventListener('keydown', (e) => {
        // Close modal with Escape
        if (e.key === 'Escape' && confirmModal.style.display !== 'none') {
            closeModal();
        }
        
        // Focus search with Ctrl+K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            pageSearch?.focus();
        }
    });
    
    console.log('[SETTINGS] Page initialized successfully');
});