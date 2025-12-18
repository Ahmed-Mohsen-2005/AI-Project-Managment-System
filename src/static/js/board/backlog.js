// =================================================================
// backlog.js - Enhanced with ALL Task fields + Sprint Selection
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration Constants ---
    const BACKLOG_API_URL = '/api/v1/tasks/backlog';
    const TASK_API_URL = '/api/v1/tasks';
    const SPRINT_API_URL = '/api/v1/sprints';
    const USER_API_URL = '/api/v1/users';
    const DOCUMENTATION_API_URL = '/api/v1/documentation';
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
    const generateDocsBtn = document.getElementById('generate-docs-btn');
    const docModal = document.getElementById('doc-sprint-modal');
    const docSprintSelect = document.getElementById('doc-sprint-select');
    const docSprintForm = document.getElementById('doc-sprint-form');
    const docOutput = document.getElementById('doc-output');
    const docContent = document.getElementById('doc-content');
    
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

    // --- DOCUMENTATION EVENT LISTENERS ---
    if (generateDocsBtn) generateDocsBtn.addEventListener('click', openDocModal);
    if (docSprintForm) docSprintForm.addEventListener('submit', handleDocGeneration);

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
        if (!dbPriority) return 'P2';
        switch (dbPriority.toUpperCase()) {
            case 'HIGH': return 'P1';
            case 'MEDIUM': return 'P2';
            case 'LOW': return 'P3';
            default: return 'P2';
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

    // --- DOCUMENTATION GENERATION LOGIC ---
    
    function openDocModal() {
        docModal.style.display = 'block';
        loadSprintsForDoc();
    }
    
    window.closeDocModal = function() {
        docModal.style.display = 'none';
        docSprintForm.reset();
    };
    
    async function loadSprintsForDoc() {
        if (!docSprintSelect) return;
        
        try {
            const response = await fetch(SPRINT_API_URL);
            if (!response.ok) throw new Error('Failed to fetch sprints');
            
            const sprints = await response.json();
            docSprintSelect.innerHTML = '';
            
            // Add only non-backlog sprints
            sprints.forEach(sprint => {
                if (sprint.sprint_id === BACKLOG_SPRINT_ID) return;
                
                const option = document.createElement('option');
                option.value = sprint.sprint_id;
                let displayName = sprint.name;
                if (sprint.start_date && sprint.end_date) {
                    const startDate = new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const endDate = new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    displayName += ` (${startDate} - ${endDate})`;
                }
                option.textContent = displayName;
                docSprintSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('[ERROR] Failed to load sprints for documentation:', error);
            docSprintSelect.innerHTML = '<option value="">Failed to load sprints</option>';
        }
    }
    
    async function handleDocGeneration(e) {
        e.preventDefault();
        
        const sprintId = docSprintSelect.value;
        if (!sprintId) {
            alert('Please select a sprint');
            return;
        }
        
        closeDocModal();
        showLoadingDoc();
        
        try {
            // Step 1: Fetch sprint documentation data
            const response = await fetch(`${DOCUMENTATION_API_URL}/sprint/${sprintId}`);
            if (!response.ok) throw new Error('Failed to fetch sprint data');
            
            const docData = await response.json();
            
            // Step 2: Generate AI summary using Claude
            const aiSummary = await generateAISummary(docData);
            
            // Step 3: Display the documentation
            displayDocumentation(docData, aiSummary);
            
        } catch (error) {
            console.error('[ERROR] Documentation generation failed:', error);
            docContent.innerHTML = `<p style="color: #ef4444;">Error: ${error.message}</p>`;
        }
    }
    
    function showLoadingDoc() {
        docOutput.style.display = 'block';
        docContent.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border-width: 4px;"></div>
                <p style="margin-top: 20px; color: #6b7280;">Generating documentation with AI...</p>
            </div>
        `;
        docOutput.scrollIntoView({ behavior: 'smooth' });
    }
    
    async function generateAISummary(docData) {
        const response = await fetch(
            `/api/v1/documentation/sprint/${docData.sprint_info.sprint_id}/ai-summary`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: docData.ai_summary_prompt
                })
            }
        );

        if (!response.ok) {
            throw new Error("AI summary request failed");
        }

        const data = await response.json();
        return data.summary;
    }

    
    function displayDocumentation(docData, aiSummary) {
        const { sprint_info, metrics, tasks } = docData;
        
        const html = `
            <div style="margin-bottom: 20px;">
                <button onclick="downloadDocumentation()" class="btn btn-primary" style="float: right;">
                    <i class="fas fa-download"></i> Download PDF
                </button>
                <h3>${sprint_info.name}</h3>
                <p style="color: #6b7280;">
                    ${sprint_info.start_date ? new Date(sprint_info.start_date).toLocaleDateString() : 'N/A'} - 
                    ${sprint_info.end_date ? new Date(sprint_info.end_date).toLocaleDateString() : 'N/A'}
                </p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4>📊 Sprint Metrics</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${metrics.completed_tasks}/${metrics.total_tasks}</div>
                        <div style="color: #6b7280; font-size: 14px;">Tasks Completed</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #10b981;">${metrics.completion_rate}%</div>
                        <div style="color: #6b7280; font-size: 14px;">Completion Rate</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${metrics.completed_hours}h</div>
                        <div style="color: #6b7280; font-size: 14px;">Hours Delivered</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${metrics.blocked_tasks}</div>
                        <div style="color: #6b7280; font-size: 14px;">Blocked Tasks</div>
                    </div>
                </div>
            </div>
            
            <div style="background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4>🤖 AI-Generated Summary</h4>
                <div style="margin-top: 15px; line-height: 1.6; white-space: pre-wrap;">${aiSummary}</div>
            </div>
            
            <div>
                <h4>✅ Completed Tasks (${tasks.completed.length})</h4>
                <ul style="list-style: none; padding: 0;">
                    ${tasks.completed.map(t => `
                        <li style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                            <strong>#${t.task_id}</strong> - ${t.title}
                            <span style="color: #6b7280; font-size: 12px; margin-left: 10px;">
                                ${t.estimate_hours ? t.estimate_hours + 'h' : ''} | Priority: ${t.priority}
                            </span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            ${tasks.blocked.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h4>🚫 Blocked Tasks (${tasks.blocked.length})</h4>
                    <ul style="list-style: none; padding: 0;">
                        ${tasks.blocked.map(t => `
                            <li style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #ef4444;">
                                <strong>#${t.task_id}</strong> - ${t.title}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        docContent.innerHTML = html;
        docOutput.scrollIntoView({ behavior: 'smooth' });
    }
    
    window.downloadDocumentation = function() {
        alert('PDF download feature coming soon! For now, you can copy the documentation text.');
    };
});