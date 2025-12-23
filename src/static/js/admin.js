// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    // Tab Navigation
    setupTabNavigation();
    
    // Modal Setup
    setupModals();
    
    // Button Events
    setupButtonEvents();
    
    // Load Data
    loadRoles();
    loadPermissions();
    loadAccessMatrix();
    loadUserRoles();
    loadAuditLog();
}

// ============== TAB NAVIGATION ==============
function setupTabNavigation() {
    const tabItems = document.querySelectorAll('.admin-tab-item');
    
    tabItems.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Remove active class from all tabs and panes
    document.querySelectorAll('.admin-tab-item').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Add active class to selected tab and pane
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`pane-${tabName}`).classList.add('active');
}

// ============== MODAL SETUP ==============
function setupModals() {
    // Role Modal
    const roleModal = document.getElementById('role-modal');
    const roleForm = document.getElementById('role-form');
    const roleCloseButtons = roleModal.querySelectorAll('.modal-close, .modal-close-btn');
    
    roleCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => closeModal('role-modal'));
    });
    
    roleForm.addEventListener('submit', handleRoleFormSubmit);
    
    // Permission Modal
    const permissionModal = document.getElementById('permission-modal');
    const permissionForm = document.getElementById('permission-form');
    const permissionCloseButtons = permissionModal.querySelectorAll('.modal-close, .modal-close-btn');
    
    permissionCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => closeModal('permission-modal'));
    });
    
    permissionForm.addEventListener('submit', handlePermissionFormSubmit);
    
    // Close modal on outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============== BUTTON EVENTS ==============
function setupButtonEvents() {
    // Add Role
    document.getElementById('add-role-btn').addEventListener('click', () => {
        document.getElementById('role-form').reset();
        document.getElementById('role-modal-title').textContent = 'Add New Role';
        document.getElementById('role-form').dataset.mode = 'add';
        openModal('role-modal');
    });
    
    // Add Permission
    document.getElementById('add-permission-btn').addEventListener('click', () => {
        document.getElementById('permission-form').reset();
        document.getElementById('permission-modal-title').textContent = 'Add New Permission';
        document.getElementById('permission-form').dataset.mode = 'add';
        openModal('permission-modal');
    });
    
    // Search functionality
    document.getElementById('page-search').addEventListener('input', handlePageSearch);
    document.getElementById('user-search').addEventListener('input', handleUserSearch);
    document.getElementById('role-filter').addEventListener('change', handleRoleFilter);
}

// ============== ROLE MANAGEMENT ==============
function loadRoles() {
    fetch('/api/admin/roles')
        .then(response => response.json())
        .then(data => {
            displayRoles(data.roles || []);
            populateRoleSelector(data.roles || []);
        })
        .catch(error => {
            console.error('Error loading roles:', error);
            document.getElementById('roles-list').innerHTML = '<p class="loading-text">Error loading roles</p>';
        });
}

