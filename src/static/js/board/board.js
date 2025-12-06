// Global MOCK Data for demonstration (simulating fetch from Task Service)
const MOCK_TASKS = [
    { id: 101, title: 'Implement user auth API endpoint', status: 'To Do', priority: 'P1', assignee: 'Bob S.', risk_score: 95, due: 'Dec 15', projectId: '1', last_commit: 'Initial file structure setup.' },
    { id: 102, title: 'Design Database Schema for User/RBAC', status: 'In Progress', priority: 'P2', assignee: 'Alice J.', risk_score: 70, due: 'Dec 18', projectId: '1', last_commit: 'In progress - 50% complete.' },
    { id: 103, title: 'Integrate GitHub Webhook Handler', status: 'In Progress', priority: 'P1', assignee: 'You', risk_score: 45, due: 'Dec 20', projectId: '1', last_commit: 'Testing signature verification.' },
    { id: 104, title: 'Refactor old task component (Tech Debt)', status: 'Under Review', priority: 'P3', assignee: 'Charlie W.', risk_score: 15, due: 'Dec 10', projectId: '2', last_commit: 'Cleanup complete.' },
    { id: 105, title: 'Finalize Deployment Pipeline', status: 'Done', priority: 'P1', assignee: 'DevOps', risk_score: 5, due: 'Dec 05', projectId: '2', last_commit: 'Pipeline merged to main.' },
    { id: 106, title: 'Create new icon set', status: 'To Do', priority: 'P2', assignee: 'Alice J.', risk_score: 25, due: 'Dec 22', projectId: '1', last_commit: 'UI requirements gathered.' },
    { id: 107, title: 'Research new ML model for risk', status: 'To Do', priority: 'P3', assignee: 'You', risk_score: 10, due: 'Dec 25', projectId: '3', last_commit: null },
];

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
        const dueDate = document.getElementById('task-due').value;
        const selectedProject = projectFilter.value; // Get the currently selected project ID
        
        if (!title) {
            console.error("Task title is required.");
            return;
        }

        const newTask = {
            id: Date.now(),
            title: title,
            status: 'To Do', // New tasks always start in 'To Do'
            priority: priority,
            assignee: assignee,
            risk_score: 20, // Low initial AI risk score
            due: dueDate || 'TBD',
            last_commit: 'Task manually created.',
            projectId: selectedProject
        };
        
        // --- API ACTION: Submit Task Data ---
        submitNewTask(newTask);

        closeQuickAddModal();
    }
    
    function submitNewTask(taskData) {
        console.log(`[ACTION] Submitting new task for Project ${taskData.projectId}:`, taskData.title);
        
        // --- REAL API CALL Placeholder ---
        // In production, this would be a fetch POST to the Flask Controller (Task Controller):
        /*
        fetch('/api/v1/tasks', { ... })
        .then(response => response.json())
        .then(data => {
            // Assuming the API returns success, add the card to the UI
            addCardToBoard(data.task);
        });
        */
        
        // --- Simulation Success ---
        // Only add the task to the board if it matches the current filter selection
        const currentFilterId = projectFilter.value;
        if (currentFilterId === taskData.projectId || currentFilterId === 'all') {
             addCardToBoard(taskData);
        }
    }
    
    function addCardToBoard(task) {
        const card = createTaskCard(task);
        const todoList = document.querySelector('#column-todo .task-list');
        
        todoList.appendChild(card);
        updateTaskCounts();
        attachDragListeners(); // Attach drag listeners to the new card
    }

});

// --- TASK RENDERING AND MAPPING (REMAINING FUNCTIONS) ---

