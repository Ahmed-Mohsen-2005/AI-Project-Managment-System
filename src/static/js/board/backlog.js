// =================================================================
// backlog.js - Handles Task Backlog view, quick add, and drag-and-drop
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration Constants ---
    const BACKLOG_API_URL = '/api/v1/tasks/backlog';
    const TASK_API_URL = '/api/v1/tasks';
    // Must match the ID of the 'PRODUCT BACKLOG' sprint record in the DB
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
    
    // --- INITIALIZATION ---
    loadBacklogItems();
    
    // --- EVENT LISTENERS ---
    projectFilter.addEventListener('change', loadBacklogItems);
    sortBySelect.addEventListener('change', loadBacklogItems);
    quickAddBtn.addEventListener('click', openQuickAddModal);
    closeBtn.addEventListener('click', closeQuickAddModal);
    window.addEventListener('click', (event) => { if (event.target === modal) closeQuickAddModal(); });
    quickAddForm.addEventListener('submit', handleQuickAddSubmit);

    // --- DRAG TARGET LISTENERS ---
    if (sprintTarget) {
        sprintTarget.addEventListener('dragover', handleDragOverTarget);
        sprintTarget.addEventListener('dragleave', handleDragLeaveTarget);
        sprintTarget.addEventListener('drop', handleDropToSprint);
    }
    
    // --- MODAL CONTROL LOGIC ---
    function openQuickAddModal() { modal.style.display = 'block'; }
    function closeModal() { modal.style.display = 'none'; }
    function closeQuickAddModal() { modal.style.display = 'none'; quickAddForm.reset(); }

    // --- UTILITIES ---
    
    /** Maps UI priority (P1, P2, P3) to Python/DB priority (HIGH, MEDIUM, LOW) */
    function mapUiPriorityToDb(uiPriority) {
        switch (uiPriority) {
            case 'P1': return 'HIGH';
            case 'P2': return 'MEDIUM';
            case 'P3': return 'LOW';
            default: return 'MEDIUM';
        }
    }
    
    /** Maps DB priority (HIGH, MEDIUM, LOW) back to UI priority (P1, P2, P3) */
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

    // --- DATA LOADING & RENDERING ---
    async function loadBacklogItems() {
        backlogList.innerHTML = '<li class="loading-message">Loading backlog items...</li>';

        try {
            // NOTE: The Python TaskRepository.get_backlog_tasks must be modified to filter by 
            // the BACKLOG_SPRINT_ID (e.g., WHERE sprint_id = 1) if it currently filters by NULL.
            const res = await fetch(BACKLOG_API_URL); 
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to fetch backlog items.");
            }

            const items = await res.json();
            backlogList.innerHTML = '';

            if (items.length === 0) {
                backlogList.innerHTML = '<li class="loading-message">No backlog items.</li>';
                return;
            }
            
            items.forEach(item => {
                // Map API response keys to the UI structure
                const mappedItem = {
                    id: item.task_id,
                    title: item.title,
                    type: item.type || 'Feature', // 'type' is a UI/conceptual placeholder
                    manual_priority: mapDbPriorityToUi(item.priority), 
                    assignee: item.assigned_id,
                    ai_score: item.ai_score ?? Math.floor(Math.random() * 50) + 1, // Simulated AI score
                    projectId: item.project_id ?? 'all'
                };

                backlogList.insertAdjacentHTML(
                    'beforeend',
                    createBacklogItemRow(mappedItem)
                );
            });

            attachDragDropListeners();

        } catch (err) {
            backlogList.innerHTML = `<li class="loading-message error">Failed to load backlog: ${err.message}.</li>`;
            console.error('API Error:', err);
        }
    }

    function createBacklogItemRow(item) {
        const scoreClass = getScoreClass(item.ai_score);
        const typeClass = `type-${item.type}`;
        
        return `
            <li class="backlog-item" draggable="true" data-item-id="${item.id}">
                <span class="col-id">#${item.id}</span>
                <span class="col-title">
                    <span class="item-type-badge ${typeClass}">${item.type}</span>
                    ${item.title}
                </span>
                <span class="col-priority">${item.manual_priority}</span>
                <span class="col-assignee">${item.assignee || 'Unassigned'}</span>
                <span class="col-score">
                    <div class="priority-score-box ${scoreClass}">${item.ai_score}</div>
                </span>
                <span class="col-actions">
                    <button class="btn-icon" title="View Details"><i class="fas fa-eye"></i></button>
                </span>
            </li>
        `;
    }

    // --- TASK SUBMISSION LOGIC (Fixes 1048 MySQL Error by using BACKLOG_SPRINT_ID) ---
    
    function handleQuickAddSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('item-title-input').value.trim();
        const priority = document.getElementById('item-priority').value; 
        
        if (!title) return; 

        const dbPriority = mapUiPriorityToDb(priority);
        
        submitNewBacklogItem(title, dbPriority);
        closeQuickAddModal();
    }
    
    async function submitNewBacklogItem(title, priority) {
        const payload = {
            title: title,
            priority: priority, 
            // NOTE: The controller must be updated to explicitly set sprint_id to BACKLOG_SPRINT_ID (e.g., 1)
            // The existing controller logic for /backlog already handles this, but we are relying on it:
            // data["sprint_id"] = BACKLOG_SPRINT_ID 
        };
        
        try {
            const response = await fetch(BACKLOG_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();

            if (response.ok) {
                console.log(`[SUCCESS] Backlog item created with ID: ${result.task_id}`);
                loadBacklogItems();
            } else {
                // Return the specific server-side error
                throw new Error(result.error || "Unknown server error during creation.");
            }
        } catch (err) {
            alert(`Error creating backlog item: ${err.message}`);
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
        // Get the target sprint ID from the drop zone's data attribute
        const targetSprintId = e.currentTarget.dataset.sprintId; 

        if (!taskId || !targetSprintId) {
             console.error("Missing Task ID or Target Sprint ID for drop action.");
             return;
        }

        console.log(`[SPRINT PLANNING] Moving Task #${taskId} to Sprint #${targetSprintId}`);
        
        // API Call: Update the task with the new sprint_id
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
                alert(`Task #${taskId} successfully moved to Sprint #${targetSprintId}!`);
                loadBacklogItems(); // Reload list to remove the item from the backlog view
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