function displayRoles(roles) {
    const rolesList = document.getElementById('roles-list');
    
    if (roles.length === 0) {
        rolesList.innerHTML = '<p class="loading-text">No roles found</p>';
        return;
    }
    
    rolesList.innerHTML = roles.map(role => `
        <div class="role-card">
            <div class="card-header">
                <div class="card-title">${role.role_name}</div>
            </div>
            <div class="card-description">${role.description || 'No description'}</div>
            <div class="card-actions">
                <button class="btn btn-sm btn-secondary" onclick="editRole(${role.role_id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteRole(${role.role_id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function editRole(roleId) {
    fetch(`/api/admin/roles/${roleId}`)
        .then(response => response.json())
        .then(role => {
            document.getElementById('role-name').value = role.role_name;
            document.getElementById('role-description').value = role.description || '';
            document.getElementById('role-modal-title').textContent = 'Edit Role';
            document.getElementById('role-form').dataset.mode = 'edit';
            document.getElementById('role-form').dataset.roleId = roleId;
            openModal('role-modal');
        })
        .catch(error => console.error('Error loading role:', error));
}

function handleRoleFormSubmit(e) {
    e.preventDefault();
    
    const roleName = document.getElementById('role-name').value.trim();
    const roleDescription = document.getElementById('role-description').value.trim();
    const mode = this.dataset.mode || 'add';
    const roleId = this.dataset.roleId;
    
    const payload = {
        role_name: roleName,
        description: roleDescription
    };
    
    const url = mode === 'edit' ? `/api/admin/roles/${roleId}` : '/api/admin/roles';
    const method = mode === 'edit' ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal('role-modal');
            loadRoles();
            loadAccessMatrix();
            showNotification('Role saved successfully', 'success');
        } else {
            showNotification(data.message || 'Error saving role', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error saving role', 'error');
    });
}

function deleteRole(roleId) {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
        return;
    }
    
    fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadRoles();
            loadAccessMatrix();
            showNotification('Role deleted successfully', 'success');
        } else {
            showNotification(data.message || 'Error deleting role', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error deleting role', 'error');
    });
}

function populateRoleSelector(roles) {
    const roleFilter = document.getElementById('role-filter');
    roleFilter.innerHTML = '<option value="">All Roles</option>';
    roles.forEach(role => {
        roleFilter.innerHTML += `<option value="${role.role_id}">${role.role_name}</option>`;
    });
}

// ============== PERMISSION MANAGEMENT ==============
function loadPermissions() {
    fetch('/api/admin/permissions')
        .then(response => response.json())
        .then(data => {
            displayPermissions(data.permissions || []);
        })
        .catch(error => {
            console.error('Error loading permissions:', error);
            document.getElementById('permissions-list').innerHTML = '<p class="loading-text">Error loading permissions</p>';
        });
}

function displayPermissions(permissions) {
    const permissionsList = document.getElementById('permissions-list');
    
    if (permissions.length === 0) {
        permissionsList.innerHTML = '<p class="loading-text">No permissions found</p>';
        return;
    }
    
    permissionsList.innerHTML = permissions.map(permission => `
        <div class="permission-card">
            <div class="card-header">
                <div class="card-title">${permission.permission_name}</div>
            </div>
            <div class="card-description">${permission.description || 'No description'}</div>
            <div class="card-actions">
                <button class="btn btn-sm btn-secondary" onclick="editPermission(${permission.permission_id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePermission(${permission.permission_id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function editPermission(permissionId) {
    fetch(`/api/admin/permissions/${permissionId}`)
        .then(response => response.json())
        .then(permission => {
            document.getElementById('permission-name').value = permission.permission_name;
            document.getElementById('permission-description').value = permission.description || '';
            document.getElementById('permission-modal-title').textContent = 'Edit Permission';
            document.getElementById('permission-form').dataset.mode = 'edit';
            document.getElementById('permission-form').dataset.permissionId = permissionId;
            openModal('permission-modal');
        })
        .catch(error => console.error('Error loading permission:', error));
}

function handlePermissionFormSubmit(e) {
    e.preventDefault();
    
    const permissionName = document.getElementById('permission-name').value.trim();
    const permissionDescription = document.getElementById('permission-description').value.trim();
    const mode = this.dataset.mode || 'add';
    const permissionId = this.dataset.permissionId;
    
    const payload = {
        permission_name: permissionName,
        description: permissionDescription
    };
    
    const url = mode === 'edit' ? `/api/admin/permissions/${permissionId}` : '/api/admin/permissions';
    const method = mode === 'edit' ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal('permission-modal');
            loadPermissions();
            showNotification('Permission saved successfully', 'success');
        } else {
            showNotification(data.message || 'Error saving permission', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error saving permission', 'error');
    });
}

