// =================================================================
// backlog.js - WITH PROJECT FILTER
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const BACKLOG_API_URL = '/api/v1/tasks/backlog';
    const TASK_API_URL = '/api/v1/tasks';
    const SPRINT_API_URL = '/api/v1/sprints';
    const USER_API_URL = '/api/v1/users';
    const DOCUMENTATION_API_URL = '/api/v1/documentation';
    const PROJECTS_API_URL = '/api/v1/projects';
    const BACKLOG_SPRINT_ID = 1;

    // Global state for filtering
    let currentProjectFilter = null;
    let allTasks = [];
    let allSprints = [];
    let usersMap = {};
    let sprintsMap = {};

    // DOM Elements
    const backlogList = document.getElementById('backlog-item-list');
    const sprintTarget = document.getElementById('sprint-planning-target');
    const projectFilter = document.getElementById('project-filter');
    
    // Add Backlog Modal
    const quickAddBtn = document.getElementById('quick-add-item-btn');
    const quickAddModal = document.getElementById('quick-add-modal');
    const closeBacklogBtn = document.getElementById('close-backlog-modal');
    const quickAddForm = document.getElementById('quick-add-form');
    const sprintSelect = document.getElementById('item-sprint');
    const assigneeSelect = document.getElementById('item-assignee');
    
    // Documentation Modal
    const generateDocsBtn = document.getElementById('generate-docs-btn');
    const docModal = document.getElementById('doc-sprint-modal');
    const closeDocBtn = document.getElementById('close-doc-modal');
    const docSprintSelect = document.getElementById('doc-sprint-select');
    const docSprintForm = document.getElementById('doc-sprint-form');
    const docOutput = document.getElementById('doc-output');
    const docContent = document.getElementById('doc-content');

    // Initialize
    (async () => {
        await loadProjects();
        await loadUsers();
        await loadSprints();
        await loadBacklogItems();
    })();

    // Event Listeners - Project Filter
    if (projectFilter) {
        projectFilter.addEventListener('change', handleProjectFilterChange);
    }

    // Event Listeners - Add Backlog Modal
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            quickAddModal.style.display = 'block';
            loadSprints(); // Refresh sprints with filter
            loadUsers(); // Refresh users
        });
    }

    if (closeBacklogBtn) {
        closeBacklogBtn.addEventListener('click', () => {
            quickAddModal.style.display = 'none';
            quickAddForm.reset();
        });
    }

    if (quickAddForm) {
        quickAddForm.addEventListener('submit', handleQuickAddSubmit);
    }

    // Event Listeners - Documentation Modal
    if (generateDocsBtn) {
        generateDocsBtn.addEventListener('click', () => {
            docModal.style.display = 'block';
            loadSprintsForDoc();
        });
    }

    if (closeDocBtn) {
        closeDocBtn.addEventListener('click', () => {
            docModal.style.display = 'none';
            docSprintForm.reset();
        });
    }

    if (docSprintForm) {
        docSprintForm.addEventListener('submit', handleDocGeneration);
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === quickAddModal) {
            quickAddModal.style.display = 'none';
        }
        if (e.target === docModal) {
            docModal.style.display = 'none';
        }
    });

    // Drag & Drop
    if (sprintTarget) {
        sprintTarget.addEventListener('dragover', handleDragOver);
        sprintTarget.addEventListener('drop', handleDrop);
    }

    // ============================================
    // PROJECT FILTER FUNCTIONS
    // ============================================

    async function loadProjects() {
        console.log('[PROJECTS] Loading projects...');
        
        try {
            const response = await fetch(PROJECTS_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const projects = await response.json();
            console.log('[PROJECTS] Received', projects.length, 'projects');
            
            populateProjectFilter(projects);
            
        } catch (err) {
            console.error('[PROJECTS] Error:', err);
            if (projectFilter) {
                projectFilter.innerHTML = '<option value="">All Projects (Error loading)</option>';
            }
        }
    }

    function populateProjectFilter(projects) {
        if (!projectFilter) return;
        
        projectFilter.innerHTML = '<option value="">All Projects</option>';
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id;
            option.textContent = project.name || `Project ${project.project_id}`;
            projectFilter.appendChild(option);
        });
        
        console.log('[PROJECTS] Filter populated with', projects.length, 'projects');
    }

    async function handleProjectFilterChange() {
        const projectId = projectFilter.value;
        currentProjectFilter = projectId ? parseInt(projectId) : null;
        
        console.log('[FILTER] Changed to project:', currentProjectFilter || 'All');
        
        showNotification('Filtering backlog...', 'info');
        
        await loadBacklogItems();
        
        showNotification('✓ Backlog filtered', 'success');
    }

    function getFilteredTasks() {
        if (!currentProjectFilter) {
            return allTasks;
        }
        
        // Get sprints for the current project
        const projectSprints = allSprints.filter(s => s.project_id === currentProjectFilter);
        const sprintIds = projectSprints.map(s => s.sprint_id);
        
        // Filter tasks by sprint IDs
        return allTasks.filter(t => sprintIds.includes(t.sprint_id));
    }

    function getFilteredSprints() {
        if (!currentProjectFilter) {
            return allSprints;
        }
        
        return allSprints.filter(s => s.project_id === currentProjectFilter);
    }

    // ============================================
    // LOAD BACKLOG ITEMS
    // ============================================
    async function loadBacklogItems() {
        backlogList.innerHTML = '<li class="loading-message">Loading backlog...</li>';

        try {
            const res = await fetch(BACKLOG_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch backlog');
            
            allTasks = await res.json();
            
            // Apply project filter
            const filteredTasks = getFilteredTasks();
            
            backlogList.innerHTML = '';

            if (filteredTasks.length === 0) {
                const emptyMsg = currentProjectFilter 
                    ? 'No backlog items for selected project'
                    : 'No backlog items';
                backlogList.innerHTML = `<li class="loading-message">${emptyMsg}</li>`;
                return;
            }

            filteredTasks.forEach(item => {
                backlogList.insertAdjacentHTML('beforeend', createBacklogRow(item));
            });

            attachDragListeners();
            
            console.log('[SUCCESS] Loaded', filteredTasks.length, 'backlog items');
        } catch (err) {
            console.error('[ERROR] Load backlog failed:', err);
            backlogList.innerHTML = `<li class="loading-message error">Error: ${err.message}</li>`;
        }
    }

    function createBacklogRow(item) {
        const status = item.status || 'TODO';
        return `
            <li class="backlog-item" draggable="true" data-item-id="${item.task_id}">
                <span class="col-id">#${item.task_id}</span>
                <span class="col-title">
                    <span class="item-type-badge status-${status}">${status}</span>
                    ${item.title}
                </span>
                <span class="col-priority">${item.priority || 'MEDIUM'}</span>
                <span class="col-assignee">${item.assigned_id ? (usersMap[item.assigned_id] || `User ${item.assigned_id}`) : 'Unassigned'}</span>
                <span class="col-score">
                    ${sprintsMap[item.sprint_id] || 'Unknown Sprint'}
                </span>
                <span class="col-actions">
                    <button class="btn-icon" title="View"><i class="fas fa-eye"></i></button>
                </span>
            </li>
        `;
    }

    // ============================================
    // LOAD SPRINTS FOR TASK CREATION
    // ============================================
    async function loadSprints() {
        if (!sprintSelect) return;

        try {
            const res = await fetch(SPRINT_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch sprints');
            
            allSprints = await res.json();
            
            // Populate sprints map
            sprintsMap = {};
            sprintsMap[BACKLOG_SPRINT_ID] = '📋 PRODUCT BACKLOG (Unscheduled)';
            allSprints.forEach(s => {
                sprintsMap[s.sprint_id] = s.name;
            });

            // Filter sprints by project
            let filteredSprints = getFilteredSprints();

            sprintSelect.innerHTML = '';

            // Add backlog option first (always available)
            const backlogOpt = document.createElement('option');
            backlogOpt.value = BACKLOG_SPRINT_ID;
            backlogOpt.textContent = '📋 PRODUCT BACKLOG (Unscheduled)';
            backlogOpt.selected = true;
            sprintSelect.appendChild(backlogOpt);

            // Add filtered sprints
            filteredSprints.forEach(s => {
                if (s.sprint_id === BACKLOG_SPRINT_ID) return;
                const opt = document.createElement('option');
                opt.value = s.sprint_id;
                opt.textContent = s.name;
                sprintSelect.appendChild(opt);
            });

            if (filteredSprints.length === 0 && currentProjectFilter) {
                console.log('[INFO] No sprints available for selected project');
            }

            console.log('[SUCCESS] Loaded', filteredSprints.length, 'sprints (filtered)');
        } catch (err) {
            console.error('[ERROR] Load sprints failed:', err);
        }
    }

    async function loadUsers() {
        if (!assigneeSelect) return;

        try {
            const res = await fetch(USER_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            
            const users = await res.json();
            console.log('Loaded users:', users);
            assigneeSelect.innerHTML = '';

            const unassignedOpt = document.createElement('option');
            unassignedOpt.value = '';
            unassignedOpt.textContent = 'Unassigned';
            assigneeSelect.appendChild(unassignedOpt);

            users.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.user_id;
                opt.textContent = u.name || `User ${u.user_id}`;
                assigneeSelect.appendChild(opt);
                
                // Populate users map for assignee display
                usersMap[u.user_id] = u.name || `User ${u.user_id}`;
            });

            console.log('Users map populated:', usersMap);
        } catch (err) {
            console.error('[ERROR] Load users failed:', err);
            // Fallback: create some dummy users for testing
            usersMap = {
                1: 'John Doe',
                2: 'Jane Smith',
                3: 'Bob Johnson'
            };
            console.log('Using fallback users map:', usersMap);
        }
    }

    // ============================================
    // CREATE BACKLOG TASK
    // ============================================
    async function handleQuickAddSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const payload = {
            title: formData.get('title').trim(),
            sprint_id: parseInt(formData.get('sprint_id')),
            status: formData.get('status') || 'TODO',
            priority: formData.get('priority') || 'MEDIUM',
            estimate_hours: formData.get('estimate_hours') ? parseFloat(formData.get('estimate_hours')) : null,
            due_date: formData.get('due_date') || null,
            assigned_id: formData.get('assigned_id') ? parseInt(formData.get('assigned_id')) : null,
        };

        if (!payload.title) {
            showNotification('Please enter a title', 'error');
            return;
        }

        try {
            const endpoint = payload.sprint_id === BACKLOG_SPRINT_ID ? BACKLOG_API_URL : TASK_API_URL;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to create task');

            const result = await res.json();
            console.log('[SUCCESS] Task created:', result.task_id);
            
            showNotification('✓ Task created successfully!', 'success');
            quickAddModal.style.display = 'none';
            quickAddForm.reset();
            
            if (payload.sprint_id === BACKLOG_SPRINT_ID) {
                await loadBacklogItems();
            }
        } catch (err) {
            console.error('[ERROR] Create task failed:', err);
            showNotification(`Error: ${err.message}`, 'error');
        }
    }

    // ============================================
    // DRAG & DROP TO SPRINT
    // ============================================
    function attachDragListeners() {
        document.querySelectorAll('.backlog-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('task_id', item.dataset.itemId);
                item.classList.add('dragging');
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drop-hover');
    }

    async function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-hover');

        const taskId = e.dataTransfer.getData('task_id');
        const sprintId = e.currentTarget.dataset.sprintId;

        try {
            const res = await fetch(`${TASK_API_URL}/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ sprint_id: parseInt(sprintId), status: 'TODO' })
            });

            if (!res.ok) throw new Error('Failed to move task');

            showNotification(`✓ Task moved to Sprint ${sprintId}!`, 'success');
            await loadBacklogItems();
        } catch (err) {
            console.error('[ERROR] Move task failed:', err);
            showNotification(`Error: ${err.message}`, 'error');
        }
    }

    // ============================================
    // DOCUMENTATION GENERATION
    // ============================================
    async function loadSprintsForDoc() {
        if (!docSprintSelect) return;

        try {
            const res = await fetch(SPRINT_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch sprints');
            
            const sprints = await res.json();
            
            // Filter sprints by project
            const filteredSprints = currentProjectFilter
                ? sprints.filter(s => s.project_id === currentProjectFilter)
                : sprints;
            
            docSprintSelect.innerHTML = '';

            if (filteredSprints.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = currentProjectFilter 
                    ? 'No sprints for selected project'
                    : 'No sprints available';
                docSprintSelect.appendChild(opt);
                return;
            }

            filteredSprints.forEach(s => {
                if (s.sprint_id === BACKLOG_SPRINT_ID) return;
                const opt = document.createElement('option');
                opt.value = s.sprint_id;
                opt.textContent = s.name;
                docSprintSelect.appendChild(opt);
            });
            
            console.log('[SUCCESS] Loaded', filteredSprints.length, 'sprints for documentation');
        } catch (err) {
            console.error('[ERROR] Load sprints for doc failed:', err);
        }
    }

    async function handleDocGeneration(e) {
        e.preventDefault();

        const sprintId = docSprintSelect.value;
        if (!sprintId) {
            showNotification('Please select a sprint', 'error');
            return;
        }

        docModal.style.display = 'none';
        docOutput.style.display = 'block';
        docContent.innerHTML = '<div class="loading-spinner"></div><p>Generating documentation with AI...</p>';

        try {
            // Fetch sprint data
            const docRes = await fetch(`${DOCUMENTATION_API_URL}/sprint/${sprintId}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!docRes.ok) throw new Error('Failed to fetch sprint data');
            const docData = await docRes.json();

            // Generate AI summary
            const aiRes = await fetch(`${DOCUMENTATION_API_URL}/sprint/${sprintId}/ai-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ prompt: docData.ai_summary_prompt })
            });

            if (!aiRes.ok) throw new Error('AI generation failed');
            const aiData = await aiRes.json();

            // Display results
            let summaryHtml = simpleMarkdown(aiData.summary);
            
            docContent.innerHTML = `
                <h3>${docData.sprint_info.name}</h3>
                <p>📅 ${docData.sprint_info.start_date || 'N/A'} - ${docData.sprint_info.end_date || 'N/A'}</p>
                
                <h4>📊 Metrics</h4>
                <p>✅ Completed: ${docData.metrics.completed_tasks}/${docData.metrics.total_tasks} (${docData.metrics.completion_rate}%)</p>
                <p>🚫 Blocked: ${docData.metrics.blocked_tasks}</p>
                
                <h4>🤖 AI Summary</h4>
                <div>${summaryHtml}</div>
                
                <h4>✅ Completed Tasks</h4>
                <ul>
                    ${docData.tasks.completed.map(t => `<li><strong>#${t.task_id}</strong> - ${t.title}</li>`).join('')}
                </ul>
            `;
            
            showNotification('✓ Documentation generated', 'success');
        } catch (err) {
            console.error('[ERROR] Documentation generation failed:', err);
            docContent.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
            showNotification('Error generating documentation', 'error');
        }
    }

    // ============================================
    // NOTIFICATION SYSTEM
    // ============================================
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-size: 14px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ============================================
    // SIMPLE MARKDOWN PARSER
    // ============================================
    function simpleMarkdown(text) {
        let lines = text.split('\n');
        let html = '';
        let inList = false;
        let inTable = false;
        let tableRows = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Check for table
            if (line.includes('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line);
                continue;
            } else if (inTable) {
                // End of table
                html += parseTable(tableRows);
                inTable = false;
                tableRows = [];
                // Fall through to process current line
            }
            
            if (line.startsWith('# ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<h1>' + line.substring(2) + '</h1>';
            } else if (line.startsWith('## ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<h2>' + line.substring(3) + '</h2>';
            } else if (line.startsWith('### ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<h3>' + line.substring(4) + '</h3>';
            } else if (line.match(/^\* |^- |\d+\. /)) {
                if (!inList) { html += '<ul>'; inList = true; }
                html += '<li>' + line.replace(/^\* |^- |\d+\. /, '') + '</li>';
            } else if (line === '') {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<br>';
            } else {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<p>' + line + '</p>';
            }
        }
        
        if (inList) html += '</ul>';
        if (inTable) html += parseTable(tableRows);
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return html;
    }
    
    function parseTable(rows) {
        if (rows.length < 2) return '';
        
        let html = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        
        // First row is header
        let headerCells = rows[0].split('|').slice(1, -1).map(cell => cell.trim());
        html += '<thead><tr>';
        headerCells.forEach(cell => {
            html += '<th style="padding: 8px; text-align: left; background-color: #f2f2f2;">' + cell + '</th>';
        });
        html += '</tr></thead>';
        
        // Check if second row is separator
        if (rows.length > 1 && rows[1].includes('---')) {
            // Data rows start from index 2
            html += '<tbody>';
            for (let i = 2; i < rows.length; i++) {
                let cells = rows[i].split('|').slice(1, -1).map(cell => cell.trim());
                html += '<tr>';
                cells.forEach(cell => {
                    html += '<td style="padding: 8px;">' + cell + '</td>';
                });
                html += '</tr>';
            }
            html += '</tbody>';
        } else {
            // No separator, treat all as data
            html += '<tbody>';
            for (let i = 1; i < rows.length; i++) {
                let cells = rows[i].split('|').slice(1, -1).map(cell => cell.trim());
                html += '<tr>';
                cells.forEach(cell => {
                    html += '<td style="padding: 8px;">' + cell + '</td>';
                });
                html += '</tr>';
            }
            html += '</tbody>';
        }
        
        html += '</table>';
        return html;
    }

    // Add CSS animations
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
});