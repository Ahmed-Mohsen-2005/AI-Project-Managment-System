/* ===== ADMIN PANEL - JAVASCRIPT FUNCTIONALITY ===== */

document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
});

const AdminPanel = {
    // API Endpoints
    api: {
        users: '/admin/api/users',
        userUpdate: (id) => `/admin/api/users/${id}`,
        userDelete: (id) => `/admin/api/users/${id}`,
        auditLog: '/admin/api/audit-log'
    },

    // State
    users: [],
    currentEditingUserId: null,
    currentDeletingUserId: null,

    // Initialize
    init() {
        this.attachEventListeners();
        this.loadUsers();
    },

    // Event Listeners
    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.admin-tab-btn')));
        });

        // Users Management
        document.getElementById('add-user-btn').addEventListener('click', () => this.showEditModal(null));
        document.getElementById('user-search').addEventListener('input', (e) => this.filterUsers(e.target.value));
        document.getElementById('role-filter').addEventListener('change', (e) => this.filterByRole(e.target.value));

        // Modal Controls
        document.getElementById('edit-user-form').addEventListener('submit', (e) => this.saveUser(e));
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });

        // Delete confirmation
        document.getElementById('confirm-delete-btn').addEventListener('click', () => this.confirmDelete());

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    },

    // Load Users from API
    loadUsers() {
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '<tr class="loading-row"><td colspan="5"><i class="fas fa-spinner fa-spin"></i> Loading users...</td></tr>';

        fetch(this.api.users)
            .then(res => res.json())
            .then(data => {
                this.users = data.users || [];
                this.renderUsersTable(this.users);
            })
            .catch(error => {
                console.error('Error loading users:', error);
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444;">Error loading users</td></tr>';
            });
    },

    // Render Users Table
    renderUsersTable(users) {
        const tableBody = document.getElementById('users-table-body');
        
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;"><i class="fas fa-inbox" style="font-size: 2rem; color: #cbd5e1;"></i><p style="margin-top: 10px; color: #64748b;">No users found</p></td></tr>';
            return;
        }

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td><strong>${this.escapeHtml(user.name)}</strong></td>
                <td>${this.escapeHtml(user.email)}</td>
                <td><span class="role-badge ${(user.role || '').toLowerCase()}">${user.role || 'N/A'}</span></td>
                <td>${this.escapeHtml(user.type || '-')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit" onclick="AdminPanel.showEditModal(${user.user_id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action delete" onclick="AdminPanel.showDeleteConfirm(${user.user_id}, '${this.escapeHtml(user.name)}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    // Show Edit Modal
    showEditModal(userId) {
        const modal = document.getElementById('edit-user-modal');
        const form = document.getElementById('edit-user-form');
        const title = document.getElementById('modal-title');

        // Reset password field for security
        document.getElementById('edit-user-password').value = '';

        if (userId) {
            // Edit mode
            const user = this.users.find(u => u.user_id === userId);
            if (user) {
                document.getElementById('edit-user-id').value = user.user_id;
                document.getElementById('edit-user-name').value = user.name;
                document.getElementById('edit-user-email').value = user.email;
                document.getElementById('edit-user-role').value = user.role || 'user';
                document.getElementById('edit-user-type').value = user.type || '';
                title.textContent = 'Edit User';
            }
        } else {
            // Add mode
            form.reset();
            document.getElementById('edit-user-id').value = '';
            title.textContent = 'Add New User';
        }

        modal.classList.add('show');
    },

    // Save User
    saveUser(e) {
        e.preventDefault();

        const userId = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value;
        const email = document.getElementById('edit-user-email').value;
        const role = document.getElementById('edit-user-role').value;
        const type = document.getElementById('edit-user-type').value;
        const password = document.getElementById('edit-user-password').value;

        if (!name || !email) {
            alert('Please fill in Name and Email');
            return;
        }

        // Require password for new users
        if (!userId && !password) {
            alert('Password is required for new users');
            return;
        }

        const data = { name, email, role, type, password };
        const method = userId ? 'PUT' : 'POST';
        const url = userId ? this.api.userUpdate(userId) : this.api.users;

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                alert(userId ? 'User updated successfully' : 'User added successfully');
                document.getElementById('edit-user-modal').classList.remove('show');
                this.loadUsers();
            } else {
                alert(response.message || 'Error saving user');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving user');
        });
    },

    // Show Delete Confirmation
    showDeleteConfirm(userId, userName) {
        this.currentDeletingUserId = userId;
        document.getElementById('delete-confirm-text').textContent = `Are you sure you want to delete "${userName}"? This action cannot be undone.`;
        document.getElementById('confirm-delete-modal').classList.add('show');
    },

    // Confirm Delete
    confirmDelete() {
        const userId = this.currentDeletingUserId;
        if (!userId) return;

        fetch(this.api.userDelete(userId), { method: 'DELETE' })
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    alert('User deleted successfully');
                    document.getElementById('confirm-delete-modal').classList.remove('show');
                    this.loadUsers();
                } else {
                    alert(response.message || 'Error deleting user');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error deleting user');
            });
    },

    // Filter Users by Name/Email
    filterUsers(searchTerm) {
        const filtered = this.users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderUsersTable(filtered);
    },

    // Filter by Role
    filterByRole(role) {
        const filtered = role ? this.users.filter(u => u.role === role) : this.users;
        this.renderUsersTable(filtered);
    },

    // Switch Tabs
    switchTab(tabBtn) {
        document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.admin-tab-pane').forEach(pane => pane.classList.remove('active'));

        tabBtn.classList.add('active');
        const tabId = tabBtn.dataset.tab;
        document.getElementById(`tab-${tabId}`).classList.add('active');
    },

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/';
        }
    },

    // Utility: Escape HTML
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return (text || '').replace(/[&<>"']/g, m => map[m]);
    }
};

function initializeAdmin() {
    AdminPanel.init();
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});