function deletePermission(permissionId) {
    if (!confirm('Are you sure you want to delete this permission?')) {
        return;
    }
    
    fetch(`/api/admin/permissions/${permissionId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadPermissions();
            showNotification('Permission deleted successfully', 'success');
        } else {
            showNotification(data.message || 'Error deleting permission', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error deleting permission', 'error');
    });
}

// ============== ACCESS CONTROL ==============
function loadAccessMatrix() {
    fetch('/api/admin/access-control')
        .then(response => response.json())
        .then(data => {
            displayAccessMatrix(data.roles || [], data.resources || []);
        })
        .catch(error => {
            console.error('Error loading access control:', error);
            document.getElementById('access-matrix-body').innerHTML = '<p class="loading-text">Error loading access control</p>';
        });
}

function displayAccessMatrix(roles, resources) {
    const matrixBody = document.getElementById('access-matrix-body');
    
    if (roles.length === 0) {
        matrixBody.innerHTML = '<p class="loading-text">No roles found</p>';
        return;
    }
    
    matrixBody.innerHTML = roles.map(role => `
        <div class="matrix-row">
            <div class="matrix-cell-role">${role.role_name}</div>
            ${resources.map(resource => `
                <div class="matrix-cell">
                    <input type="checkbox" class="access-checkbox" 
                           data-role-id="${role.role_id}" 
                           data-resource="${resource}"
                           ${role.access && role.access[resource] ? 'checked' : ''}
                           onchange="updateAccessControl(${role.role_id}, '${resource}', this.checked)">
                </div>
            `).join('')}
        </div>
    `).join('');
}

function updateAccessControl(roleId, resource, hasAccess) {
    fetch(`/api/admin/access-control/${roleId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            resource: resource,
            access: hasAccess
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            showNotification('Error updating access control', 'error');
            loadAccessMatrix();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating access control', 'error');
        loadAccessMatrix();
    });
}

// ============== USER ROLES ==============
function loadUserRoles() {
    fetch('/api/admin/user-roles')
        .then(response => response.json())
        .then(data => {
            displayUserRoles(data.users || []);
        })
        .catch(error => {
            console.error('Error loading user roles:', error);
            document.getElementById('user-roles-list').innerHTML = '<p class="loading-text">Error loading user roles</p>';
        });
}

function displayUserRoles(users) {
    const userRolesList = document.getElementById('user-roles-list');
    
    if (users.length === 0) {
        userRolesList.innerHTML = '<p class="loading-text">No users found</p>';
        return;
    }
    
    userRolesList.innerHTML = users.map(user => `
        <div class="user-role-item">
            <div class="user-info">
                <div class="user-name">${user.username}</div>
                <div class="user-email">${user.email}</div>
            </div>
            <select class="role-selector" onchange="updateUserRole(${user.user_id}, this.value)">
                <option value="">Select Role</option>
                ${user.available_roles.map(role => `
                    <option value="${role.role_id}" ${user.current_role_id === role.role_id ? 'selected' : ''}>
                        ${role.role_name}
                    </option>
                `).join('')}
            </select>
        </div>
    `).join('');
}

function updateUserRole(userId, roleId) {
    if (!roleId) {
        showNotification('Please select a role', 'warning');
        return;
    }
    
    fetch(`/api/admin/user-roles/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            role_id: parseInt(roleId)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('User role updated successfully', 'success');
            loadUserRoles();
            loadAuditLog();
        } else {
            showNotification(data.message || 'Error updating user role', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error updating user role', 'error');
    });
}

// ============== AUDIT LOG ==============
function loadAuditLog() {
    fetch('/api/admin/audit-log')
        .then(response => response.json())
        .then(data => {
            displayAuditLog(data.logs || []);
        })
        .catch(error => {
            console.error('Error loading audit log:', error);
            document.getElementById('audit-log-list').innerHTML = '<p class="loading-text">Error loading audit log</p>';
        });
}

function displayAuditLog(logs) {
    const auditList = document.getElementById('audit-log-list');
    
    if (logs.length === 0) {
        auditList.innerHTML = '<p class="loading-text">No audit logs found</p>';
        return;
    }
    
    auditList.innerHTML = logs.map(log => `
        <div class="audit-log-item">
            <div class="audit-header">
                <span class="audit-action">${log.action}</span>
                <span class="audit-timestamp">${formatDate(log.timestamp)}</span>
            </div>
            <div class="audit-details">${log.details || ''}</div>
            <div class="audit-user">Admin: ${log.admin_name}</div>
        </div>
    `).join('');
}

// ============== SEARCH & FILTERS ==============
function handlePageSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const activePane = document.querySelector('.admin-pane.active');
    const items = activePane.querySelectorAll('[class$="-card"]');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function handleUserSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const userItems = document.querySelectorAll('.user-role-item');
    
    userItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function handleRoleFilter(e) {
    const roleId = e.target.value;
    const userItems = document.querySelectorAll('.user-role-item');
    
    userItems.forEach(item => {
        if (!roleId) {
            item.style.display = '';
        } else {
            const roleSelect = item.querySelector('.role-selector');
            item.style.display = roleSelect.value === roleId ? '' : 'none';
        }
    });
}

// ============== UTILITIES ==============
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
