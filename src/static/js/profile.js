document.addEventListener('DOMContentLoaded', () => {
    const skillsList = document.getElementById('skills-list');
    const newSkillInput = document.getElementById('new-skill-input');
    const skillLevelSelect = document.getElementById('skill-level-select');
    const addSkillBtn = document.getElementById('add-skill-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');

    // MOCK DATA: Simulating data from Resource & Auth Service
    const MOCK_USER_DATA = {
        name: "Jana Al-Najjar",
        role: "Project Manager",
        email: "jana.ahmed@aipms.com",
        stats: {
            velocity: '100%', rejectionRate: '5%', riskExposure: '22%', tasksCompleted: 85
        },
        skills: [
            { name: "Project Management", level: 3 },
            { name: "SQL Server", level: 2 },
            { name: "Python (Flask)", level: 3 },
            { name: "CI/CD", level: 1 }
        ],
        activityLog: [
            "Updated RBAC permissions for Bob S. (Admin action)",
            "Closed Sprint 4 (Frontend UI Revamp)",
            "Completed Task WI-405 (S3 Fix)",
            "Reviewed and approved new documentation."
        ]
    };

    // --- INITIALIZATION ---
    loadProfileData(MOCK_USER_DATA);
    
    // --- EVENT LISTENERS ---
    addSkillBtn.addEventListener('click', handleAddSkill);
    editProfileBtn.addEventListener('click', handleEditProfile);

    // --- 1. DATA LOADING ---
    function loadProfileData(data) {
        // Load Header Info
        document.getElementById('user-name').textContent = data.name;
        document.getElementById('user-role').textContent = data.role;
        document.getElementById('user-email').textContent = data.email;

        // Load Stats
        document.getElementById('user-velocity').textContent = data.stats.velocity;
        document.getElementById('task-rejection').textContent = data.stats.rejectionRate;
        document.getElementById('risk-exposure').textContent = data.stats.riskExposure;
        document.getElementById('tasks-completed').textContent = data.stats.tasksCompleted;

        // Render Skills
        renderSkills(data.skills);
        
        // Render Activity Log
        renderActivityLog(data.activityLog);
    }
    
    // --- 2. SKILL RENDERING & MANAGEMENT (FR-301) ---
    function getLevelText(level) {
        if (level == 3) return 'Expert';
        if (level == 2) return 'Proficient';
        return 'Familiar';
    }

    function renderSkills(skills) {
        skillsList.innerHTML = '';
        skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.innerHTML = `${skill.name} <span class="skill-level-indicator">(${getLevelText(skill.level)})</span>`;
            skillsList.appendChild(tag);
        });
    }

    function handleAddSkill() {
        const skillName = newSkillInput.value.trim();
        const skillLevel = parseInt(skillLevelSelect.value);

        if (!skillName) {
            alert("Please enter a skill name.");
            return;
        }

        // --- API ACTION: Update Skill (PUT to /api/v1/users/{id}/skills) ---
        
        console.log(`[SKILL MGMT] Adding skill: ${skillName} at level ${skillLevel}`);
        
        // --- Simulation ---
        MOCK_USER_DATA.skills.push({ name: skillName, level: skillLevel });
        renderSkills(MOCK_USER_DATA.skills);
        newSkillInput.value = '';

        alert(`Skill '${skillName}' added. This data is used by AI Resource Allocation (FR-301).`);
    }

    // --- 3. ACTIVITY LOG RENDERING ---
    function renderActivityLog(logs) {
        const logList = document.getElementById('activity-log');
        logList.innerHTML = '';
        logs.forEach(log => {
            const item = document.createElement('li');
            item.innerHTML = `${log} <span class="activity-log-time">${new Date().toLocaleTimeString()}</span>`;
            logList.appendChild(item);
        });
    }

    // --- 4. PROFILE ACTIONS ---
    function handleEditProfile() {
        alert("Simulating redirect to the general settings tab for profile editing.");
        // window.location.href = '/settings?tab=general';
    }
});