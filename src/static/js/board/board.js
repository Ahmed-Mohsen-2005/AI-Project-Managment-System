// No more mock data - tasks will be loaded from the database
document.addEventListener('DOMContentLoaded', () => {
    const quickAddBtn = document.getElementById('quick-add-task-btn');
    const modal = document.getElementById('quick-add-modal');
    const closeBtn = document.querySelector('.close-btn');
    const quickAddForm = document.getElementById('quick-add-form');
    const projectFilter = document.getElementById('project-filter');

    // Initialize the board and load tasks for the default project
    loadTasksToBoard();

    // Attach initial drag events (will be re-attached after load/filter)
    attachDragListeners();

    // --- EVENT LISTENERS ---
    quickAddBtn.addEventListener('click', openQuickAddModal);
    closeBtn.addEventListener('click', closeQuickAddModal);

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeQuickAddModal();
        }
    });

    quickAddForm.addEventListener('submit', handleQuickAddSubmit);
    projectFilter.addEventListener('change', handleProjectFilterChange);

    // --- MODAL CONTROL LOGIC ---
    function openQuickAddModal() {
        modal.style.display = 'block';
    }

    function closeQuickAddModal() {
        modal.style.display = 'none';
        quickAddForm.reset(); // Clear the form on close
    }

    // --- PROJECT FILTER LOGIC ---
    function handleProjectFilterChange() {
        // Triggered when user selects a different project from the dropdown
        console.log(`[FILTER] Changing board view...`);
        clearBoard();
        loadTasksToBoard();
    }

    function clearBoard() {
        // Removes all cards from all columns
        document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
    }

    // --- TASK SUBMISSION LOGIC ---
    function handleQuickAddSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('task-title-input').value.trim();
        const assignee = document.getElementById('task-assignee').value;
        const priority = document.getElementById('task-priority').value;
        const status = document.getElementById('task-status').value;
        const estimateHours = parseFloat(document.getElementById('task-estimate').value);
        const dueDate = document.getElementById('task-due').value;
        const selectedProject = projectFilter.value;

        console.log('[DEBUG] Form values:', { title, assignee, priority, status, estimateHours, dueDate, selectedProject });

        // Validation
        if (!title) {
            alert("Please enter a task title.");
            return;
        }
        if (!estimateHours || estimateHours <= 0) {
            alert("Please enter a valid estimate (hours must be greater than 0).");
            return;
        }
        if (!dueDate) {
            alert("Please select a due date.");
            return;
        }

        // Map UI status to backend enum
        const statusMap = {
            'To Do': 'TODO',
            'In Progress': 'IN_PROGRESS',
            'Under Review': 'IN_REVIEW',
            'Done': 'DONE'
        };

        // If "View All Projects" is selected, default to project 1
        const actualProjectId = (selectedProject === 'all') ? 1 : parseInt(selectedProject);
        
        const newTask = {
            title: title,
            sprint_id: actualProjectId,
            status: statusMap[status] || 'TODO',
            priority: priority.toUpperCase(),
            assigned_id: getAssigneeId(assignee),
            estimate_hours: estimateHours,
            due_date: dueDate
        };

        console.log('[DEBUG] Task object to submit:', newTask);

        // --- API ACTION: Submit Task Data ---
        submitNewTask(newTask, actualProjectId.toString(), status);
        closeQuickAddModal();
    }

    // Helper function to map assignee names to IDs
    function getAssigneeId(assigneeName) {
        const assigneeMap = {
            'You': 1,
            'Alice J.': 2,
            'Bob S.': 3,
            'Charlie W.': 4,
            'DevOps': 5
        };
        return assigneeMap[assigneeName] || 1;
    }

    function submitNewTask(taskData, projectId, uiStatus) {
        console.log(`[ACTION] Submitting new task for Project ${projectId}`);
        console.log('[DEBUG] Task data being sent:', JSON.stringify(taskData, null, 2));
        console.log('[DEBUG] projectId type:', typeof projectId, 'value:', projectId);

        // --- REAL API CALL to Flask Backend ---
        fetch('/api/v1/tasks/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        })
        .then(response => {
            console.log('[DEBUG] Response status:', response.status);
            console.log('[DEBUG] Response ok:', response.ok);
            if (!response.ok) {
                return response.json().then(err => {
                    console.error('[ERROR] Server returned error:', err);
                    throw new Error(err.error || 'Failed to create task');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('[SUCCESS] Task created successfully!');
            console.log('[DEBUG] Server response:', data);
            console.log('[DEBUG] Task saved with sprint_id:', taskData.sprint_id);

            // Create a task object for the UI with the returned task_id
            const uiTask = {
                id: data.task_id,
                title: taskData.title,
                status: uiStatus, // Use the status from the form
                priority: taskData.priority.charAt(0) + taskData.priority.slice(1).toLowerCase(), // Convert to 'High', 'Medium', 'Low'
                assignee: getAssigneeName(taskData.assigned_id),
                due: formatDate(taskData.due_date),
                projectId: taskData.sprint_id.toString() // Use the ACTUAL sprint_id from the saved task
            };

            console.log('[DEBUG] UI task object:', uiTask);

            // Only add to board if it matches current filter
            const currentFilterId = document.getElementById('project-filter').value;
            console.log('[DEBUG] Current filter:', currentFilterId, 'Task sprint_id:', uiTask.projectId);
            
            if (currentFilterId === uiTask.projectId || currentFilterId === 'all') {
                addCardToBoard(uiTask);
                console.log('[DEBUG] Task added to board UI');
            } else {
                console.log('[DEBUG] Task not added to UI (filter mismatch)', 
                    'currentFilterId:', currentFilterId, 
                    'uiTask.projectId:', uiTask.projectId);
            }

            alert('✅ Task created successfully! Sprint ID: ' + taskData.sprint_id);
        })
        .catch(error => {
            console.error('[ERROR] Failed to create task:', error);
            console.error('[ERROR] Error details:', error.message);
            alert(`❌ Failed to create task: ${error.message}`);
        });
    }

    // Helper function to convert assignee ID back to name for UI
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

    // Helper function to format date for display
    function formatDate(dateString) {
        if (!dateString) {
            console.log('[DEBUG] No date provided, returning TBD');
            return 'TBD';
        }
        try {
            const date = new Date(dateString);
            const month = date.toLocaleString('en-US', { month: 'short' });
            const day = date.getDate();
            return `${month} ${day}`;
        } catch (error) {
            console.error('[ERROR] Failed to format date:', dateString, error);
            return 'TBD';
        }
    }

    function addCardToBoard(task) {
        // Map status to column
        const statusToColumnMap = {
            'To Do': '#column-todo',
            'In Progress': '#column-in-progress',
            'Under Review': '#column-review',
            'Done': '#column-done'
        };

        const columnSelector = statusToColumnMap[task.status] || '#column-todo';
        const targetList = document.querySelector(`${columnSelector} .task-list`);
        
        if (targetList) {
            const card = createTaskCard(task);
            targetList.appendChild(card);
            updateTaskCounts();
            attachDragListeners(); // Attach drag listeners to the new card
        } else {
            console.error('[ERROR] Could not find target column for status:', task.status);
        }
    }
});

// --- TASK RENDERING AND MAPPING (REMAINING FUNCTIONS) ---
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

    // Attach delete button event listener
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

    // Determine the API endpoint based on filter
    let apiUrl;
    if (currentFilterId === 'all') {
        apiUrl = '/api/v1/tasks/';
    } else {
        apiUrl = `/api/v1/tasks/sprint/${currentFilterId}`;
    }

    console.log(`[DEBUG] Current filter: "${currentFilterId}" (type: ${typeof currentFilterId})`);
    console.log(`[DEBUG] Fetching from: ${apiUrl}`);

    // --- REAL API CALL to fetch tasks from database ---
    fetch(apiUrl)
        .then(response => {
            console.log(`[DEBUG] Response status: ${response.status}`);
            console.log(`[DEBUG] Response ok: ${response.ok}`);
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
            console.log('[DEBUG] Raw tasks data:', JSON.stringify(tasksFromDB, null, 2));

            // Convert database task format to UI format
            tasksFromDB.forEach((dbTask, index) => {
                console.log(`[DEBUG] Processing task ${index + 1}/${tasksFromDB.length}:`, dbTask);
                const uiTask = convertDBTaskToUI(dbTask);
                console.log(`[DEBUG] Converted to UI:`, uiTask);
                const card = createTaskCard(uiTask);
                if (columns[uiTask.status]) {
                    columns[uiTask.status].appendChild(card);
                    console.log(`[DEBUG] Added task "${uiTask.title}" to column "${uiTask.status}"`);
                } else {
                    console.error(`[ERROR] No column found for status: ${uiTask.status}`);
                }
            });

            updateTaskCounts();
            attachDragListeners();
            console.log('[SUCCESS] Board loaded and rendered');
        })
        .catch(error => {
            console.error('[ERROR] Failed to load tasks:', error);
            console.error('[ERROR] Error details:', error.message);
            // Don't show alert on page load - just log the error
            // Tasks might not exist yet, which is okay
            updateTaskCounts();
        });
}

// Convert database task format to UI format
function convertDBTaskToUI(dbTask) {
    console.log('[DEBUG] Converting DB task:', dbTask);

    // Map database status to UI status
    const statusMap = {
        'TODO': 'To Do',
        'IN_PROGRESS': 'In Progress',
        'IN_REVIEW': 'Under Review',
        'DONE': 'Done',
        // Handle lowercase versions as well
        'todo': 'To Do',
        'in_progress': 'In Progress',
        'in_review': 'Under Review',
        'done': 'Done'
    };

    // Map database priority to UI priority
    const priorityMap = {
        'HIGH': 'High',
        'MEDIUM': 'Medium',
        'LOW': 'Low',
        // Handle lowercase versions as well
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low'
    };

    const uiTask = {
        id: dbTask.task_id,
        title: dbTask.title,
        status: statusMap[dbTask.status] || 'To Do',
        priority: priorityMap[dbTask.priority] || 'Medium',
        assignee: getAssigneeName(dbTask.assigned_id),
        due: formatDate(dbTask.due_date),
        projectId: dbTask.sprint_id?.toString() || '1'
    };

    console.log('[DEBUG] Converted to UI task:', uiTask);
    return uiTask;
}

// Helper function to convert assignee ID back to name for UI
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

// Helper function to format date for display
function formatDate(dateString) {
    if (!dateString) {
        return 'TBD';
    }
    try {
        const date = new Date(dateString);
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
    } catch (error) {
        console.error('[ERROR] Failed to format date:', dateString, error);
        return 'TBD';
    }
}

// --- DELETE TASK FUNCTIONALITY ---
function handleDeleteTask(e) {
    e.stopPropagation(); // Prevent card drag from triggering
    
    const taskId = this.getAttribute('data-task-id');
    const taskCard = document.getElementById(`task-${taskId}`);
    const taskTitle = taskCard.querySelector('.task-title').textContent;
    
    // Confirm deletion
    if (confirm(`Are you sure you want to delete task: "${taskTitle}"?`)) {
        deleteTask(taskId);
    }
}

function deleteTask(taskId) {
    console.log(`[ACTION] Deleting Task ${taskId}`);
    
    const taskCard = document.getElementById(`task-${taskId}`);
    
    // --- REAL API CALL to Flask Backend ---
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
        
        // Remove task card from DOM with animation
        if (taskCard) {
            taskCard.classList.add('deleting');
            setTimeout(() => {
                taskCard.remove();
                updateTaskCounts();
            }, 300); // Smooth animation before removal
        }
        
        // Show success notification
        showNotification('Task deleted successfully', 'success');
    })
    .catch(error => {
        console.error('[ERROR] Failed to delete task:', error);
        alert(`❌ Failed to delete task: ${error.message}`);
    });
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // You can implement a toast notification system here if desired
}

