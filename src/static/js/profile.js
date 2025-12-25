document.addEventListener('DOMContentLoaded', () => {
    const skillsList = document.getElementById('skills-list');
    const newSkillInput = document.getElementById('new-skill-input');
    const skillLevelSelect = document.getElementById('skill-level-select');
    const addSkillBtn = document.getElementById('add-skill-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');

    // API Configuration
    const API_BASE_URL = '/api/v1/profile';

    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser || !currentUser.user_id) {
        console.error('No user logged in. Redirecting to login page.');
        window.location.href = '/';
        return;
    }

    const userId = currentUser.user_id;

    // --- INITIALIZATION ---
    loadProfileData();

    // Check if we should auto-open the edit modal (from settings page)
    if (localStorage.getItem('openEditModal') === 'true') {
        localStorage.removeItem('openEditModal');
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            handleEditProfile();
        }, 100);
    }

    // --- EVENT LISTENERS ---
    addSkillBtn.addEventListener('click', handleAddSkill);
    editProfileBtn.addEventListener('click', handleEditProfile);

    // --- 1. DATA LOADING ---
    async function loadProfileData() {
        try {
            const response = await fetch(`${API_BASE_URL}/${userId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Load Header Info
            document.getElementById('user-name').textContent = data.user.name;
            document.getElementById('user-role').textContent = data.user.role;
            document.getElementById('user-email').textContent = data.user.email;

            // Update avatar with user initials
            const avatarImg = document.querySelector('.profile-avatar-large');
            if (avatarImg && data.user.name) {
                const initials = data.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
                avatarImg.src = `https://placehold.co/80x80/4a90e2/ffffff?text=${initials}`;
            }

            // Load Stats
            document.getElementById('user-velocity').textContent = data.stats.velocity;
            document.getElementById('task-rejection').textContent = data.stats.rejectionRate;
            document.getElementById('risk-exposure').textContent = data.stats.riskExposure;
            document.getElementById('tasks-completed').textContent = data.stats.tasksCompleted;

            // Render Skills
            renderSkills(data.skills);

            // Render Activity Log
            renderActivityLog(data.activityLog);

        } catch (error) {
            console.error('Error loading profile data:', error);
            // If API fails, show basic info from localStorage
            document.getElementById('user-name').textContent = currentUser.name || 'User';
            document.getElementById('user-role').textContent = currentUser.role || 'Standard';
            document.getElementById('user-email').textContent = currentUser.email || '';
        }
    }

    // --- 2. SKILL RENDERING & MANAGEMENT (FR-301) ---
    function getLevelText(level) {
        if (level == 3) return 'Expert';
        if (level == 2) return 'Proficient';
        return 'Familiar';
    }

    function renderSkills(skills) {
        skillsList.innerHTML = '';

        if (!skills || skills.length === 0) {
            skillsList.innerHTML = '<span class="no-skills">No skills added yet. Add your first skill below!</span>';
            return;
        }

        skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.dataset.skillId = skill.skill_id;
            tag.innerHTML = `
                ${skill.name}
                <span class="skill-level-indicator">(${getLevelText(skill.level)})</span>
                <button class="skill-remove-btn" title="Remove skill">&times;</button>
            `;

            // Add remove functionality
            const removeBtn = tag.querySelector('.skill-remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleRemoveSkill(skill.skill_id, skill.name);
            });

            skillsList.appendChild(tag);
        });
    }

    async function handleAddSkill() {
        const skillName = newSkillInput.value.trim();
        const skillLevel = parseInt(skillLevelSelect.value);

        if (!skillName) {
            alert("Please enter a skill name.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${userId}/skills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: skillName,
                    level: skillLevel
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`[SKILL MGMT] Skill added: ${skillName}`);

                // Reload skills
                await loadSkills();
                newSkillInput.value = '';

                // Reload activity log
                await loadActivityLog();
            } else {
                const err = await response.json();
                alert('Error adding skill: ' + (err.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Failed to connect to server.');
        }
    }

    async function handleRemoveSkill(skillId, skillName) {
        if (!confirm(`Are you sure you want to remove "${skillName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${userId}/skills/${skillId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log(`[SKILL MGMT] Skill removed: ${skillName}`);

                // Reload skills
                await loadSkills();

                // Reload activity log
                await loadActivityLog();
            } else {
                const err = await response.json();
                alert('Error removing skill: ' + (err.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Failed to connect to server.');
        }
    }

    async function loadSkills() {
        try {
            const response = await fetch(`${API_BASE_URL}/${userId}/skills`);
            if (response.ok) {
                const skills = await response.json();
                renderSkills(skills);
            }
        } catch (error) {
            console.error('Error loading skills:', error);
        }
    }

    // --- 3. ACTIVITY LOG RENDERING ---
    function renderActivityLog(logs) {
        const logList = document.getElementById('activity-log');
        logList.innerHTML = '';

        if (!logs || logs.length === 0) {
            logList.innerHTML = '<li class="no-activity">No recent activity.</li>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('li');
            const timestamp = new Date(log.timestamp).toLocaleString();
            item.innerHTML = `${log.action} <span class="activity-log-time">${timestamp}</span>`;
            logList.appendChild(item);
        });
    }

    async function loadActivityLog() {
        try {
            const response = await fetch(`${API_BASE_URL}/${userId}/activities?limit=10`);
            if (response.ok) {
                const activities = await response.json();
                renderActivityLog(activities);
            }
        } catch (error) {
            console.error('Error loading activity log:', error);
        }
    }

    // --- 4. PROFILE ACTIONS ---
    const editModal = document.getElementById('edit-profile-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editForm = document.getElementById('edit-profile-form');

    function handleEditProfile() {
        // Load current profile data into modal
        document.getElementById('edit-name').value = document.getElementById('user-name').textContent;
        document.getElementById('edit-email').value = document.getElementById('user-email').textContent;
        document.getElementById('edit-role').value = currentUser.role || 'user';

        // Show modal
        editModal.classList.remove('hidden');
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
    }

    closeEditModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('edit-name').value.trim(),
            email: document.getElementById('edit-email').value.trim(),
            role: document.getElementById('edit-role').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[PROFILE] Profile updated successfully');

                // Update UI
                document.getElementById('user-name').textContent = formData.name;
                document.getElementById('user-email').textContent = formData.email;
                document.getElementById('user-role').textContent = formData.role;

                // Update avatar with new initials
                const initials = formData.name.split(' ').map(n => n[0]).join('').toUpperCase();
                const avatarImg = document.getElementById('profile-avatar');
                if (avatarImg) {
                    avatarImg.src = `https://placehold.co/80x80/4a90e2/ffffff?text=${initials}`;
                }

                // Update localStorage
                currentUser.name = formData.name;
                currentUser.email = formData.email;
                currentUser.role = formData.role;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                // Close modal
                closeEditModal();

                // Reload activity log to show the update
                await loadActivityLog();

                alert('Profile updated successfully!');
            } else {
                const err = await response.json();
                alert('Error updating profile: ' + (err.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Failed to connect to server.');
        }
    });
});
