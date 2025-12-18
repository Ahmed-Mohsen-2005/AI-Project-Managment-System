// Home Page / Dashboard - Complete Fixed Version
const DASHBOARD_API_URL = '/api/v1/home/dashboard';
const TASKS_API_URL = '/api/v1/tasks';
const NOTES_API_URL = '/api/v1/notes';
const SPRINTS_API_URL = '/api/v1/sprints';
const USERS_API_URL = '/api/v1/users';

document.addEventListener('DOMContentLoaded', () => {
    console.log('[HOME] Page loaded, initializing...');
    
    const generateBtn = document.getElementById('generate-summary-btn');
    const updatesInput = document.getElementById('project-updates-input');
    const addTaskBtn = document.getElementById('add-task-btn');

    // Initialize dashboard
    loadDashboardData();
    loadTodoList(); // This will now work!
    loadRecentNotes();

    // Event listeners
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateSummary);
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => openAddTaskModal());
    }

    // ================================================
    // FIXED TODO LIST FUNCTIONS
    // ================================================

    async function loadTodoList() {
        console.log('[TODO] Loading tasks...');
        
        try {
            const response = await fetch(TASKS_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const allTasks = await response.json();
            console.log('[TODO] Received', allTasks.length, 'tasks');
            
            // Get current user ID (modify this based on your auth)
            const currentUserId = getCurrentUserId();
            
            // Filter for user's tasks (or show all if no user ID)
            let userTasks = currentUserId 
                ? allTasks.filter(t => t.assigned_id === currentUserId)
                : allTasks;
            
            // FILTER TO SHOW ONLY TODO TASKS
            userTasks = userTasks.filter(t => t.status === 'TODO');
            console.log('[TODO] Filtered to TODO status:', userTasks.length, 'tasks');
            
            // Sort by priority
            userTasks.sort((a, b) => {
                const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
                return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
            });
            
            updateTodoList(userTasks);
            
        } catch (err) {
            console.error('[TODO] Error:', err);
            updateTodoList([]);
        }
    }

    function updateTodoList(tasks) {
        const todoList = document.getElementById('todo-list');
        
        if (!todoList) {
            console.error('[TODO] Element #todo-list not found!');
            return;
        }
        
        todoList.innerHTML = '';
        
        if (tasks.length === 0) {
            todoList.innerHTML = '<li style="padding: 20px; text-align: center; color: #95a5a6; font-style: italic;">No TODO tasks</li>';
            return;
        }
        
        console.log('[TODO] Rendering', tasks.length, 'tasks');
        
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-bottom: 1px solid #ecf0f1; transition: background 0.2s;';
            
            li.onmouseenter = () => li.style.background = '#f8f9fa';
            li.onmouseleave = () => li.style.background = 'transparent';
            
            // Checkbox
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = task.status === 'DONE';
            cb.style.cssText = 'flex-shrink: 0; cursor: pointer; width: 18px; height: 18px;';
            cb.onchange = () => handleTaskToggle(task, cb);
            
            // Task text
            const text = document.createElement('span');
            text.textContent = task.title;
            text.title = task.title;
            text.style.cssText = `flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${task.status === 'DONE' ? 'text-decoration: line-through; color: #95a5a6;' : 'color: #2c3e50;'}`;
            
            // Status badge
            const badge = document.createElement('span');
            const colors = { 'TODO': '#3498db', 'IN_PROGRESS': '#f39c12', 'IN_REVIEW': '#9b59b6', 'DONE': '#27ae60' };
            badge.textContent = task.status.replace('_', ' ');
            badge.style.cssText = `flex-shrink: 0; padding: 2px 8px; font-size: 10px; font-weight: 600; border-radius: 10px; background: ${colors[task.status] || '#95a5a6'}; color: white; text-transform: uppercase;`;
            
            li.appendChild(cb);
            li.appendChild(text);
            li.appendChild(badge);
            todoList.appendChild(li);
        });
        
        if (tasks.length > 8) {
            todoList.style.maxHeight = '500px';
            todoList.style.overflowY = 'auto';
        }
        
        console.log('[TODO] Rendered', todoList.children.length, 'items');
    }

    async function handleTaskToggle(task, checkbox) {
        const newStatus = checkbox.checked ? 'DONE' : 'TODO';
        
        try {
            const res = await fetch(`${TASKS_API_URL}/${task.task_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!res.ok) throw new Error('Update failed');
            
            showNotification(`✓ Task marked as ${newStatus}`, 'success');
            await loadTodoList(); // Reload to update UI
            
        } catch (err) {
            console.error('[TODO] Update error:', err);
            alert('Error updating task');
            checkbox.checked = !checkbox.checked;
        }
    }

    function getCurrentUserId() {
        // TODO: Implement based on your auth system
        // Options:
        // return parseInt(document.body.dataset.userId);
        // return parseInt(localStorage.getItem('userId'));
        // return window.currentUserId;
        
        return null; // null = show all tasks
    }

    // ================================================
    // REST OF YOUR CODE (unchanged)
    // ================================================

    function createModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.innerHTML = `<div class="modal-header"><h2 class="modal-title">${title}</h2><button class="modal-close">&times;</button></div><div class="modal-body">${content}</div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(overlay); };
        modal.querySelector('.modal-close').onclick = () => closeModal(overlay);
        const escHandler = (e) => { if (e.key === 'Escape') { closeModal(overlay); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        return overlay;
    }

    function closeModal(overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    }

    async function openAddTaskModal() {
        const loadingModal = createModal('Add New Task', '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #3498db;"></i></div>');
        let sprints = [], users = [];
        try {
            const [sprintsRes, usersRes] = await Promise.all([
                fetch(SPRINTS_API_URL, { credentials: 'include' }),
                fetch(USERS_API_URL, { credentials: 'include' })
            ]);
            if (sprintsRes.ok) sprints = await sprintsRes.json();
            if (usersRes.ok) users = await usersRes.json();
        } catch (err) {
            closeModal(loadingModal);
            alert('Error loading data');
            return;
        }
        closeModal(loadingModal);
        
        const sprintOpts = sprints.map(s => `<option value="${s.sprint_id}">${s.name}</option>`).join('');
        const userOpts = users.map(u => `<option value="${u.user_id}">${u.name || u.username || 'User '+u.user_id}</option>`).join('');
        
        const modalContent = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Task Title <span style="color: red;">*</span></label>
                <input type="text" id="modal-task-title" placeholder="Enter task title" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Sprint <span style="color: red;">*</span></label>
                    <select id="modal-task-sprint" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;">${sprintOpts}</select></div>
                    <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Assigned To <span style="color: red;">*</span></label>
                    <select id="modal-task-assigned" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;">${userOpts}</select></div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Status</label>
                    <select id="modal-task-status" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;">
                        <option value="TODO">TODO</option><option value="IN_PROGRESS">IN PROGRESS</option><option value="DONE">DONE</option></select></div>
                    <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Priority</label>
                    <select id="modal-task-priority" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;">
                        <option value="LOW">LOW</option><option value="MEDIUM" selected>MEDIUM</option><option value="HIGH">HIGH</option></select></div>
                    <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Estimate (hrs)</label>
                    <input type="number" id="modal-task-estimate" placeholder="0" step="0.5" min="0" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"></div>
                </div>
                <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Due Date</label>
                <input type="date" id="modal-task-due-date" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"></div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button id="modal-cancel-task" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button id="modal-submit-task" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer;">Add Task</button>
                </div>
            </div>`;
        
        const modal = createModal('Add New Task', modalContent);
        setTimeout(() => document.getElementById('modal-task-title').focus(), 100);
        document.getElementById('modal-cancel-task').onclick = () => closeModal(modal);
        document.getElementById('modal-submit-task').onclick = () => submitTaskFromModal(modal);
    }

    async function submitTaskFromModal(modal) {
        const title = document.getElementById('modal-task-title').value.trim();
        const sprintId = parseInt(document.getElementById('modal-task-sprint').value);
        const assignedId = parseInt(document.getElementById('modal-task-assigned').value);
        const status = document.getElementById('modal-task-status').value;
        const priority = document.getElementById('modal-task-priority').value;
        const estimate = document.getElementById('modal-task-estimate').value;
        const dueDate = document.getElementById('modal-task-due-date').value;

        if (!title) { alert('Task title required'); return; }
        if (!sprintId) { alert('Select sprint'); return; }
        if (!assignedId) { alert('Select user'); return; }

        const submitBtn = document.getElementById('modal-submit-task');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        try {
            const res = await fetch(TASKS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title, sprint_id: sprintId, assigned_id: assignedId, status, priority,
                    estimate_hours: estimate ? parseFloat(estimate) : null,
                    due_date: dueDate || null, created_by: assignedId
                })
            });

            if (!res.ok) throw new Error('Failed to create task');

            closeModal(modal);
            await loadTodoList();
            await loadUpcomingTasks();
            showNotification(`✓ Task "${title}" added`, 'success');

        } catch (err) {
            alert(`Error: ${err.message}`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Task';
        }
    }

    // Notes functions
    function openAddNoteModal() {
        const modalContent = `<div style="display: flex; flex-direction: column; gap: 15px;">
            <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Note Content <span style="color: red;">*</span></label>
            <textarea id="modal-note-content" placeholder="Write your note..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 100px; resize: vertical;"></textarea></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Entity Type</label>
                <select id="modal-note-entity-type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    <option value="task">Task</option><option value="project">Project</option><option value="sprint">Sprint</option></select></div>
                <div><label style="display: block; margin-bottom: 5px; font-weight: 500;">Entity ID <span style="color: red;">*</span></label>
                <input type="number" id="modal-note-entity-id" value="1" min="1" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;"></div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                <button id="modal-cancel-note" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                <button id="modal-submit-note" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer;">Save Note</button>
            </div></div>`;
        
        const modal = createModal('Add New Note', modalContent);
        setTimeout(() => document.getElementById('modal-note-content').focus(), 100);
        document.getElementById('modal-cancel-note').onclick = () => closeModal(modal);
        document.getElementById('modal-submit-note').onclick = () => submitNoteFromModal(modal);
    }

    async function submitNoteFromModal(modal) {
        const content = document.getElementById('modal-note-content').value.trim();
        const entityType = document.getElementById('modal-note-entity-type').value;
        const entityId = parseInt(document.getElementById('modal-note-entity-id').value);

        if (!content) { alert('Content required'); return; }
        if (!entityId || entityId < 1) { alert('Valid Entity ID required'); return; }

        const submitBtn = document.getElementById('modal-submit-note');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const res = await fetch(NOTES_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content, entity_type: entityType, entity_id: entityId, created_by: 1 })
            });

            if (!res.ok) throw new Error('Failed to create note');

            closeModal(modal);
            await loadRecentNotes();
            showNotification('✓ Note saved', 'success');

        } catch (err) {
            alert(`Error: ${err.message}`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Note';
        }
    }

    async function loadDashboardData() {
        try {
            await loadUpcomingTasks();
            updateTimeTracker();
            updateTeamWidget();
        } catch (err) {
            console.error('Dashboard error:', err);
        }
    }

    async function loadUpcomingTasks() {
        try {
            const res = await fetch(TASKS_API_URL, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed');
            const all = await res.json();
            const upcoming = all.filter(t => t.due_date && t.status !== 'DONE' && new Date(t.due_date) >= new Date())
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                .slice(0, 5);
            updateCalendarWidget(upcoming);
        } catch (err) {
            console.error('Calendar error:', err);
            updateCalendarWidget([]);
        }
    }

    async function loadRecentNotes() {
        try {
            const res = await fetch(NOTES_API_URL, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed');
            const notes = await res.json();
            updateNotesWidget(notes);
        } catch (err) {
            console.error('Notes error:', err);
            updateNotesWidget([]);
        }
    }

    function updateNotesWidget(notes) {
        const nc = document.getElementById('notes-content');
        if (!nc) return;
        nc.innerHTML = '';
        
        const btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-plus"></i> Add Note';
        btn.style.cssText = 'width: 100%; padding: 10px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;';
        btn.onmouseenter = () => btn.style.background = '#2980b9';
        btn.onmouseleave = () => btn.style.background = '#3498db';
        btn.onclick = () => openAddNoteModal();
        nc.appendChild(btn);

        if (!notes || notes.length === 0) {
            nc.innerHTML += '<div style="text-align: center; padding: 40px; color: #95a5a6; font-style: italic;"><i class="fas fa-sticky-note" style="font-size: 48px; display: block; margin-bottom: 10px;"></i>No notes yet</div>';
            return;
        }

        // Create scrollable container for notes
        const notesContainer = document.createElement('div');
        notesContainer.style.cssText = 'margin-top: 10px; max-height: 400px; overflow-y: auto; padding-right: 5px;';
        
        // Add custom scrollbar styles
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.textContent = `
            #notes-content > div:last-child::-webkit-scrollbar { width: 6px; }
            #notes-content > div:last-child::-webkit-scrollbar-track { background: #ecf0f1; border-radius: 3px; }
            #notes-content > div:last-child::-webkit-scrollbar-thumb { background: #bdc3c7; border-radius: 3px; }
            #notes-content > div:last-child::-webkit-scrollbar-thumb:hover { background: #95a5a6; }
        `;
        if (!document.getElementById('notes-scrollbar-style')) {
            scrollbarStyle.id = 'notes-scrollbar-style';
            document.head.appendChild(scrollbarStyle);
        }

        notes.forEach((note, index) => {
            const div = document.createElement('div');
            div.dataset.noteId = note.note_id;
            div.style.cssText = 'background: #f8f9fa; border-left: 4px solid #3498db; padding: 12px; border-radius: 6px; margin-bottom: 10px; position: relative; transition: all 0.2s;';
            
            // Note content
            const content = document.createElement('div');
            content.style.cssText = 'font-size: 14px; color: #2c3e50; margin-bottom: 8px; word-wrap: break-word; padding-right: 60px;';
            content.textContent = note.content;
            
            // Note metadata
            const meta = document.createElement('div');
            meta.style.cssText = 'display: flex; justify-content: space-between; font-size: 12px; color: #7f8c8d;';
            meta.innerHTML = `
                <span>${note.entity_type} #${note.entity_id}</span>
                <span>${note.created_at ? new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
            `;
            
            // Action buttons container
            const actions = document.createElement('div');
            actions.style.cssText = 'position: absolute; top: 8px; right: 8px; display: flex; gap: 5px; opacity: 0; transition: opacity 0.2s;';
            
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit note';
            editBtn.style.cssText = 'background: white; border: 1px solid #3498db; color: #3498db; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s;';
            editBtn.onmouseenter = () => { editBtn.style.background = '#3498db'; editBtn.style.color = 'white'; };
            editBtn.onmouseleave = () => { editBtn.style.background = 'white'; editBtn.style.color = '#3498db'; };
            editBtn.onclick = (e) => { e.stopPropagation(); handleEditNote(note); };
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete note';
            deleteBtn.style.cssText = 'background: white; border: 1px solid #e74c3c; color: #e74c3c; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s;';
            deleteBtn.onmouseenter = () => { deleteBtn.style.background = '#e74c3c'; deleteBtn.style.color = 'white'; };
            deleteBtn.onmouseleave = () => { deleteBtn.style.background = 'white'; deleteBtn.style.color = '#e74c3c'; };
            deleteBtn.onclick = (e) => { e.stopPropagation(); handleDeleteNote(note.note_id); };
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            
            // Hover effects
            div.onmouseenter = () => { 
                div.style.background = '#ecf0f1'; 
                actions.style.opacity = '1';
            };
            div.onmouseleave = () => { 
                div.style.background = '#f8f9fa'; 
                actions.style.opacity = '0';
            };
            
            div.appendChild(content);
            div.appendChild(meta);
            div.appendChild(actions);
            notesContainer.appendChild(div);
        });
        
        nc.appendChild(notesContainer);
        
        // Show count if many notes
        if (notes.length > 5) {
            const countMsg = document.createElement('div');
            countMsg.style.cssText = 'text-align: center; padding: 8px; color: #7f8c8d; font-size: 12px; font-style: italic; background: #ecf0f1; border-radius: 6px; margin-top: 10px;';
            countMsg.textContent = `Showing all ${notes.length} notes`;
            nc.appendChild(countMsg);
        }
    }

    function handleEditNote(note) {
        const modalContent = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">
                        Note Content <span style="color: red;">*</span>
                    </label>
                    <textarea id="modal-edit-note-content" 
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 120px; resize: vertical; font-family: inherit; font-size: 14px;">${note.content}</textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">Entity Type</label>
                        <input type="text" value="${note.entity_type}" disabled 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #f5f5f5; color: #7f8c8d;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #2c3e50;">Entity ID</label>
                        <input type="text" value="${note.entity_id}" disabled 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #f5f5f5; color: #7f8c8d;">
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button id="modal-cancel-edit-note" 
                        style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s;">
                        Cancel
                    </button>
                    <button id="modal-submit-edit-note" 
                        style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s;">
                        Save Changes
                    </button>
                </div>
            </div>
        `;
        
        const modal = createModal('Edit Note', modalContent);
        
        const textarea = document.getElementById('modal-edit-note-content');
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 100);
        
        const cancelBtn = document.getElementById('modal-cancel-edit-note');
        const submitBtn = document.getElementById('modal-submit-edit-note');
        
        cancelBtn.onmouseenter = () => cancelBtn.style.background = '#7f8c8d';
        cancelBtn.onmouseleave = () => cancelBtn.style.background = '#95a5a6';
        submitBtn.onmouseenter = () => submitBtn.style.background = '#229954';
        submitBtn.onmouseleave = () => submitBtn.style.background = '#27ae60';
        
        cancelBtn.onclick = () => closeModal(modal);
        submitBtn.onclick = async () => {
            const newContent = textarea.value.trim();
            
            if (!newContent) {
                alert('Note content cannot be empty');
                textarea.focus();
                return;
            }
            
            if (newContent === note.content) {
                closeModal(modal);
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
            
            try {
                const res = await fetch(`${NOTES_API_URL}/${note.note_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ content: newContent })
                });
                
                if (!res.ok) throw new Error('Failed to update note');
                
                closeModal(modal);
                await loadRecentNotes();
                showNotification('✓ Note updated successfully', 'success');
                
            } catch (err) {
                console.error('[NOTES] Update error:', err);
                alert(`Error updating note: ${err.message}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Changes';
            }
        };
    }

    async function handleDeleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }
        
        try {
            const res = await fetch(`${NOTES_API_URL}/${noteId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!res.ok) throw new Error('Failed to delete note');
            
            await loadRecentNotes();
            showNotification('✓ Note deleted successfully', 'success');
            
        } catch (err) {
            console.error('[NOTES] Delete error:', err);
            alert(`Error deleting note: ${err.message}`);
        }
    }
    if (deadlines && deadlines.length > 0) {
        const nextDeadline = deadlines[0];
        deadlineDisplay.textContent =
            `${nextDeadline.date} - ${nextDeadline.description}`;
        } 

    function updateCalendarWidget(deadlines) {
        const dd = document.getElementById('next-deadline-display');
        const dl = document.getElementById('calendar-deadlines');
        
        if (!dd) return;
        
        if (!deadlines || deadlines.length === 0) {
            dd.textContent = 'No upcoming deadlines';
            if (dl) dl.innerHTML = '<li><span>No tasks scheduled</span></li>';
            return;
        }
        
        const next = deadlines[0];
        dd.textContent = `${formatDate(next.due_date)} • ${next.title}`;
        
        if (dl) {
            dl.innerHTML = '';
            deadlines.slice(0, 4).forEach(t => {
                const li = document.createElement('li');
                li.style.cssText = 'display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1;';
                li.innerHTML = `<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.title}</span>
                    <span style="font-size: 12px; color: #7f8c8d; margin-left: 8px;">${formatDate(t.due_date)}</span>`;
                dl.appendChild(li);
            });
        }
    }

    function formatDate(d) {
        if (!d) return '-';
        const date = new Date(d);
        return isNaN(date) ? d : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function updateTimeTracker() {
        const ttc = document.querySelector('.time-tracker-content');
        if (!ttc) return;
        const h = 28, t = 40, p = Math.round((h/t)*100);
        ttc.innerHTML = `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; color: #7f8c8d; font-weight: 500;">This Week</span>
            <span style="font-size: 12px; color: #2c3e50; font-weight: 600;">${h}h / ${t}h</span></div>
            <div style="width: 100%; height: 18px; background: #ecf0f1; border-radius: 10px; overflow: hidden;">
                <div style="height: 100%; background: linear-gradient(90deg, #3498db 0%, #2ecc71 100%); width: ${p}%; border-radius: 10px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                    <span style="color: white; font-size: 10px; font-weight: 600;">${p}%</span></div></div>`;
    }

    async function updateTeamWidget() {
        const tm = document.getElementById('team-members');
        if (!tm) return;
        
        try {
            console.log('[TEAM] Fetching team members...');
            
            const response = await fetch(USERS_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const users = await response.json();
            console.log('[TEAM] Received', users.length, 'users');
            
            tm.innerHTML = '';
            
            if (!users || users.length === 0) {
                tm.innerHTML = '<div style="text-align: center; padding: 20px; color: #95a5a6; font-style: italic;">No team members found</div>';
                return;
            }
            
            // Make scrollable if many team members
            if (users.length > 8) {
                tm.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 15px; max-height: 300px; overflow-y: auto; padding-right: 5px;';
                
                // Add scrollbar styles
                const scrollStyle = document.createElement('style');
                scrollStyle.textContent = `
                    #team-members::-webkit-scrollbar { width: 6px; }
                    #team-members::-webkit-scrollbar-track { background: #ecf0f1; border-radius: 3px; }
                    #team-members::-webkit-scrollbar-thumb { background: #bdc3c7; border-radius: 3px; }
                    #team-members::-webkit-scrollbar-thumb:hover { background: #95a5a6; }
                `;
                if (!document.getElementById('team-scrollbar-style')) {
                    scrollStyle.id = 'team-scrollbar-style';
                    document.head.appendChild(scrollStyle);
                }
            } else {
                tm.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 15px;';
            }
            
            // Color palette for avatars
            const colors = [
                '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
                '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
                '#16a085', '#27ae60', '#2980b9', '#8e44ad',
                '#c0392b', '#d35400', '#7f8c8d', '#2c3e50'
            ];
            
            users.forEach((user, index) => {
                const div = document.createElement('div');
                div.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.2s;';
                div.title = `${user.name || user.username || 'User'} - ${user.email || 'No email'}`;
                
                // Hover effect
                div.onmouseenter = () => div.style.transform = 'scale(1.05)';
                div.onmouseleave = () => div.style.transform = 'scale(1)';
                
                // Get initials from name or username
                const displayName = user.name || user.username || `User ${user.user_id}`;
                const nameParts = displayName.trim().split(' ');
                let initials;
                
                if (nameParts.length >= 2) {
                    // First name + Last name initials
                    initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
                } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
                    // First two letters of single name
                    initials = nameParts[0].substring(0, 2);
                } else {
                    // Fallback
                    initials = nameParts[0][0] + (nameParts[0][1] || '');
                }
                
                initials = initials.toUpperCase();
                
                // Assign color based on user ID for consistency
                const color = colors[user.user_id % colors.length];
                
                // Avatar
                const avatar = document.createElement('div');
                avatar.style.cssText = `
                    width: 50px; 
                    height: 50px; 
                    border-radius: 50%; 
                    background: ${color}; 
                    color: white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: 700; 
                    font-size: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: box-shadow 0.2s;
                `;
                avatar.textContent = initials;
                
                avatar.onmouseenter = () => avatar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                avatar.onmouseleave = () => avatar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                
                // Name label (first name or username)
                const nameLabel = document.createElement('span');
                nameLabel.style.cssText = 'font-size: 13px; color: #2c3e50; font-weight: 500; text-align: center; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
                nameLabel.textContent = nameParts[0];
                nameLabel.title = displayName;
                
                div.appendChild(avatar);
                div.appendChild(nameLabel);
                tm.appendChild(div);
            });
            
            console.log('[TEAM] Rendered', users.length, 'team members');
            
        } catch (err) {
            console.error('[TEAM] Error loading team members:', err);
            tm.innerHTML = '<div style="text-align: center; padding: 20px; color: #e74c3c; font-style: italic;">Error loading team members</div>';
        }
    }

    async function handleGenerateSummary() {
        const txt = updatesInput.value.trim();
        if (!txt) { alert('Enter updates'); return; }
        const out = document.getElementById('summary-output');
        out.classList.remove('hidden');
        out.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Generating...</p>';
        generateBtn.disabled = true;
        await new Promise(r => setTimeout(r, 2000));
        out.innerHTML = `<p>Summary: ${txt.substring(0,100)}...</p>`;
        generateBtn.disabled = false;
    }

    function showNotification(msg, type = 'info') {
        const n = document.createElement('div');
        const colors = { success: '#27ae60', error: '#e74c3c', info: '#3498db' };
        n.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 25px; background: ${colors[type]}; color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; animation: slideIn 0.3s;`;
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(() => { n.style.animation = 'slideOut 0.3s'; setTimeout(() => n.remove(), 300); }, 3000);
    }

    const style = document.createElement('style');
    style.textContent = `@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`;
    document.head.appendChild(style);
    
    console.log('[HOME] Initialization complete');
});