// --- DRAG AND DROP LOGIC ---
let draggedItem = null;

function attachDragListeners() {
    document.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        
        // Attach delete button listener if not already attached
        const deleteBtn = card.querySelector('.delete-task-btn');
        if (deleteBtn && !deleteBtn.hasAttribute('data-listener-attached')) {
            deleteBtn.addEventListener('click', handleDeleteTask);
            deleteBtn.setAttribute('data-listener-attached', 'true');
        }
    });
}

// Handler executed when drag starts on a task card
function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    setTimeout(() => this.classList.add('dragging'), 0);
}

// Handler executed when drag ends
function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
}

// Global function (called from ondragover in HTML)
window.handleDragOver = function(e) {
    e.preventDefault(); // Allows element to be dropped
    e.dataTransfer.dropEffect = 'move';
    const list = e.currentTarget;
    if (draggedItem && draggedItem.parentElement !== list) {
        list.classList.add('drag-over');
    }
}

// Global function (called from ondragleave in HTML)
window.handleDragLeave = function(e) {
    e.currentTarget.classList.remove('drag-over');
}

// Global function (called from ondrop in HTML)
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

        // Only update if status actually changed
        if (oldStatus !== newStatus) {
            console.log(`[ACTION] Moving Task ${taskId} from "${oldStatus}" to "${newStatus}"`);
            
            // Store reference to old list for rollback
            const oldList = draggedItem.parentElement;
            
            // Optimistically move the element in the DOM
            list.appendChild(draggedItem);
            updateTaskCounts();

            // --- API ACTION: Update Task Status in Backend ---
            updateTaskStatus(taskId, newStatus, oldStatus, oldList);
        }
    }
}

