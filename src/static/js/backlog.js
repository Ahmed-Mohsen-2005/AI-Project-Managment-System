// =================================================================
// backlog.js - FIXED VERSION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const BACKLOG_API_URL = '/api/v1/tasks/backlog';
    const TASK_API_URL = '/api/v1/tasks';
    const SPRINT_API_URL = '/api/v1/sprints';
    const USER_API_URL = '/api/v1/users';
    const DOCUMENTATION_API_URL = '/api/v1/documentation';
    const BACKLOG_SPRINT_ID = 1;

    // DOM Elements
    const backlogList = document.getElementById('backlog-item-list');
    const sprintTarget = document.getElementById('sprint-planning-target');
    
    // User map for assignee display
    let usersMap = {};
    let sprintsMap = {};
    
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
        await loadUsers();
        await loadSprints();
        loadBacklogItems();
    })();

    // Event Listeners - Add Backlog Modal
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
            quickAddModal.style.display = 'block';
            loadSprints(); // Refresh sprints
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
    // LOAD BACKLOG ITEMS
    // ============================================
    async function loadBacklogItems() {
        backlogList.innerHTML = '<li class="loading-message">Loading backlog...</li>';

        try {
            const res = await fetch(BACKLOG_API_URL);
            if (!res.ok) throw new Error('Failed to fetch backlog');
            
            const items = await res.json();
            backlogList.innerHTML = '';

            if (items.length === 0) {
                backlogList.innerHTML = '<li class="loading-message">No backlog items.</li>';
                return;
            }

            items.forEach(item => {
                backlogList.insertAdjacentHTML('beforeend', createBacklogRow(item));
            });

            attachDragListeners();
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
            const res = await fetch(SPRINT_API_URL);
            if (!res.ok) throw new Error('Failed to fetch sprints');
            
            const sprints = await res.json();
            sprintSelect.innerHTML = '';

            // Populate sprints map
            sprintsMap = {};
            sprintsMap[BACKLOG_SPRINT_ID] = '📋 PRODUCT BACKLOG (Unscheduled)';
            sprints.forEach(s => {
                sprintsMap[s.sprint_id] = s.name;
            });

            // Add backlog option first
            const backlogOpt = document.createElement('option');
            backlogOpt.value = BACKLOG_SPRINT_ID;
            backlogOpt.textContent = '📋 PRODUCT BACKLOG (Unscheduled)';
            backlogOpt.selected = true;
            sprintSelect.appendChild(backlogOpt);

            // Add other sprints
            sprints.forEach(s => {
                if (s.sprint_id === BACKLOG_SPRINT_ID) return;
                const opt = document.createElement('option');
                opt.value = s.sprint_id;
                opt.textContent = s.name;
                sprintSelect.appendChild(opt);
            });

            console.log('[SUCCESS] Loaded sprints');
        } catch (err) {
            console.error('[ERROR] Load sprints failed:', err);
        }
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
    async function loadUsers() {
        if (!assigneeSelect) return;

        try {
            const res = await fetch(USER_API_URL);
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
            alert('Please enter a title');
            return;
        }

        try {
            const endpoint = payload.sprint_id === BACKLOG_SPRINT_ID ? BACKLOG_API_URL : TASK_API_URL;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to create task');

            const result = await res.json();
            console.log('[SUCCESS] Task created:', result.task_id);
            
            alert('✓ Task created successfully!');
            quickAddModal.style.display = 'none';
            quickAddForm.reset();
            
            if (payload.sprint_id === BACKLOG_SPRINT_ID) {
                loadBacklogItems();
            }
        } catch (err) {
            console.error('[ERROR] Create task failed:', err);
            alert(`Error: ${err.message}`);
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
                body: JSON.stringify({ sprint_id: parseInt(sprintId), status: 'TODO' })
            });

            if (!res.ok) throw new Error('Failed to move task');

            alert(`✓ Task moved to Sprint ${sprintId}!`);
            loadBacklogItems();
        } catch (err) {
            console.error('[ERROR] Move task failed:', err);
            alert(`Error: ${err.message}`);
        }
    }

    // ============================================
    // DOCUMENTATION GENERATION
    // ============================================
    async function loadSprintsForDoc() {
        if (!docSprintSelect) return;

        try {
            const res = await fetch(SPRINT_API_URL);
            if (!res.ok) throw new Error('Failed to fetch sprints');
            
            const sprints = await res.json();
            docSprintSelect.innerHTML = '';

            sprints.forEach(s => {
                if (s.sprint_id === BACKLOG_SPRINT_ID) return;
                const opt = document.createElement('option');
                opt.value = s.sprint_id;
                opt.textContent = s.name;
                docSprintSelect.appendChild(opt);
            });
        } catch (err) {
            console.error('[ERROR] Load sprints for doc failed:', err);
        }
    }

    async function handleDocGeneration(e) {
        e.preventDefault();

        const sprintId = docSprintSelect.value;
        if (!sprintId) {
            alert('Please select a sprint');
            return;
        }

        docModal.style.display = 'none';
        docOutput.style.display = 'block';
        docContent.innerHTML = '<div class="loading-spinner"></div><p>Generating documentation with AI...</p>';

        try {
            // Fetch sprint data
            const docRes = await fetch(`${DOCUMENTATION_API_URL}/sprint/${sprintId}`);
            if (!docRes.ok) throw new Error('Failed to fetch sprint data');
            const docData = await docRes.json();

            // Generate AI summary
            const aiRes = await fetch(`${DOCUMENTATION_API_URL}/sprint/${sprintId}/ai-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        } catch (err) {
            console.error('[ERROR] Documentation generation failed:', err);
            docContent.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
        }
    }
});