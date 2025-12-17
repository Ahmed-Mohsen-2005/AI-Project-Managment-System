// Home Page / Dashboard - Updated with Notes Integration
const DASHBOARD_API_URL = '/api/v1/home/dashboard';
const TASKS_API_URL = '/api/v1/tasks';
const NOTES_API_URL = '/api/v1/notes';

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-summary-btn');
    const updatesInput = document.getElementById('project-updates-input');
    const addTaskBtn = document.getElementById('add-task-btn');

    // Initialize dashboard
    loadDashboardData();
    loadTodoList();
    loadRecentNotes();

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
    // Load Recent Notes from Backend
    async function loadRecentNotes() {
        try {
            const response = await fetch(`${NOTES_API_URL}`, { 
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to fetch notes');

            const notes = await response.json();
            updateNotesWidget(notes);
        } catch (err) {
            console.error('Error loading notes:', err);
            updateNotesWidget([]);
        }
    }

    // ------------------------------
    // Update Notes Widget DOM with actual data
    function updateNotesWidget(notes) {
        const notesContent = document.getElementById('notes-content');
        notesContent.innerHTML = '';

        // Add "Add Note" button
        const addNoteBtn = document.createElement('button');
        addNoteBtn.className = 'btn-add-note';
        addNoteBtn.innerHTML = '<i class="fas fa-plus"></i> Add Note';
        addNoteBtn.style.cssText = `
            width: 100%;
            padding: 10px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: background 0.2s;
        `;
        addNoteBtn.addEventListener('mouseenter', () => addNoteBtn.style.background = '#2980b9');
        addNoteBtn.addEventListener('mouseleave', () => addNoteBtn.style.background = '#3498db');
        addNoteBtn.addEventListener('click', handleAddNote);
        notesContent.appendChild(addNoteBtn);

        // Display notes or empty state
        if (!notes || notes.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'notes-empty-state';
            emptyState.style.cssText = `
                text-align: center;
                padding: 40px 20px;
                color: #95a5a6;
                font-style: italic;
            `;
            emptyState.innerHTML = '<i class="fas fa-sticky-note" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>No notes yet';
            notesContent.appendChild(emptyState);
            return;
        }

        // Display recent notes (limit to 5)
        const notesContainer = document.createElement('div');
        notesContainer.className = 'notes-list';
        notesContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 300px;
            overflow-y: auto;
        `;

        notes.slice(0, 5).forEach(note => {
            const noteItem = createNoteItem(note);
            notesContainer.appendChild(noteItem);
        });

        notesContent.appendChild(notesContainer);
    }

    // ------------------------------
    // Create individual note item
    function createNoteItem(note) {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'note-item';
        noteDiv.dataset.noteId = note.note_id;
        noteDiv.style.cssText = `
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 12px;
            border-radius: 6px;
            position: relative;
            transition: all 0.2s;
        `;

        // Note content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'note-content';
        contentDiv.style.cssText = `
            font-size: 14px;
            color: #2c3e50;
            margin-bottom: 8px;
            word-wrap: break-word;
        `;
        contentDiv.textContent = note.content;

        // Note metadata
        const metaDiv = document.createElement('div');
        metaDiv.className = 'note-meta';
        metaDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #7f8c8d;
        `;

        const entityInfo = document.createElement('span');
        entityInfo.textContent = `${note.entity_type} #${note.entity_id}`;
        
        const dateInfo = document.createElement('span');
        if (note.created_at) {
            const date = new Date(note.created_at);
            dateInfo.textContent = date.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        metaDiv.appendChild(entityInfo);
        metaDiv.appendChild(dateInfo);

        // Action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'note-actions';
        actionsDiv.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            gap: 5px;
            opacity: 0;
            transition: opacity 0.2s;
        `;

        const editBtn = createActionButton('fas fa-edit', '#3498db', () => handleEditNote(note));
        const deleteBtn = createActionButton('fas fa-trash', '#e74c3c', () => handleDeleteNote(note.note_id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        // Show actions on hover
        noteDiv.addEventListener('mouseenter', () => {
            actionsDiv.style.opacity = '1';
            noteDiv.style.background = '#ecf0f1';
        });
        noteDiv.addEventListener('mouseleave', () => {
            actionsDiv.style.opacity = '0';
            noteDiv.style.background = '#f8f9fa';
        });

        noteDiv.appendChild(contentDiv);
        noteDiv.appendChild(metaDiv);
        noteDiv.appendChild(actionsDiv);

        return noteDiv;
    }

    // ------------------------------
    // Create action button helper
    function createActionButton(iconClass, color, onClick) {
        const btn = document.createElement('button');
        btn.innerHTML = `<i class="${iconClass}"></i>`;
        btn.style.cssText = `
            background: white;
            border: 1px solid ${color};
            color: ${color};
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.background = color;
            btn.style.color = 'white';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'white';
            btn.style.color = color;
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        return btn;
    }

    // ------------------------------
    // Handle Add Note
    function handleAddNote() {
        const notesContent = document.getElementById('notes-content');

        // Check if form already exists
        if (document.querySelector('.note-form')) {
            return;
        }

        // Create form
        const formDiv = document.createElement('div');
        formDiv.className = 'note-form';
        formDiv.style.cssText = `
            background: #fff;
            border: 2px solid #3498db;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        formDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <textarea id="note-content-input" placeholder="Write your note here..." 
                    style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; min-height: 80px; resize: vertical; font-family: inherit; font-size: 14px;"></textarea>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <select id="note-entity-type" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="task">Task</option>
                        <option value="project">Project</option>
                        <option value="sprint">Sprint</option>
                    </select>
                    
                    <input type="number" id="note-entity-id" placeholder="Entity ID *" value="1" min="1"
                        style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancel-note-btn" 
                        style="padding: 8px 16px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Cancel
                    </button>
                    <button id="submit-note-btn" 
                        style="padding: 8px 16px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Save Note
                    </button>
                </div>
            </div>
        `;

        // Insert form at the top (after the add button)
        const addBtn = notesContent.querySelector('.btn-add-note');
        addBtn.after(formDiv);

        // Focus on textarea
        document.getElementById('note-content-input').focus();

        // Handle cancel
        document.getElementById('cancel-note-btn').addEventListener('click', () => {
            formDiv.remove();
        });

        // Handle submit
        document.getElementById('submit-note-btn').addEventListener('click', async () => {
            const content = document.getElementById('note-content-input').value.trim();
            const entityType = document.getElementById('note-entity-type').value;
            const entityId = parseInt(document.getElementById('note-entity-id').value);

            // Validation
            if (!content) {
                alert('Note content is required');
                document.getElementById('note-content-input').focus();
                return;
            }

            if (!entityId || entityId < 1) {
                alert('Valid Entity ID is required');
                document.getElementById('note-entity-id').focus();
                return;
            }

            const newNote = {
                content: content,
                entity_type: entityType,
                entity_id: entityId,
                created_by: 1  // Replace with actual user ID
            };

            const submitBtn = document.getElementById('submit-note-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            try {
                const response = await fetch(NOTES_API_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(newNote)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create note');
                }

                const data = await response.json();
                
                // Remove form and reload notes
                formDiv.remove();
                await loadRecentNotes();
                
                // Show success message
                showNotification('✓ Note saved successfully', 'success');

            } catch (err) {
                console.error('Error adding note:', err);
                alert(`Error saving note: ${err.message}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Note';
            }
        });
    }

    // ------------------------------
    // Handle Edit Note
    function handleEditNote(note) {
        const noteItem = document.querySelector(`[data-note-id="${note.note_id}"]`);
        if (!noteItem) return;

        // Save original content for cancel
        const originalContent = note.content;

        // Replace note content with textarea
        noteItem.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <textarea id="edit-note-content" 
                    style="padding: 8px; border: 1px solid #3498db; border-radius: 4px; min-height: 60px; resize: vertical; font-family: inherit; font-size: 14px;">${note.content}</textarea>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="cancel-edit-btn" 
                        style="padding: 6px 12px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        Cancel
                    </button>
                    <button id="save-edit-btn" 
                        style="padding: 6px 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        Save
                    </button>
                </div>
            </div>
        `;

        const textarea = document.getElementById('edit-note-content');
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);

        // Handle cancel
        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            loadRecentNotes();
        });

        // Handle save
        document.getElementById('save-edit-btn').addEventListener('click', async () => {
            const newContent = textarea.value.trim();

            if (!newContent) {
                alert('Note content cannot be empty');
                return;
            }

            if (newContent === originalContent) {
                loadRecentNotes();
                return;
            }

            const saveBtn = document.getElementById('save-edit-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            try {
                const response = await fetch(`${NOTES_API_URL}/${note.note_id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ content: newContent })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update note');
                }

                await loadRecentNotes();
                showNotification('✓ Note updated successfully', 'success');

            } catch (err) {
                console.error('Error updating note:', err);
                alert(`Error updating note: ${err.message}`);
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            }
        });
    }

    // ------------------------------
    // Handle Delete Note
    async function handleDeleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            const response = await fetch(`${NOTES_API_URL}/${noteId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete note');
            }

            await loadRecentNotes();
            showNotification('✓ Note deleted successfully', 'success');

        } catch (err) {
            console.error('Error deleting note:', err);
            alert(`Error deleting note: ${err.message}`);
        }
    }

    // ------------------------------
    // Show notification helper
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
    // Add new task
    function handleAddTask() {
        const todoList = document.getElementById('todo-list');

        if (document.querySelector('.task-form')) {
            return;
        }

        const formLi = document.createElement('li');
        formLi.className = 'task-form';
        formLi.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;';

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

        document.getElementById('task-title').focus();

        document.getElementById('cancel-task-btn').addEventListener('click', () => {
            formLi.remove();
        });

        document.getElementById('submit-task-btn').addEventListener('click', async () => {
            const title = document.getElementById('task-title').value.trim();
            const sprintId = parseInt(document.getElementById('task-sprint').value);
            const assignedId = parseInt(document.getElementById('task-assigned').value);
            const status = document.getElementById('task-status').value;
            const priority = document.getElementById('task-priority').value;
            const estimate = document.getElementById('task-estimate').value;
            const dueDate = document.getElementById('task-due-date').value;

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

            const submitBtn = document.getElementById('submit-task-btn');
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

                formLi.remove();
                await loadTodoList();
                showNotification(`✓ Task "${title}" added successfully`, 'success');

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
        const deadlineList = document.getElementById('calendar-deadlines');

        if (!deadlines || deadlines.length === 0) {
            deadlineDisplay.textContent = 'No upcoming deadlines';
            if (deadlineList) {
                deadlineList.innerHTML = '<li class="deadline-item"><span class="deadline-title">No tasks scheduled</span></li>';
            }
            return;
        }

        const nextDeadline = deadlines[0];
        const formattedDate = formatDate(nextDeadline.due_date);
        deadlineDisplay.textContent = `${formattedDate} • ${nextDeadline.title}`;

        if (deadlineList) {
            deadlineList.innerHTML = '';
            deadlines.slice(0, 4).forEach(task => {
                const item = document.createElement('li');
                item.className = 'deadline-item';

                const titleSpan = document.createElement('span');
                titleSpan.className = 'deadline-title';
                titleSpan.textContent = task.title;

                const metaSpan = document.createElement('span');
                metaSpan.className = 'deadline-meta';
                const statusText = task.status ? task.status.replace('_', ' ') : 'TODO';
                metaSpan.textContent = `${formatDate(task.due_date)} · ${statusText}`;

                item.appendChild(titleSpan);
                item.appendChild(metaSpan);
                deadlineList.appendChild(item);
            });
        }
    }

    function formatDate(dateValue) {
        if (!dateValue) return '-';
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) return dateValue;
        return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
        updateCalendarWidget([{ due_date: '2024-12-20', title: 'Website design' }]);
        updateTodoList([]);
        updateNotesWidget([]);
        updateTimeTracker();
        updateTeamWidget();
    }

    // Add CSS animations for notifications
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