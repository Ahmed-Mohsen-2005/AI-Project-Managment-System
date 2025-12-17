// Home Page / Dashboard - Fixed Layout with Modal Popups
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
        addTaskBtn.addEventListener('click', () => openAddTaskModal());
    }

    // ------------------------------------------------
    // MODAL UTILITY FUNCTIONS
    // ------------------------------------------------

    function createModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        
        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <button class="modal-close" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
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

    function openAddTaskModal() {
        const modalContent = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                        Task Title <span style="color: red;">*</span>
                    </label>
                    <input type="text" id="modal-task-title" placeholder="Enter task title" 
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                            Sprint ID <span style="color: red;">*</span>
                        </label>
                        <input type="number" id="modal-task-sprint" value="1" min="1"
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                            Assigned User ID <span style="color: red;">*</span>
                        </label>
                        <input type="number" id="modal-task-assigned" value="1" min="1"
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                            Status
                        </label>
                        <select id="modal-task-status" 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                            Priority
                        </label>
                        <select id="modal-task-priority" 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM" selected>MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                            Estimate (hrs)
                        </label>
                        <input type="number" id="modal-task-estimate" placeholder="0" step="0.5" min="0"
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                        Due Date
                    </label>
                    <input type="date" id="modal-task-due-date"
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button id="modal-cancel-task" 
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                        Cancel
                    </button>
                    <button id="modal-submit-task" 
                        style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                        Add Task
                    </button>
                </div>
            </div>
        `;
        
        const modal = createModal('Add New Task', modalContent);
        
        // Focus on title input
        setTimeout(() => {
            document.getElementById('modal-task-title').focus();
        }, 100);
        
        // Cancel button
        document.getElementById('modal-cancel-task').addEventListener('click', () => {
            closeModal(modal);
        });
        
        // Submit button
        document.getElementById('modal-submit-task').addEventListener('click', async () => {
            await submitTaskFromModal(modal);
        });
    }

    async function submitTaskFromModal(modal) {
        const title = document.getElementById('modal-task-title').value.trim();
        const sprintId = parseInt(document.getElementById('modal-task-sprint').value);
        const assignedId = parseInt(document.getElementById('modal-task-assigned').value);
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

        if (!sprintId || sprintId < 1) {
            alert('Valid Sprint ID is required');
            document.getElementById('modal-task-sprint').focus();
            return;
        }

        if (!assignedId || assignedId < 1) {
            alert('Valid Assigned User ID is required');
            document.getElementById('modal-task-assigned').focus();
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
            await loadTodoList();
            await loadUpcomingTasks(); // Refresh calendar widget
            showNotification(`✓ Task "${title}" added successfully`, 'success');

        } catch (err) {
            console.error('Error adding task:', err);
            alert(`Error adding task: ${err.message}`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Task';
        }
    }

    // ------------------------------------------------
    // ADD NOTE MODAL
    // ------------------------------------------------

    function openAddNoteModal() {
        const modalContent = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                        Note Content <span style="color: red;">*</span>
                    </label>
                    <textarea id="modal-note-content" placeholder="Write your note here..." 
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 100px; resize: vertical; font-family: inherit; font-size: 14px;"></textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                            Entity Type
                        </label>
                        <select id="modal-note-entity-type" 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                            <option value="task">Task</option>
                            <option value="project">Project</option>
                            <option value="sprint">Sprint</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                            Entity ID <span style="color: red;">*</span>
                        </label>
                        <input type="number" id="modal-note-entity-id" value="1" min="1"
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button id="modal-cancel-note" 
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                        Cancel
                    </button>
                    <button id="modal-submit-note" 
                        style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                        Save Note
                    </button>
                </div>
            </div>
        `;
        
        const modal = createModal('Add New Note', modalContent);
        
        // Focus on textarea
        setTimeout(() => {
            document.getElementById('modal-note-content').focus();
        }, 100);
        
        // Cancel button
        document.getElementById('modal-cancel-note').addEventListener('click', () => {
            closeModal(modal);
        });
        
        // Submit button
        document.getElementById('modal-submit-note').addEventListener('click', async () => {
            await submitNoteFromModal(modal);
        });
    }

    async function submitNoteFromModal(modal) {
        const content = document.getElementById('modal-note-content').value.trim();
        const entityType = document.getElementById('modal-note-entity-type').value;
        const entityId = parseInt(document.getElementById('modal-note-entity-id').value);

        // Validation
        if (!content) {
            alert('Note content is required');
            document.getElementById('modal-note-content').focus();
            return;
        }

        if (!entityId || entityId < 1) {
            alert('Valid Entity ID is required');
            document.getElementById('modal-note-entity-id').focus();
            return;
        }

        const newNote = {
            content: content,
            entity_type: entityType,
            entity_id: entityId,
            created_by: 1  // Replace with actual user ID
        };

        const submitBtn = document.getElementById('modal-submit-note');
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

            closeModal(modal);
            await loadRecentNotes();
            showNotification('✓ Note saved successfully', 'success');

        } catch (err) {
            console.error('Error adding note:', err);
            alert(`Error saving note: ${err.message}`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Note';
        }
    }

    // ------------------------------------------------
    // FETCH & LOAD DASHBOARD DATA
    // ------------------------------------------------

    async function loadDashboardData() {
        try {
            // Load upcoming tasks for calendar widget
            await loadUpcomingTasks();
            updateTimeTracker();
            updateTeamWidget();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showPlaceholderData();
        }
    }

    async function loadUpcomingTasks() {
        try {
            console.log('[DEBUG] Fetching upcoming tasks...');
            
            // Fetch upcoming tasks from the task API
            const response = await fetch(`${TASKS_API_URL}/upcoming?limit=5`, {
                method: 'GET',
                credentials: 'include'
            });

            console.log('[DEBUG] Response status:', response.status);

            if (response.status === 401) {
                window.location.href = '/';
                return;
            }

            if (!response.ok) {
                console.error('[ERROR] Response not OK:', response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tasks = await response.json();
            console.log('[DEBUG] Received tasks:', tasks);
            console.log('[DEBUG] Number of tasks:', tasks ? tasks.length : 0);
            
            updateCalendarWidget(tasks);
        } catch (error) {
            console.error('[ERROR] Error loading upcoming tasks:', error);
            // Try to load all tasks as fallback
            await loadAllTasksForCalendar();
        }
    }

    async function loadAllTasksForCalendar() {
        try {
            console.log('[DEBUG] Fallback: Fetching all tasks...');
            const response = await fetch(TASKS_API_URL, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const allTasks = await response.json();
            console.log('[DEBUG] All tasks received:', allTasks);
            
            // Filter tasks with due dates that are not DONE
            const upcomingTasks = allTasks
                .filter(task => {
                    const hasDueDate = task.due_date != null;
                    const notDone = task.status !== 'DONE';
                    const futureDate = task.due_date ? new Date(task.due_date) >= new Date() : false;
                    console.log(`[DEBUG] Task ${task.task_id}: due_date=${task.due_date}, status=${task.status}, include=${hasDueDate && notDone && futureDate}`);
                    return hasDueDate && notDone && futureDate;
                })
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                .slice(0, 5);
            
            console.log('[DEBUG] Filtered upcoming tasks:', upcomingTasks);
            updateCalendarWidget(upcomingTasks);
        } catch (error) {
            console.error('[ERROR] Error in fallback load:', error);
            updateCalendarWidget([]);
        }
    }

    // ------------------------------------------------
    // LOAD TO-DO LIST
    // ------------------------------------------------

    async function loadTodoList() {
        try {
            const response = await fetch(`${TASKS_API_URL}/user/1/recent`);
            if (!response.ok) throw new Error('Failed to fetch tasks');

            const tasks = await response.json();
            updateTodoList(tasks);
        } catch (err) {
            console.error('Error loading tasks:', err);
            updateTodoList([]);
        }
    }

    function updateTodoList(tasks) {
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            todoList.innerHTML = '<li class="empty-state">No tasks assigned</li>';
            return;
        }

        // Limit to max 5 tasks to prevent overflow
        tasks.slice(0, 5).forEach(task => {
            const li = document.createElement('li');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `task-${task.task_id}`;
            checkbox.checked = task.status === "DONE";

            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.title;
            taskText.title = task.title; // Show full text on hover
            if (task.status === "DONE") taskText.classList.add('completed');

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
                    e.target.checked = !e.target.checked;
                    taskText.classList.toggle('completed', e.target.checked);
                }
            });

            li.appendChild(checkbox);
            li.appendChild(taskText);
            todoList.appendChild(li);
        });
    }

    // ------------------------------------------------
    // LOAD RECENT NOTES
    // ------------------------------------------------

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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: background 0.2s;
        `;
        addNoteBtn.addEventListener('mouseenter', () => addNoteBtn.style.background = '#2980b9');
        addNoteBtn.addEventListener('mouseleave', () => addNoteBtn.style.background = '#3498db');
        addNoteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent widget click
            openAddNoteModal();
        });
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

        // Display recent notes (limit to 5 to prevent overflow)
        const notesContainer = document.createElement('div');
        notesContainer.className = 'notes-list';

        notes.slice(0, 5).forEach(note => {
            const noteItem = createNoteItem(note);
            notesContainer.appendChild(noteItem);
        });

        notesContent.appendChild(notesContainer);
    }

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

        // Note content - truncate if too long
        const contentDiv = document.createElement('div');
        contentDiv.className = 'note-content';
        contentDiv.style.cssText = `
            font-size: 14px;
            color: #2c3e50;
            margin-bottom: 8px;
            word-wrap: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        `;
        contentDiv.textContent = note.content;
        contentDiv.title = note.content; // Show full text on hover

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

        const editBtn = createActionButton('fas fa-edit', '#3498db', (e) => {
            e.stopPropagation();
            handleEditNote(note);
        });
        const deleteBtn = createActionButton('fas fa-trash', '#e74c3c', (e) => {
            e.stopPropagation();
            handleDeleteNote(note.note_id);
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

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
        btn.addEventListener('click', onClick);
        return btn;
    }

    // ------------------------------------------------
    // EDIT & DELETE NOTE HANDLERS
    // ------------------------------------------------

    function handleEditNote(note) {
        const modalContent = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--color-text-main);">
                        Note Content <span style="color: red;">*</span>
                    </label>
                    <textarea id="modal-edit-content" 
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 100px; resize: vertical; font-family: inherit; font-size: 14px;">${note.content}</textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button id="modal-cancel-edit" 
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                        Cancel
                    </button>
                    <button id="modal-submit-edit" 
                        style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                        Save Changes
                    </button>
                </div>
            </div>
        `;
        
        const modal = createModal('Edit Note', modalContent);
        
        const textarea = document.getElementById('modal-edit-content');
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 100);
        
        document.getElementById('modal-cancel-edit').addEventListener('click', () => {
            closeModal(modal);
        });
        
        document.getElementById('modal-submit-edit').addEventListener('click', async () => {
            const newContent = textarea.value.trim();

            if (!newContent) {
                alert('Note content cannot be empty');
                return;
            }

            if (newContent === note.content) {
                closeModal(modal);
                return;
            }

            const saveBtn = document.getElementById('modal-submit-edit');
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

                closeModal(modal);
                await loadRecentNotes();
                showNotification('✓ Note updated successfully', 'success');

            } catch (err) {
                console.error('Error updating note:', err);
                alert(`Error updating note: ${err.message}`);
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
        });
    }

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

    // ------------------------------------------------
    // OTHER WIDGETS
    // ------------------------------------------------

    function updateCalendarWidget(deadlines) {
        console.log('[DEBUG] updateCalendarWidget called with:', deadlines);
        
        const deadlineDisplay = document.getElementById('next-deadline-display');
        const deadlineList = document.getElementById('calendar-deadlines');

        if (!deadlineDisplay) {
            console.error('[ERROR] next-deadline-display element not found!');
            return;
        }

        if (!deadlines || deadlines.length === 0) {
            console.log('[DEBUG] No deadlines to display');
            deadlineDisplay.textContent = 'No upcoming deadlines';
            if (deadlineList) {
                deadlineList.innerHTML = '<li class="deadline-item"><span class="deadline-title">No tasks scheduled</span></li>';
            }
            return;
        }

        console.log('[DEBUG] Displaying', deadlines.length, 'deadlines');
        const nextDeadline = deadlines[0];
        const formattedDate = formatDate(nextDeadline.due_date);
        deadlineDisplay.textContent = `${formattedDate} • ${nextDeadline.title}`;
        console.log('[DEBUG] Next deadline set to:', deadlineDisplay.textContent);

        if (deadlineList) {
            deadlineList.innerHTML = '';
            // Limit to 4 items to prevent overflow
            deadlines.slice(0, 4).forEach(task => {
                console.log('[DEBUG] Adding task to list:', task.title);
                const item = document.createElement('li');
                item.className = 'deadline-item';

                const titleSpan = document.createElement('span');
                titleSpan.className = 'deadline-title';
                titleSpan.textContent = task.title;
                titleSpan.title = task.title; // Show full text on hover

                const metaSpan = document.createElement('span');
                metaSpan.className = 'deadline-meta';
                const statusText = task.status ? task.status.replace('_', ' ') : 'TODO';
                metaSpan.textContent = `${formatDate(task.due_date)} · ${statusText}`;

                item.appendChild(titleSpan);
                item.appendChild(metaSpan);
                deadlineList.appendChild(item);
            });
            console.log('[DEBUG] Calendar list updated with', deadlineList.children.length, 'items');
        } else {
            console.error('[ERROR] calendar-deadlines element not found!');
        }
    }

    function formatDate(dateValue) {
        if (!dateValue) return '-';
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) return dateValue;
        return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function updateTimeTracker() {
        const timeTrackerContent = document.querySelector('.time-tracker-content');
        if (!timeTrackerContent) return;
        
        // Sample data - replace with actual API data
        const hoursWorked = 28;
        const totalHours = 40;
        const percentage = Math.round((hoursWorked / totalHours) * 100);
        
        timeTrackerContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 11px; color: #7f8c8d; font-weight: 500;">This Week</span>
                <span style="font-size: 12px; color: #2c3e50; font-weight: 600;">${hoursWorked}h / ${totalHours}h</span>
            </div>
            <div style="width: 100%; height: 18px; background: #ecf0f1; border-radius: 10px; overflow: hidden; position: relative; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);">
                <div style="height: 100%; background: linear-gradient(90deg, #3498db 0%, #2ecc71 100%); border-radius: 10px; transition: width 0.5s ease; width: ${percentage}%; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                    <span style="color: white; font-size: 10px; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">${percentage}%</span>
                </div>
            </div>
            <div style="display: flex; justify-content: space-around; gap: 8px; margin-top: 8px;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                    <span style="font-size: 16px; font-weight: 700; color: #3498db;">8.5</span>
                    <span style="font-size: 9px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px;">Today</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                    <span style="font-size: 16px; font-weight: 700; color: #3498db;">${hoursWorked}</span>
                    <span style="font-size: 9px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px;">Week</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                    <span style="font-size: 16px; font-weight: 700; color: #3498db;">112</span>
                    <span style="font-size: 9px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.5px;">Month</span>
                </div>
            </div>
        `;
    }

    function updateTeamWidget() {
        const teamMembers = document.getElementById('team-members');
        if (!teamMembers) return;
        
        teamMembers.innerHTML = '';
        
        // Sample team members - replace with actual API data
        const placeholderMembers = [
            { name: 'Alice Cooper', initial: 'AC', color: '#3498db' },
            { name: 'Bob Smith', initial: 'BS', color: '#e74c3c' },
            { name: 'Carol White', initial: 'CW', color: '#2ecc71' },
            { name: 'David Jones', initial: 'DJ', color: '#f39c12' },
            { name: 'Emma Brown', initial: 'EB', color: '#9b59b6' },
            { name: 'Frank Miller', initial: 'FM', color: '#1abc9c' },
            { name: 'Grace Lee', initial: 'GL', color: '#e67e22' },
            { name: 'Henry Davis', initial: 'HD', color: '#34495e' }
        ];
        
        placeholderMembers.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'team-member';
            memberDiv.title = member.name; // Tooltip on hover
            
            const avatar = document.createElement('div');
            avatar.className = 'team-member-avatar';
            avatar.textContent = member.initial;
            avatar.style.background = member.color;
            
            const name = document.createElement('span');
            name.className = 'team-member-name';
            name.textContent = member.name.split(' ')[0]; // First name only
            
            memberDiv.appendChild(avatar);
            memberDiv.appendChild(name);
            teamMembers.appendChild(memberDiv);
        });
    }

    async function handleGenerateSummary() {
        const promptText = updatesInput.value.trim();
        if (!promptText) { 
            alert('Please enter project updates to summarize.'); 
            return; 
        }
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