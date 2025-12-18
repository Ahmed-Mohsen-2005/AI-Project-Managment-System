// Kanban Board - Task Management with Modal Popups
const TASKS_API_URL = '/api/v1/tasks';
const SPRINTS_API_URL = '/api/v1/sprints';
const USERS_API_URL = '/api/v1/users';

document.addEventListener('DOMContentLoaded', () => {
    const quickAddBtn = document.getElementById('quick-add-task-btn');
    const projectFilter = document.getElementById('project-filter');

    // Initialize the board and load tasks for the default project
    loadTasksToBoard();

    // Attach initial drag events (will be re-attached after load/filter)
    attachDragListeners();

    // --- EVENT LISTENERS ---
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => openAddTaskModal());
    }
    
    if (projectFilter) {
        projectFilter.addEventListener('change', handleProjectFilterChange);
    }

    // ------------------------------------------------
    // MODAL UTILITY FUNCTIONS
    // ------------------------------------------------

    function createModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 0;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        `;
        
        modal.innerHTML = `
            <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                <h2 class="modal-title" style="margin: 0; font-size: 20px; color: #2c3e50;">${title}</h2>
                <button class="modal-close" aria-label="Close" style="background: none; border: none; font-size: 28px; color: #95a5a6; cursor: pointer; line-height: 1; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
                ${content}
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
        
        // Close on X button click
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#ecf0f1';
            closeBtn.style.color = '#2c3e50';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
            closeBtn.style.color = '#95a5a6';
        });
        closeBtn.addEventListener('click', () => closeModal(overlay));
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal(overlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        return overlay;
    }

    function closeModal(overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            overlay.remove();
        }, 200);
    }

    // ------------------------------------------------
    // ADD TASK MODAL
    // ------------------------------------------------

    async function openAddTaskModal() {
        // Show loading state
        const loadingModal = createModal('Add New Task', '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #3498db;"></i><p style="margin-top: 15px; color: #7f8c8d;">Loading data...</p></div>');
        
        // Fetch sprints and users data
        let sprints = [];
        let users = [];
        
        try {
            // Fetch sprints
            const sprintsResponse = await fetch(SPRINTS_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            if (sprintsResponse.ok) {
                sprints = await sprintsResponse.json();
            }
            
            // Fetch users
            const usersResponse = await fetch(USERS_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            if (usersResponse.ok) {
                users = await usersResponse.json();
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            closeModal(loadingModal);
            alert('Error loading data. Please try again.');
            return;
        }
        
        // Close loading modal
        closeModal(loadingModal);
        
        // Build sprint options HTML
        const sprintOptions = sprints.length > 0 
            ? sprints.map(sprint => `<option value="${sprint.sprint_id}">${sprint.name}</option>`).join('')
            : '<option value="">No sprints available</option>';
        
        // Build user options HTML
        const userOptions = users.length > 0
            ? users.map(user => `<option value="${user.user_id}">${user.name || user.username || `User #${user.user_id}`}</option>`).join('')
            : '<option value="">No users available</option>';
        
        const modalContent = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">
                        Task Title <span style="color: red;">*</span>
                    </label>
                    <input type="text" id="modal-task-title" placeholder="Enter task title" 
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">
                            Sprint <span style="color: red;">*</span>
                        </label>
                        <select id="modal-task-sprint" required
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; cursor: pointer; background: white;">
                            ${sprintOptions}
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">
                            Assigned To <span style="color: red;">*</span>
                        </label>
                        <select id="modal-task-assigned" required
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; cursor: pointer; background: white;">
                            ${userOptions}
                        </select>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">
                            Status
                        </label>
                        <select id="modal-task-status" 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; cursor: pointer; background: white;">
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="IN_REVIEW">IN REVIEW</option>
                            <option value="DONE">DONE</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">
                            Priority
                        </label>
                        <select id="modal-task-priority" 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; cursor: pointer; background: white;">
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM" selected>MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">
                            Estimate (hrs)
                        </label>
                        <input type="number" id="modal-task-estimate" placeholder="0" step="0.5" min="0"
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">
                        Due Date
                    </label>
                    <input type="date" id="modal-task-due-date"
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button id="modal-cancel-task" 
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s;">
                        Cancel
                    </button>
                    <button id="modal-submit-task" 
                        style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s;">
                        Add Task
                    </button>
                </div>
            </div>
        `;
        
        const modal = createModal('Add New Task', modalContent);
        
        // Add hover effects for buttons
        const cancelBtn = document.getElementById('modal-cancel-task');
        const submitBtn = document.getElementById('modal-submit-task');
        
        cancelBtn.addEventListener('mouseenter', () => cancelBtn.style.background = '#7f8c8d');
        cancelBtn.addEventListener('mouseleave', () => cancelBtn.style.background = '#95a5a6');
        submitBtn.addEventListener('mouseenter', () => submitBtn.style.background = '#229954');
        submitBtn.addEventListener('mouseleave', () => submitBtn.style.background = '#27ae60');
        
        // Focus on title input
        setTimeout(() => {
            document.getElementById('modal-task-title').focus();
        }, 100);
        
        // Cancel button
        cancelBtn.addEventListener('click', () => {
            closeModal(modal);
        });
        
        // Submit button
        submitBtn.addEventListener('click', async () => {
            await submitTaskFromModal(modal);
        });
    }

    async function submitTaskFromModal(modal) {
        const title = document.getElementById('modal-task-title').value.trim();
        const sprintSelect = document.getElementById('modal-task-sprint');
        const assignedSelect = document.getElementById('modal-task-assigned');
        const sprintId = parseInt(sprintSelect.value);
        const assignedId = parseInt(assignedSelect.value);
        const status = document.getElementById('modal-task-status').value;
        const priority = document.getElementById('modal-task-priority').value;
        const estimate = document.getElementById('modal-task-estimate').value;
        const dueDate = document.getElementById('modal-task-due-date').value;

        // Validation
        if (!title) {
            alert('Task title is required');
            document.getElementById('modal-task-title').focus();
            return;
        }

        if (!sprintId || isNaN(sprintId)) {
            alert('Please select a sprint');
            sprintSelect.focus();
            return;
        }

        if (!assignedId || isNaN(assignedId)) {
            alert('Please select a user to assign this task to');
            assignedSelect.focus();
            return;
        }

        const newTask = {
            title: title,
            sprint_id: sprintId,
            assigned_id: assignedId,
            status: status,
            priority: priority,
            estimate_hours: estimate ? parseFloat(estimate) : null,
            due_date: dueDate || null,
            created_by: assignedId
        };

        const submitBtn = document.getElementById('modal-submit-task');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        try {
            const response = await fetch(TASKS_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(newTask)
            });

            const responseText = await response.text();
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server error (${response.status}): Expected JSON response`);
            }

            const data = JSON.parse(responseText);

            if (!response.ok) {
                throw new Error(data.error || `Server error: ${response.status}`);
            }

            closeModal(modal);
            
            // Reload the kanban board to show the new task
            clearBoard();
            await loadTasksToBoard();
            
            showNotification(`✓ Task "${title}" added successfully`, 'success');

        } catch (err) {
            console.error('Error adding task:', err);
            alert(`Error adding task: ${err.message}`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Task';
        }
    }

    // ------------------------------------------------
    // PROJECT FILTER LOGIC
    // ------------------------------------------------
    
    function handleProjectFilterChange() {
        console.log(`[FILTER] Changing board view...`);
        clearBoard();
        loadTasksToBoard();
    }

    function clearBoard() {
        document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
    }

    // ------------------------------------------------
    // TASK RENDERING AND MAPPING
    // ------------------------------------------------
    
    function getPriorityClass(priority) {
        return `priority-${priority.toLowerCase()}`;
    }

    function getPriorityIcon(priority) {
        switch(priority) {
            case 'High':
                return '<i class="fas fa-exclamation-circle"></i>';
            case 'Medium':
                return '<i class="fas fa-minus-circle"></i>';
            case 'Low':
                return '<i class="fas fa-arrow-down"></i>';
            default:
                return '';
        }
    }

    function createTaskCard(task) {
        const priorityClass = getPriorityClass(task.priority);
        const priorityIcon = getPriorityIcon(task.priority);

        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.id = `task-${task.id}`;
        card.setAttribute('data-task-id', task.id);
        card.setAttribute('data-priority', task.priority);

        card.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <button class="delete-task-btn" data-task-id="${task.id}" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="task-meta">
                <span class="task-priority ${priorityClass}">
                    ${priorityIcon} ${task.priority}
                </span>
            </div>
            <div class="task-footer">
                <span class="task-assignee"><i class="fas fa-user"></i> ${task.assignee}</span>
                <span class="task-due"><i class="fas fa-calendar"></i> ${task.due}</span>
            </div>
        `;

        const deleteBtn = card.querySelector('.delete-task-btn');
        deleteBtn.addEventListener('click', handleDeleteTask);

        return card;
    }

    function loadTasksToBoard() {
        console.log("[ACTION] Loading tasks from database...");

        const columns = {};
        document.querySelectorAll('.kanban-column').forEach(col => {
            columns[col.getAttribute('data-status')] = col.querySelector('.task-list');
        });

        const currentFilterId = document.getElementById('project-filter').value;

        let apiUrl;
        if (currentFilterId === 'all') {
            apiUrl = '/api/v1/tasks/';
        } else {
            apiUrl = `/api/v1/tasks/sprint/${currentFilterId}`;
        }

        console.log(`[DEBUG] Current filter: "${currentFilterId}"`);
        console.log(`[DEBUG] Fetching from: ${apiUrl}`);

        fetch(apiUrl)
            .then(response => {
                console.log(`[DEBUG] Response status: ${response.status}`);
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error(`[ERROR] Server response: ${text}`);
                        throw new Error(`HTTP ${response.status}: ${text}`);
                    });
                }
                return response.json();
            })
            .then(tasksFromDB => {
                console.log(`[SUCCESS] Loaded ${tasksFromDB.length} tasks from database`);

                tasksFromDB.forEach((dbTask) => {
                    const uiTask = convertDBTaskToUI(dbTask);
                    const card = createTaskCard(uiTask);
                    if (columns[uiTask.status]) {
                        columns[uiTask.status].appendChild(card);
                    }
                });

                updateTaskCounts();
                attachDragListeners();
                console.log('[SUCCESS] Board loaded and rendered');
            })
            .catch(error => {
                console.error('[ERROR] Failed to load tasks:', error);
                updateTaskCounts();
            });
    }

    function convertDBTaskToUI(dbTask) {
        const statusMap = {
            'TODO': 'To Do',
            'IN_PROGRESS': 'In Progress',
            'IN_REVIEW': 'Under Review',
            'DONE': 'Done'
        };

        const priorityMap = {
            'HIGH': 'High',
            'MEDIUM': 'Medium',
            'LOW': 'Low'
        };

        return {
            id: dbTask.task_id,
            title: dbTask.title,
            status: statusMap[dbTask.status] || 'To Do',
            priority: priorityMap[dbTask.priority] || 'Medium',
            assignee: getAssigneeName(dbTask.assigned_id),
            due: formatDate(dbTask.due_date),
            projectId: dbTask.sprint_id?.toString() || '1'
        };
    }

    function getAssigneeName(assigneeId) {
        const idToNameMap = {
            1: 'You',
            2: 'Alice J.',
            3: 'Bob S.',
            4: 'Charlie W.',
            5: 'DevOps'
        };
        return idToNameMap[assigneeId] || 'Unassigned';
    }

    function formatDate(dateString) {
        if (!dateString) return 'TBD';
        try {
            const date = new Date(dateString);
            const month = date.toLocaleString('en-US', { month: 'short' });
            const day = date.getDate();
            return `${month} ${day}`;
        } catch (error) {
            return 'TBD';
        }
    }

    // ------------------------------------------------
    // DELETE TASK FUNCTIONALITY
    // ------------------------------------------------
    
    function handleDeleteTask(e) {
        e.stopPropagation();
        
        const taskId = this.getAttribute('data-task-id');
        const taskCard = document.getElementById(`task-${taskId}`);
        const taskTitle = taskCard.querySelector('.task-title').textContent;
        
        if (confirm(`Are you sure you want to delete task: "${taskTitle}"?`)) {
            deleteTask(taskId);
        }
    }

    function deleteTask(taskId) {
        console.log(`[ACTION] Deleting Task ${taskId}`);
        
        const taskCard = document.getElementById(`task-${taskId}`);
        
        fetch(`/api/v1/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Failed to delete task');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log(`[SUCCESS] Task ${taskId} deleted successfully`);
            
            if (taskCard) {
                taskCard.classList.add('deleting');
                setTimeout(() => {
                    taskCard.remove();
                    updateTaskCounts();
                }, 300);
            }
            
            showNotification('Task deleted successfully', 'success');
        })
        .catch(error => {
            console.error('[ERROR] Failed to delete task:', error);
            alert(`❌ Failed to delete task: ${error.message}`);
        });
    }

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
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ------------------------------------------------
    // DRAG AND DROP LOGIC
    // ------------------------------------------------
    
    let draggedItem = null;

    function attachDragListeners() {
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            
            const deleteBtn = card.querySelector('.delete-task-btn');
            if (deleteBtn && !deleteBtn.hasAttribute('data-listener-attached')) {
                deleteBtn.addEventListener('click', handleDeleteTask);
                deleteBtn.setAttribute('data-listener-attached', 'true');
            }
        });
    }

    function handleDragStart(e) {
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        setTimeout(() => this.classList.add('dragging'), 0);
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        draggedItem = null;
    }

    window.handleDragOver = function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const list = e.currentTarget;
        if (draggedItem && draggedItem.parentElement !== list) {
            list.classList.add('drag-over');
        }
    }

    window.handleDragLeave = function(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    window.handleDrop = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const list = e.currentTarget;
        list.classList.remove('drag-over');

        if (draggedItem) {
            const taskId = draggedItem.getAttribute('data-task-id');
            const oldColumn = draggedItem.closest('.kanban-column');
            const newColumn = list.closest('.kanban-column');
            
            const oldStatus = oldColumn.getAttribute('data-status');
            const newStatus = newColumn.getAttribute('data-status');

            if (oldStatus !== newStatus) {
                console.log(`[ACTION] Moving Task ${taskId} from "${oldStatus}" to "${newStatus}"`);
                
                const oldList = draggedItem.parentElement;
                
                list.appendChild(draggedItem);
                updateTaskCounts();

                updateTaskStatus(taskId, newStatus, oldStatus, oldList);
            }
        }
    }

    function updateTaskStatus(taskId, newStatus, oldStatus, oldList) {
        console.log(`[ACTION] Updating Task ${taskId}: ${oldStatus} -> ${newStatus}`);

        const statusMap = {
            'To Do': 'TODO',
            'In Progress': 'IN_PROGRESS',
            'Under Review': 'IN_REVIEW',
            'Done': 'DONE'
        };

        const backendStatus = statusMap[newStatus];
        
        if (!backendStatus) {
            console.error(`[ERROR] Invalid status: ${newStatus}`);
            return;
        }

        fetch(`/api/v1/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: backendStatus })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Status update failed');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log(`[SUCCESS] Task ${taskId} status updated successfully to ${newStatus}`);
            showNotification(`Task moved to ${newStatus}`, 'success');
        })
        .catch(error => {
            console.error("[ERROR] Status Update Failed:", error);
            
            const taskCard = document.getElementById(`task-${taskId}`);
            if (oldList && taskCard) {
                console.log(`[ROLLBACK] Moving task back to ${oldStatus}`);
                oldList.appendChild(taskCard);
                updateTaskCounts();
            }
            
            alert(`❌ Failed to update task status: ${error.message}\nThe task has been moved back to ${oldStatus}.`);
        });
    }

    function updateTaskCounts() {
        document.querySelectorAll('.kanban-column').forEach(column => {
            const count = column.querySelector('.task-list').children.length;
            column.querySelector('.task-count').textContent = `${count}`;
        });
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
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});