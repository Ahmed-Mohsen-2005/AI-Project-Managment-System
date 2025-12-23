// =================================================================
// backlog.js - Enhanced with ALL Task fields + Sprint Selection
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration Constants ---
    const BACKLOG_API_URL = '/api/v1/tasks/backlog';
    const TASK_API_URL = '/api/v1/tasks';
    const SPRINT_API_URL = '/api/v1/sprints';
    const USER_API_URL = '/api/v1/users';
    const BACKLOG_SPRINT_ID = 1; 

    // --- DOM Elements ---
    const backlogList = document.getElementById('backlog-item-list');
    const quickAddBtn = document.getElementById('quick-add-item-btn');
    const modal = document.getElementById('quick-add-modal');
    const closeBtn = document.querySelector('.close-btn');
    const quickAddForm = document.getElementById('quick-add-form');
    const projectFilter = document.getElementById('project-filter');
    const sortBySelect = document.getElementById('sort-by');
    const sprintTarget = document.getElementById('sprint-planning-target');
    const sprintSelect = document.getElementById('item-sprint');
    const assigneeSelect = document.getElementById('item-assignee');

    
    // --- INITIALIZATION ---
    loadBacklogItems();
    loadSprints(); // Load sprints for the dropdown
    loadUsers(); // Load users for the assignee dropdown

    // --- EVENT LISTENERS ---
    if (projectFilter) projectFilter.addEventListener('change', loadBacklogItems);
    if (sortBySelect) sortBySelect.addEventListener('change', loadBacklogItems);
    if (quickAddBtn) quickAddBtn.addEventListener('click', openQuickAddModal);
    if (closeBtn) closeBtn.addEventListener('click', closeQuickAddModal);
    
    window.addEventListener('click', (event) => { 
        if (event.target === modal) closeQuickAddModal(); 
    });
    
    if (quickAddForm) quickAddForm.addEventListener('submit', handleQuickAddSubmit);

    // --- DRAG TARGET LISTENERS ---
    if (sprintTarget) {
        sprintTarget.addEventListener('dragover', handleDragOverTarget);
        sprintTarget.addEventListener('dragleave', handleDragLeaveTarget);
        sprintTarget.addEventListener('drop', handleDropToSprint);
    }
    
    // --- MODAL CONTROL LOGIC ---
    function openQuickAddModal() { 
        modal.style.display = 'block'; 
        loadSprints(); // Refresh sprints when opening modal
        loadUsers(); // Refresh users when opening modal
        const titleInput = document.getElementById('item-title-input');
        if (titleInput) titleInput.focus();
    }

    
    function closeQuickAddModal() { 
        modal.style.display = 'none'; 
        quickAddForm.reset(); 
    }

    // --- SPRINT LOADING LOGIC ---
    async function loadSprints() {
        if (!sprintSelect) return;
        
        try {
            const response = await fetch(SPRINT_API_URL);
            
            if (!response.ok) {
                throw new Error('Failed to fetch sprints');
            }
            
            const sprints = await response.json();
            
            // Clear existing options
            sprintSelect.innerHTML = '';
            
            // Add "Product Backlog" as default option (sprint_id = 1)
            const backlogOption = document.createElement('option');
            backlogOption.value = BACKLOG_SPRINT_ID;
            backlogOption.textContent = '📋 PRODUCT BACKLOG (Unscheduled)';
            backlogOption.selected = true;
            sprintSelect.appendChild(backlogOption);
            
            // Add other sprints
            sprints.forEach(sprint => {
                // Skip if it's already the backlog sprint
                if (sprint.sprint_id === BACKLOG_SPRINT_ID) return;
                
                const option = document.createElement('option');
                option.value = sprint.sprint_id;
                
                // Format the sprint name with dates if available
                let displayName = sprint.name;
                if (sprint.start_date && sprint.end_date) {
                    const startDate = new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const endDate = new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    displayName += ` (${startDate} - ${endDate})`;
                }
                
                option.textContent = displayName;
                sprintSelect.appendChild(option);
            });
            
            console.log(`[SUCCESS] Loaded ${sprints.length} sprints`);
            
        } catch (error) {
            console.error('[ERROR] Failed to load sprints:', error);
            sprintSelect.innerHTML = '<option value="1">Product Backlog (Failed to load other sprints)</option>';
        }
    }
    // --- USER LOADING LOGIC ---
    async function loadUsers() {
        if (!assigneeSelect) return;
        
        try {
            const response = await fetch(USER_API_URL);
            
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const users = await response.json();
            
            // Clear existing options
            assigneeSelect.innerHTML = '';
            
            // Add "Unassigned" as default option
            const unassignedOption = document.createElement('option');
            unassignedOption.value = '';
            unassignedOption.textContent = 'Unassigned';
            unassignedOption.selected = true;
            assigneeSelect.appendChild(unassignedOption);
            
            // Add user options
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.user_id;
                
                // Use name from the User table
                const displayName = user.name || `User ${user.user_id}`;
                option.textContent = displayName;
                
                assigneeSelect.appendChild(option);
            });
            
            console.log(`[SUCCESS] Loaded ${users.length} users`);
            
        } catch (error) {
            console.error('[ERROR] Failed to load users:', error);
            assigneeSelect.innerHTML = '<option value="">Unassigned (Failed to load users)</option>';
        }
    }

    // --- UTILITIES ---
    
    function mapDbPriorityToUi(dbPriority) {
        if (!dbPriority) return 'MEDIUM';
        switch (dbPriority.toUpperCase()) {
            case 'HIGH': return 'HIGH';
            case 'MEDIUM': return 'MEDIUM';
            case 'LOW': return 'LOW';
            default: return 'MEDIUM';
        }
    }
    
    function getScoreClass(score) {
        if (score >= 90) return 'score-90-100';
        if (score >= 70) return 'score-70-89';
        if (score >= 40) return 'score-40-69';
        return 'score-0-39';
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // --- DATA LOADING & RENDERING ---
    async function loadBacklogItems() {
        backlogList.innerHTML = '<li class="loading-message">Loading backlog items...</li>';

        try {
            const res = await fetch(BACKLOG_API_URL); 
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to fetch backlog items.");
            }

            const items = await res.json();
            backlogList.innerHTML = '';

            if (items.length === 0) {
                backlogList.innerHTML = '<li class="loading-message">No backlog items. Click "Add Backlog Item" to create one.</li>';
                return;
            }
            
            items.forEach(item => {
                const mappedItem = {
                    id: item.task_id,
                    title: item.title,
                    status: item.status || 'TODO',
                    manual_priority: mapDbPriorityToUi(item.priority), 
                    assignee: item.assigned_id,
                    estimate_hours: item.estimate_hours,
                    due_date: item.due_date,
                    ai_score: item.ai_score ?? Math.floor(Math.random() * 50) + 1,
                };

                backlogList.insertAdjacentHTML(
                    'beforeend',
                    createBacklogItemRow(mappedItem)
                );
            });

            attachDragDropListeners();

        } catch (err) {
            backlogList.innerHTML = `<li class="loading-message error">Failed to load backlog: ${err.message}</li>`;
            console.error('API Error:', err);
        }
    }

    function createBacklogItemRow(item) {
        const scoreClass = getScoreClass(item.ai_score);
        const statusBadge = getStatusBadge(item.status);
        
        return `
            <li class="backlog-item" draggable="true" data-item-id="${item.id}">
                <span class="col-id">#${item.id}</span>
                <span class="col-title">
                    ${statusBadge}
                    ${item.title}
                    ${item.estimate_hours ? `<small class="estimate-badge">${item.estimate_hours}h</small>` : ''}
                    ${item.due_date ? `<small class="due-date-badge">${formatDate(item.due_date)}</small>` : ''}
                </span>
                <span class="col-priority">${item.manual_priority}</span>
                <span class="col-assignee">${item.assignee ? `User ${item.assignee}` : 'Unassigned'}</span>
                <span class="col-score">
                    <div class="priority-score-box ${scoreClass}">${item.ai_score}</div>
                </span>
                <span class="col-actions">
                    <button class="btn-icon" title="View Details"><i class="fas fa-eye"></i></button>
                </span>
            </li>
        `;
    }

    function getStatusBadge(status) {
        const statusMap = {
            'TODO': '<span class="item-type-badge type-Feature">TODO</span>',
            'IN_PROGRESS': '<span class="item-type-badge type-Epic">In Progress</span>',
            'DONE': '<span class="item-type-badge type-Bug">Done</span>',
            'BLOCKED': '<span class="item-type-badge type-TechDebt">Blocked</span>'
        };
        return statusMap[status] || statusMap['TODO'];
    }

    // --- TASK SUBMISSION LOGIC ---
    
    function handleQuickAddSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Get all form values
        const title = formData.get('title')?.trim();
        const sprintId = formData.get('sprint_id');
        const status = formData.get('status') || 'TODO';
        const priority = formData.get('priority') || 'MEDIUM';
        const estimateHours = formData.get('estimate_hours');
        const dueDate = formData.get('due_date');
        const assignedId = formData.get('assigned_id');
        
        if (!title) {
            alert('Please enter a title for the task');
            return;
        }
        
        if (!sprintId) {
            alert('Please select a sprint');
            return;
        }

        // Build the payload with all fields
        const payload = {
            title: title,
            sprint_id: parseInt(sprintId),
            status: status,
            priority: priority,
            estimate_hours: estimateHours ? parseFloat(estimateHours) : null,
            due_date: dueDate || null,
            assigned_id: assignedId ? parseInt(assignedId) : null,
        };
        
        console.log('[DEBUG] Submitting task:', payload);
        submitNewTask(payload);
    }
    
    async function submitNewTask(payload) {
        try {
            // Use the regular task endpoint instead of backlog-specific endpoint
            const endpoint = payload.sprint_id === BACKLOG_SPRINT_ID ? BACKLOG_API_URL : TASK_API_URL;
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();

            if (response.ok) {
                console.log(`[SUCCESS] Task created with ID: ${result.task_id}`);
                const sprintName = payload.sprint_id === BACKLOG_SPRINT_ID ? 'Product Backlog' : `Sprint ${payload.sprint_id}`;
                alert(`✓ Task created successfully in ${sprintName}! (ID: ${result.task_id})`);
                closeQuickAddModal();
                
                // Only reload if it's a backlog item
                if (payload.sprint_id === BACKLOG_SPRINT_ID) {
                    loadBacklogItems();
                }
            } else {
                throw new Error(result.error || "Unknown server error during creation.");
            }
        } catch (err) {
            alert(`Error creating task: ${err.message}`);
            console.error('Submission Error:', err);
        }
    }

    // --- DRAG AND DROP LOGIC ---
    
    let draggedItem = null;

    function attachDragDropListeners() {
        document.querySelectorAll('.backlog-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = e.currentTarget;
                e.dataTransfer.setData('text/plain', draggedItem.dataset.itemId);
                setTimeout(() => draggedItem.classList.add('dragging'), 0);
            });
            item.addEventListener('dragend', () => {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
            });
        });
    }

    function handleDragOverTarget(e) {
        e.preventDefault(); 
        e.currentTarget.classList.add('drop-hover');
    }

    function handleDragLeaveTarget(e) {
        e.currentTarget.classList.remove('drop-hover');
    }

    async function handleDropToSprint(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-hover');
        
        const taskId = e.dataTransfer.getData('text/plain');
        const targetSprintId = e.currentTarget.dataset.sprintId; 

        if (!taskId || !targetSprintId) {
            console.error("Missing Task ID or Target Sprint ID for drop action.");
            return;
        }

        console.log(`[SPRINT PLANNING] Moving Task #${taskId} to Sprint #${targetSprintId}`);
        
        try {
            const response = await fetch(`${TASK_API_URL}/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sprint_id: parseInt(targetSprintId, 10),
                    status: 'TODO' 
                })
            });

            if (response.ok) {
                alert(`✓ Task #${taskId} successfully moved to Sprint #${targetSprintId}!`);
                loadBacklogItems(); // Reload to remove item from backlog
            } else {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update task via API.');
            }
        } catch (error) {
            console.error('Drag/Drop API Error:', error);
            alert(`Failed to move task: ${error.message}`);
        }
    }
});