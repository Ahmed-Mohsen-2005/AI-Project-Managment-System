// Home Page / Dashboard - Updated for AUTO_INCREMENT task_id
const DASHBOARD_API_URL = '/api/v1/home/dashboard';
const TASKS_API_URL = '/api/v1/tasks';

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-summary-btn');
    const updatesInput = document.getElementById('project-updates-input');
    const addTaskBtn = document.getElementById('add-task-btn');

    // Initialize dashboard
    loadDashboardData();
    loadTodoList();

    // Event listeners
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateSummary);
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', handleAddTask);
    }

    // ------------------------------
    // Fetch & load dashboard data
    async function loadDashboardData() {
        try {
            const response = await fetch(DASHBOARD_API_URL, { method: 'GET', credentials: 'include' });

            if (response.status === 401) {
                window.location.href = '/';
                return;
            }

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            updateCalendarWidget(data.deadlines || []);
            updateNotesWidget();
            updateTimeTracker();
            updateTeamWidget();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showPlaceholderData();
        }
    }

    // ------------------------------
    // Load To-do list tasks from backend
    async function loadTodoList() {
        try {
            // Replace 1 with actual logged-in user ID if you have auth
            const response = await fetch(`${TASKS_API_URL}/user/1/recent`);
            if (!response.ok) throw new Error('Failed to fetch tasks');

            const tasks = await response.json();
            updateTodoList(tasks);
        } catch (err) {
            console.error('Error loading tasks:', err);
            updateTodoList([]);
        }
    }

    // ------------------------------
    // Update To-do list DOM
    function updateTodoList(tasks) {
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            todoList.innerHTML = '<li class="empty-state">No tasks assigned</li>';
            return;
        }

        tasks.slice(0, 5).forEach(task => {
            const li = document.createElement('li');

            // Checkbox for completion
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `task-${task.task_id}`;
            checkbox.checked = task.status === "DONE";

            // Task text
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.title;
            if (task.status === "DONE") taskText.classList.add('completed');

            // Update task status on checkbox toggle
            checkbox.addEventListener('change', async (e) => {
                const newStatus = e.target.checked ? "DONE" : "TODO";
                taskText.classList.toggle('completed', e.target.checked);

                try {
                    const response = await fetch(`${TASKS_API_URL}/${task.task_id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to update task');
                    }
                } catch (err) {
                    console.error('Failed to update task status', err);
                    alert('Error updating task');
                    e.target.checked = !e.target.checked; // revert
                    taskText.classList.toggle('completed', e.target.checked);
                }
            });

            li.appendChild(checkbox);
            li.appendChild(taskText);
            todoList.appendChild(li);
        });
    }

    // ------------------------------
    // Add new task - UPDATED: Removed task_id from payload
    function handleAddTask() {
        const todoList = document.getElementById('todo-list');

        // Check if form already exists
        if (document.querySelector('.task-form')) {
            return;
        }

        // Create form container
        const formLi = document.createElement('li');
        formLi.className = 'task-form';
        formLi.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;';

        // Create form layout
        const formHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <input type="text" id="task-title" placeholder="Task title *" required 
                    style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <input type="number" id="task-sprint" placeholder="Sprint ID *" value="1" min="1"
                        style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    
                    <input type="number" id="task-assigned" placeholder="Assigned User ID *" value="1" min="1"
                        style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                    <select id="task-status" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="DONE">DONE</option>
                    </select>
                    
                    <select id="task-priority" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM" selected>MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                    </select>
                    
                    <input type="number" id="task-estimate" placeholder="Hours" step="0.5" min="0"
                        style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <input type="date" id="task-due-date"
                    style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancel-task-btn" class="btn-cancel" 
                        style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Cancel
                    </button>
                    <button id="submit-task-btn" class="btn-submit" 
                        style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Add Task
                    </button>
                </div>
            </div>
        `;

        formLi.innerHTML = formHTML;
        todoList.insertBefore(formLi, todoList.firstChild);

        // Focus on title input
        document.getElementById('task-title').focus();

        // Handle cancel
        document.getElementById('cancel-task-btn').addEventListener('click', () => {
            formLi.remove();
        });

        // Handle submit
        document.getElementById('submit-task-btn').addEventListener('click', async () => {
            const title = document.getElementById('task-title').value.trim();
            const sprintId = parseInt(document.getElementById('task-sprint').value);
            const assignedId = parseInt(document.getElementById('task-assigned').value);
            const status = document.getElementById('task-status').value;
            const priority = document.getElementById('task-priority').value;
            const estimate = document.getElementById('task-estimate').value;
            const dueDate = document.getElementById('task-due-date').value;

            // Validation
            if (!title) {
                alert('Task title is required');
                document.getElementById('task-title').focus();
                return;
            }

            if (!sprintId || sprintId < 1) {
                alert('Valid Sprint ID is required');
                document.getElementById('task-sprint').focus();
                return;
            }

            if (!assignedId || assignedId < 1) {
                alert('Valid Assigned User ID is required');
                document.getElementById('task-assigned').focus();
                return;
            }

            // UPDATED: No task_id field - database will auto-generate it
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

            // Disable submit button
            const submitBtn = document.getElementById('submit-task-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Adding...';

            try {
                console.log('Sending POST to:', TASKS_API_URL);
                console.log('Task data:', JSON.stringify(newTask, null, 2));
                
                const response = await fetch(TASKS_API_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(newTask)
                });

                console.log('Response status:', response.status);

                // Get response text first
                const responseText = await response.text();
                console.log('Response body:', responseText.substring(0, 300));

                // Check content type
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Server error (${response.status}): Expected JSON response but got ${contentType || 'unknown type'}. Check Flask server logs.`);
                }

                // Parse JSON
                const data = JSON.parse(responseText);

                if (!response.ok) {
                    const errMsg = data && data.error ? data.error : `Server error: ${response.status}`;
                    throw new Error(errMsg);
                }

                // Success - remove form and reload tasks
                formLi.remove();
                await loadTodoList();
                
                // Show success message briefly
                const successMsg = document.createElement('div');
                successMsg.textContent = `✓ Task "${title}" added successfully (ID: ${data.task_id})`;
                successMsg.style.cssText = 'background: #28a745; color: white; padding: 10px; border-radius: 4px; margin-bottom: 10px; text-align: center;';
                todoList.insertBefore(successMsg, todoList.firstChild);
                setTimeout(() => successMsg.remove(), 3000);

            } catch (err) {
                console.error('Error adding task:', err);
                alert(`Error adding task: ${err.message}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Task';
            }
        });
    }

    // ------------------------------
    // Other widgets
    function updateCalendarWidget(deadlines) {
        const deadlineDisplay = document.getElementById('next-deadline-display');
        if (deadlines && deadlines.length > 0) {
            const nextDeadline = deadlines[0];
            deadlineDisplay.textContent = `${nextDeadline.date} - ${nextDeadline.description}`;
        } else {
            deadlineDisplay.textContent = 'No upcoming deadlines';
        }
    }

    function updateNotesWidget() {
        const notesContent = document.getElementById('notes-content');
        notesContent.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const bar = document.createElement('div');
            bar.className = 'note-placeholder';
            notesContent.appendChild(bar);
        }
    }

    function updateTimeTracker() {
        const canvas = document.getElementById('time-tracker-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 140);
        ctx.lineTo(200, 40);
        ctx.stroke();
    }

    function updateTeamWidget() {
        const teamMembers = document.getElementById('team-members');
        teamMembers.innerHTML = '';
        const placeholderMembers = [
            { name: 'Scielet Terieter', initial: 'ST' },
            { name: 'Sronce Tlametet', initial: 'ST' }
        ];
        placeholderMembers.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'team-member';
            const avatar = document.createElement('div');
            avatar.className = 'team-member-avatar';
            avatar.textContent = member.initial;
            const name = document.createElement('span');
            name.className = 'team-member-name';
            name.textContent = member.name;
            memberDiv.appendChild(avatar);
            memberDiv.appendChild(name);
            teamMembers.appendChild(memberDiv);
        });
    }

    async function handleGenerateSummary() {
        const promptText = updatesInput.value.trim();
        if (!promptText) { alert('Please enter project updates to summarize.'); return; }
        const summaryOutput = document.getElementById('summary-output');
        summaryOutput.classList.remove('hidden');
        summaryOutput.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Generating summary...</p>';
        generateBtn.disabled = true;
        try { 
            await new Promise(r => setTimeout(r, 2000));
            summaryOutput.innerHTML = `<p>Summary: ${promptText.substring(0,100)}... (Placeholder)</p>`;
        } catch { 
            summaryOutput.innerHTML = '<p style="color: #e74c3c;">Error generating summary.</p>'; 
        } finally { 
            generateBtn.disabled = false; 
        }
    }

    function showPlaceholderData() {
        updateCalendarWidget([{ date: 'Dec 20', description: 'Website design' }]);
        updateTodoList([]);
        updateNotesWidget();
        updateTimeTracker();
        updateTeamWidget();
    }
});