function getRiskClass(score) {
    if (score >= 80) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

function getPriorityClass(priority) {
    return `priority-${priority.toLowerCase()}`;
}

function createTaskCard(task) {
    const riskClass = getRiskClass(task.risk_score);
    const priorityClass = getPriorityClass(task.priority);
    
    const card = document.createElement('div');
    card.className = `task-card risk-${riskClass}`;
    card.draggable = true;
    card.id = `task-${task.id}`;
    card.setAttribute('data-task-id', task.id);
    card.setAttribute('data-priority', task.priority);
    
    card.innerHTML = `
        <div class="card-header">
            <span class="task-title">${task.title}</span>
            <span class="priority-tag ${priorityClass}">${task.priority}</span>
        </div>
        <small class="task-id">WI-${task.id} (P-${task.projectId})</small>
        <p class="last-commit">${task.last_commit || 'No recent commit.'}</p>
        <div class="card-details">
            <div class="task-assignee">
                <i class="fas fa-user-circle"></i> ${task.assignee}
            </div>
            <div class="risk-score">
                <i class="fas fa-microchip"></i> AI Risk: ${task.risk_score}%
            </div>
            <div class="task-due">
                <i class="fas fa-clock"></i> ${task.due}
            </div>
        </div>
    `;
    return card;
}

function loadTasksToBoard() {
    console.log("Fetching tasks and AI scores from Task Service...");
    const columns = {};
    document.querySelectorAll('.kanban-column').forEach(col => {
        columns[col.getAttribute('data-status')] = col.querySelector('.task-list');
    });
    
    const currentFilterId = document.getElementById('project-filter').value;
    
    // Filter tasks based on selected project ID
    const tasksToLoad = MOCK_TASKS.filter(task => 
        currentFilterId === 'all' || task.projectId === currentFilterId
    );

    // --- SIMULATION of API fetch('/api/v1/tasks') ---
    setTimeout(() => {
        tasksToLoad.forEach(task => {
            const card = createTaskCard(task);
            if (columns[task.status]) {
                columns[task.status].appendChild(card);
            }
        });
        updateTaskCounts();
        attachDragListeners();
    }, 500); // Quick load simulation
}

// --- DRAG AND DROP LOGIC (REMOVED GLOBAL WINDOW FUNCS) ---

let draggedItem = null;

function attachDragListeners() {
    document.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });
}

// Handler executed when drag starts on a task card
function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.setData('text/plain', this.getAttribute('data-task-id'));
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
    const list = e.currentTarget;
    if (draggedItem && draggedItem.parentElement !== list) {
        list.classList.add('drag-over');
    }
}

// Global function (called from ondrop in HTML)
window.handleDrop = function(e) {
    e.preventDefault();
    const list = e.currentTarget;
    list.classList.remove('drag-over');
    
    if (draggedItem) {
        const taskId = draggedItem.getAttribute('data-task-id');
        const oldStatus = draggedItem.closest('.kanban-column').getAttribute('data-status');
        const newStatus = list.closest('.kanban-column').getAttribute('data-status');
        
        // Move the element in the DOM
        list.appendChild(draggedItem);
        
        // --- API ACTION: Update Task Status ---
        updateTaskStatus(taskId, newStatus, oldStatus);
        updateTaskCounts();
    }
}

// --- BACKEND INTEGRATION LOGIC ---

function updateTaskStatus(taskId, newStatus, oldStatus) {
    console.log(`[ACTION] Updating Task WI-${taskId}: ${oldStatus} -> ${newStatus}`);
    
    // --- REAL API CALL Placeholder ---
    // In production, this would be a fetch POST/PUT to the Flask Controller:
    /*
    fetch(`/api/v1/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Status update failed');
        }
        console.log(`Task ${taskId} status updated successfully.`);
    })
    .catch(error => {
        console.error("Status Update Failed:", error);
        // --- Rollback Logic ---
        // Find the old column and move the card back on failure
        const oldColumn = document.querySelector(`[data-status="${oldStatus}"] .task-list`);
        oldColumn.appendChild(document.getElementById(`task-${taskId}`));
        updateTaskCounts();
    });
    */
}

function updateTaskCounts() {
    document.querySelectorAll('.kanban-column').forEach(column => {
        const count = column.querySelector('.task-list').children.length;
        column.querySelector('.task-count').textContent = `(${count})`;
    });
}