// --- BACKEND INTEGRATION LOGIC ---
function updateTaskStatus(taskId, newStatus, oldStatus, oldList) {
    console.log(`[ACTION] Updating Task ${taskId}: ${oldStatus} -> ${newStatus}`);

    // Map UI status to backend enum values
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

    console.log(`[DEBUG] Sending status update: ${backendStatus}`);

    // --- REAL API CALL to Flask Backend ---
    fetch(`/api/v1/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: backendStatus })
    })
    .then(response => {
        console.log(`[DEBUG] Response status: ${response.status}`);
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Status update failed');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log(`[SUCCESS] Task ${taskId} status updated successfully to ${newStatus}`);
        console.log(`[DEBUG] Server response:`, data);
        
        // Update was successful - UI already reflects the change
        // Show success notification
        showNotification(`Task moved to ${newStatus}`, 'success');
    })
    .catch(error => {
        console.error("[ERROR] Status Update Failed:", error);
        console.error("[ERROR] Error details:", error.message);
        
        // --- Rollback Logic ---
        // Move the card back to its original position on failure
        const taskCard = document.getElementById(`task-${taskId}`);
        if (oldList && taskCard) {
            console.log(`[ROLLBACK] Moving task back to ${oldStatus}`);
            oldList.appendChild(taskCard);
            updateTaskCounts();
        }
        
        // Show error message to user
        alert(`❌ Failed to update task status: ${error.message}\nThe task has been moved back to ${oldStatus}.`);
    });
}

function updateTaskCounts() {
    document.querySelectorAll('.kanban-column').forEach(column => {
        const count = column.querySelector('.task-list').children.length;
        column.querySelector('.task-count').textContent = `${count}`;
    });
}