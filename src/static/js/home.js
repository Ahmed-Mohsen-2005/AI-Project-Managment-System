// Home Page / Dashboard - Complete with Project Filter
const DASHBOARD_API_URL = '/api/v1/home/dashboard';
const TASKS_API_URL = '/api/v1/tasks';
const NOTES_API_URL = '/api/v1/notes';
const SPRINTS_API_URL = '/api/v1/sprints';
const USERS_API_URL = '/api/v1/users';
const PROJECTS_API_URL = '/api/v1/projects';

// Global state for filtering
let currentProjectFilter = null;
let allTasks = [];
let allNotes = [];
let allSprints = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('[HOME] Page loaded, initializing...');
    
    const generateBtn = document.getElementById('generate-summary-btn');
    const updatesInput = document.getElementById('project-updates-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const projectSelect = document.getElementById('project-select');

    // Initialize dashboard
    loadProjects();
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

    if (projectSelect) {
        projectSelect.addEventListener('change', handleProjectFilterChange);
    }

    // ================================================
    // PROJECT FILTER FUNCTIONS
    // ================================================

    async function loadProjects() {
        console.log('[PROJECTS] Loading projects...');
        
        try {
            const response = await fetch(PROJECTS_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const projects = await response.json();
            console.log('[PROJECTS] Received', projects.length, 'projects');
            
            populateProjectFilter(projects);
            
        } catch (err) {
            console.error('[PROJECTS] Error:', err);
            const projectSelect = document.getElementById('project-select');
            if (projectSelect) {
                projectSelect.innerHTML = '<option value="">All Projects (Error loading)</option>';
            }
        }
    }

    function populateProjectFilter(projects) {
        const projectSelect = document.getElementById('project-select');
        if (!projectSelect) return;
        
        projectSelect.innerHTML = '<option value="">All Projects</option>';
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id;
            option.textContent = project.name || `Project ${project.project_id}`;
            projectSelect.appendChild(option);
        });
        
        console.log('[PROJECTS] Filter populated with', projects.length, 'projects');
    }

    async function handleProjectFilterChange(event) {
        const projectId = event.target.value;
        currentProjectFilter = projectId ? parseInt(projectId) : null;
        
        console.log('[FILTER] Changed to project:', currentProjectFilter || 'All');
        
        showNotification('Filtering dashboard...', 'info');
        
        await Promise.all([
            loadTodoList(),
            loadRecentNotes(),
            loadUpcomingTasks(),
            updateTeamWidget()
        ]);
        
        showNotification('✓ Dashboard filtered', 'success');
    }

    function getFilteredData(dataArray, projectIdField = 'project_id') {
        if (!currentProjectFilter) {
            return dataArray;
        }
        
        return dataArray.filter(item => {
            if (projectIdField === 'sprint.project_id' && item.sprint_id) {
                const sprint = allSprints.find(s => s.sprint_id === item.sprint_id);
                return sprint && sprint.project_id === currentProjectFilter;
            }
            return item[projectIdField] === currentProjectFilter;
        });
    }

    // ================================================
    // TODO LIST FUNCTIONS WITH FILTERING (KEEP ORIGINAL STYLES)
    // ================================================

    async function loadTodoList() {
        console.log('[TODO] Loading tasks...');
        
        try {
            const [tasksResponse, sprintsResponse] = await Promise.all([
                fetch(TASKS_API_URL, { method: 'GET', credentials: 'include' }),
                fetch(SPRINTS_API_URL, { method: 'GET', credentials: 'include' })
            ]);
            
            if (!tasksResponse.ok) {
                throw new Error(`HTTP ${tasksResponse.status}`);
            }
            
            allTasks = await tasksResponse.json();
            
            if (sprintsResponse.ok) {
                allSprints = await sprintsResponse.json();
            }
            
            console.log('[TODO] Received', allTasks.length, 'tasks');
            
            const currentUserId = getCurrentUserId();
            let userTasks = currentUserId 
                ? allTasks.filter(t => t.assigned_id === currentUserId) 
                : allTasks;
            
            userTasks = getFilteredData(userTasks, 'sprint.project_id');
            userTasks = userTasks.filter(t => t.status === 'TODO');
            
            console.log('[TODO] Filtered to TODO status:', userTasks.length, 'tasks');
            
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
            const emptyMsg = currentProjectFilter 
                ? 'No TODO tasks for selected project'
                : 'No TODO tasks';
            todoList.innerHTML = `<li style="padding: 20px; text-align: center; color: #95a5a6; font-style: italic;">${emptyMsg}</li>`;
            return;
        }
        
        console.log('[TODO] Rendering', tasks.length, 'tasks');
        
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-bottom: 1px solid #ecf0f1; transition: background 0.2s;';
            
            li.onmouseenter = () => li.style.background = '#f8f9fa';
            li.onmouseleave = () => li.style.background = 'transparent';
            
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = task.status === 'DONE';
            cb.style.cssText = 'flex-shrink: 0; cursor: pointer; width: 18px; height: 18px;';
            cb.onchange = () => handleTaskToggle(task, cb);
            
            const text = document.createElement('span');
            text.textContent = task.title;
            text.title = task.title;
            text.style.cssText = `flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ${task.status === 'DONE' ? 'text-decoration: line-through; color: #95a5a6;' : 'color: #2c3e50;'}`;
            
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
            await loadTodoList();
            
        } catch (err) {
            console.error('[TODO] Update error:', err);
            showNotification('Error updating task', 'error');
            checkbox.checked = !checkbox.checked;
        }
    }

    function getCurrentUserId() {
        return null;
    }

    // ================================================
    // NOTES FUNCTIONS - NO INLINE STYLES (CSS CLASSES ONLY)
    // ================================================

    async function loadRecentNotes() {
        try {
            const res = await fetch(NOTES_API_URL, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed');
            
            allNotes = await res.json();
            
            let filteredNotes = allNotes;
            
            if (currentProjectFilter) {
                filteredNotes = allNotes.filter(note => {
                    if (note.entity_type === 'project' && note.entity_id === currentProjectFilter) {
                        return true;
                    }
                    
                    if (note.entity_type === 'sprint') {
                        const sprint = allSprints.find(s => s.sprint_id === note.entity_id);
                        return sprint && sprint.project_id === currentProjectFilter;
                    }
                    
                    if (note.entity_type === 'task') {
                        const task = allTasks.find(t => t.task_id === note.entity_id);
                        if (task) {
                            const sprint = allSprints.find(s => s.sprint_id === task.sprint_id);
                            return sprint && sprint.project_id === currentProjectFilter;
                        }
                    }
                    
                    return false;
                });
            }
            
            updateNotesWidget(filteredNotes);
            
        } catch (err) {
            console.error('Notes error:', err);
            updateNotesWidget([]);
        }
    }

    function updateNotesWidget(notes) {
        const nc = document.getElementById('notes-content');
        if (!nc) return;
        
        nc.innerHTML = '';
        
        // Add Note button
        const btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-plus"></i> Add Note';
        btn.className = 'btn-add-note';
        btn.onclick = () => openAddNoteModal();
        nc.appendChild(btn);
        
        if (!notes || notes.length === 0) {
            const emptyMsg = currentProjectFilter 
                ? 'No notes for selected project'
                : 'No notes yet';
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'notes-empty-state';
            emptyDiv.innerHTML = `<i class="fas fa-sticky-note"></i><p>${emptyMsg}</p>`;
            nc.appendChild(emptyDiv);
            return;
        }
        
        // Notes container
        const notesContainer = document.createElement('div');
        notesContainer.className = 'notes-container';
        
        // Add scrollbar styles
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.textContent = `
            #notes-content .notes-container::-webkit-scrollbar { width: 6px; }
            #notes-content .notes-container::-webkit-scrollbar-track { background: #ecf0f1; border-radius: 3px; }
            #notes-content .notes-container::-webkit-scrollbar-thumb { background: #bdc3c7; border-radius: 3px; }
            #notes-content .notes-container::-webkit-scrollbar-thumb:hover { background: #95a5a6; }
        `;
        if (!document.getElementById('notes-scrollbar-style')) {
            scrollbarStyle.id = 'notes-scrollbar-style';
            document.head.appendChild(scrollbarStyle);
        }
        
        notes.forEach(note => {
            const div = document.createElement('div');
            div.className = 'note-card';
            div.dataset.noteId = note.note_id;
            
            // Note content
            const content = document.createElement('div');
            content.className = 'note-content';
            content.textContent = note.content;
            
            // Note metadata
            const meta = document.createElement('div');
            meta.className = 'note-meta';
            const dateStr = note.created_at 
                ? new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '';
            meta.innerHTML = `
                <span>${note.entity_type} #${note.entity_id}</span>
                <span>${dateStr}</span>
            `;
            
            // Action buttons
            const actions = document.createElement('div');
            actions.className = 'note-actions';
            
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit note';
            editBtn.className = 'note-btn note-btn-edit';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                handleEditNote(note);
            };
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete note';
            deleteBtn.className = 'note-btn note-btn-delete';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                handleDeleteNote(note.note_id);
            };
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            
            div.appendChild(content);
            div.appendChild(meta);
            div.appendChild(actions);
            notesContainer.appendChild(div);
        });
        
        nc.appendChild(notesContainer);
        
        if (notes.length > 5) {
            const countMsg = document.createElement('div');
            countMsg.className = 'note-count';
            countMsg.textContent = `Showing ${notes.length} note${notes.length !== 1 ? 's' : ''}`;
            nc.appendChild(countMsg);
        }
    }

    function openAddNoteModal() {
        const modalContent = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Note Content <span style="color: red;">*</span></label>
                    <textarea id="modal-note-content" placeholder="Write your note..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 100px; resize: vertical;"></textarea>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Entity Type</label>
                        <select id="modal-note-entity-type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                            <option value="task">Task</option>
                            <option value="project">Project</option>
                            <option value="sprint">Sprint</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Entity ID <span style="color: red;">*</span></label>
                        <input type="number" id="modal-note-entity-id" value="${currentProjectFilter || 1}" min="1" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button id="modal-cancel-note" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button id="modal-submit-note" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer;">Save Note</button>
                </div>
            </div>
        `;
        
        const modal = createModal('Add New Note', modalContent);
        setTimeout(() => document.getElementById('modal-note-content').focus(), 100);
        document.getElementById('modal-cancel-note').onclick = () => closeModal(modal);
        document.getElementById('modal-submit-note').onclick = () => submitNoteFromModal(modal);
    }

    async function submitNoteFromModal(modal) {
        const content = document.getElementById('modal-note-content').value.trim();
        const entityType = document.getElementById('modal-note-entity-type').value;
        const entityId = parseInt(document.getElementById('modal-note-entity-id').value);

        if (!content) {
            showNotification('Content required', 'error');
            return;
        }
        
        if (!entityId || entityId < 1) {
            showNotification('Valid Entity ID required', 'error');
            return;
        }

        const submitBtn = document.getElementById('modal-submit-note');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const res = await fetch(NOTES_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    content,
                    entity_type: entityType,
                    entity_id: entityId,
                    created_by: 1
                })
            });

            if (!res.ok) throw new Error('Failed to create note');

            closeModal(modal);
            await loadRecentNotes();
            showNotification('✓ Note saved', 'success');

        } catch (err) {
            showNotification(`Error: ${err.message}`, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Note';
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
                showNotification('Note content cannot be empty', 'error');
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
                showNotification(`Error updating note: ${err.message}`, 'error');
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
            showNotification(`Error deleting note: ${err.message}`, 'error');
        }
    }

    // ================================================
    // CALENDAR WIDGET WITH FILTERING (KEEP ORIGINAL)
    // ================================================

    async function loadUpcomingTasks() {
        try {
            const res = await fetch(TASKS_API_URL, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed');
            
            allTasks = await res.json();
            let filteredTasks = getFilteredData(allTasks, 'sprint.project_id');
            
            const upcoming = filteredTasks
                .filter(t => t.status !== 'DONE' && (!t.due_date || new Date(t.due_date) >= new Date()))
                .sort((a, b) => {
                    if (!a.due_date && !b.due_date) return 0;
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date) - new Date(b.due_date);
                })
                .slice(0, 5);
            
            updateCalendarWidget(upcoming);
            
        } catch (err) {
            console.error('Calendar error:', err);
            updateCalendarWidget([]);
        }
    }

    function updateCalendarWidget(deadlines) {
        const dd = document.getElementById('next-deadline-display');
        const dl = document.getElementById('calendar-deadlines');
        
        if (!dd) return;
        
        if (!deadlines || deadlines.length === 0) {
            const emptyMsg = currentProjectFilter 
                ? 'No upcoming deadlines for selected project'
                : 'No upcoming deadlines';
            dd.textContent = emptyMsg;
            if (dl) dl.innerHTML = `<li><span>${emptyMsg}</span></li>`;
            return;
        }
        
        const next = deadlines[0];
        dd.textContent = `${next.due_date ? formatDate(next.due_date) : 'No date'} • ${next.title}`;
        
        if (dl) {
            dl.innerHTML = '';
            deadlines.slice(0, 4).forEach(t => {
                const li = document.createElement('li');
                li.style.cssText = 'display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1;';
                li.innerHTML = `
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.title}</span>
                    <span style="font-size: 12px; color: #7f8c8d; margin-left: 8px;">${t.due_date ? formatDate(t.due_date) : 'No date'}</span>
                `;
                dl.appendChild(li);
            });
        }
    }

    // ================================================
    // TASK MODAL FUNCTIONS (KEEP ORIGINAL)
    // ================================================

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
            showNotification('Error loading data', 'error');
            return;
        }
        
        closeModal(loadingModal);
        
        if (currentProjectFilter) {
            sprints = sprints.filter(s => s.project_id === currentProjectFilter);
        }
        
        if (sprints.length === 0 && currentProjectFilter) {
            const sprintOpts = '<option value="">No sprints available for this project</option>';
            const userOpts = users.map(u => `<option value="${u.user_id}">${u.name || u.username || 'User ' + u.user_id}</option>`).join('');
            showAddTaskModalContent(sprintOpts, userOpts, true);
            return;
        }
        
        if (sprints.length === 0 && !currentProjectFilter) {
            const sprintOpts = '<option value="">No sprints available - Please create a sprint first</option>';
            const userOpts = users.map(u => `<option value="${u.user_id}">${u.name || u.username || 'User ' + u.user_id}</option>`).join('');
            showAddTaskModalContent(sprintOpts, userOpts, true);
            return;
        }
        
        const sprintOpts = sprints.map(s => `<option value="${s.sprint_id}">${s.name}</option>`).join('');
        const userOpts = users.map(u => `<option value="${u.user_id}">${u.name || u.username || 'User ' + u.user_id}</option>`).join('');
        
        showAddTaskModalContent(sprintOpts, userOpts, false);
    }

    function showAddTaskModalContent(sprintOpts, userOpts, noSprints = false) {
        const warningHtml = noSprints ? '<div style="padding: 10px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; color: #856404;"><i class="fas fa-exclamation-triangle"></i> No sprints available. Please create a sprint or select a different project.</div>' : '';
        
        const modalContent = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                ${warningHtml}
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Task Title <span style="color: red;">*</span></label>
                    <input type="text" id="modal-task-title" placeholder="Enter task title" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Sprint <span style="color: red;">*</span></label>
                        <select id="modal-task-sprint" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;" ${noSprints ? 'disabled' : ''}>${sprintOpts}</select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Assigned To <span style="color: red;">*</span></label>
                        <select id="modal-task-assigned" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;">${userOpts}</select>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Status</label>
                        <select id="modal-task-status" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;">
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Priority</label>
                        <select id="modal-task-priority" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;">
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM" selected>MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Estimate (hrs)</label>
                        <input type="number" id="modal-task-estimate" placeholder="0" step="0.5" min="0" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Due Date</label>
                    <input type="date" id="modal-task-due-date" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button id="modal-cancel-task" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button id="modal-submit-task" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer;" ${noSprints ? 'disabled' : ''}>Add Task</button>
                </div>
            </div>
        `;
        
        const modal = createModal('Add New Task', modalContent);
        setTimeout(() => document.getElementById('modal-task-title').focus(), 100);
        document.getElementById('modal-cancel-task').onclick = () => closeModal(modal);
        
        if (!noSprints) {
            document.getElementById('modal-submit-task').onclick = () => submitTaskFromModal(modal);
        }
    }

    async function submitTaskFromModal(modal) {
        const title = document.getElementById('modal-task-title').value.trim();
        const sprintSelect = document.getElementById('modal-task-sprint');
        const sprintId = sprintSelect ? parseInt(sprintSelect.value) : null;
        const assignedId = parseInt(document.getElementById('modal-task-assigned').value);
        const status = document.getElementById('modal-task-status').value;
        const priority = document.getElementById('modal-task-priority').value;
        const estimate = document.getElementById('modal-task-estimate').value;
        const dueDate = document.getElementById('modal-task-due-date').value;

        if (!title) {
            showNotification('Task title required', 'error');
            return;
        }
        
        if (!sprintId || isNaN(sprintId)) {
            showNotification('Please select a valid sprint', 'error');
            return;
        }
        
        if (!assignedId || isNaN(assignedId)) {
            showNotification('Please select a user', 'error');
            return;
        }

        const submitBtn = document.getElementById('modal-submit-task');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';

        try {
            const res = await fetch(TASKS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title,
                    sprint_id: sprintId,
                    assigned_id: assignedId,
                    status,
                    priority,
                    estimate_hours: estimate ? parseFloat(estimate) : null,
                    due_date: dueDate || null,
                    created_by: assignedId
                })
            });

            if (!res.ok) throw new Error('Failed to create task');

            closeModal(modal);
            await loadTodoList();
            await loadUpcomingTasks();
            showNotification(`✓ Task "${title}" added`, 'success');

        } catch (err) {
            console.error('[TASK] Create error:', err);
            showNotification(`Error: ${err.message}`, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Task';
        }
    }

    // ================================================
    // MODAL AND UTILITY FUNCTIONS
    // ================================================

    function createModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">${content}</div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal(overlay);
        };
        
        modal.querySelector('.modal-close').onclick = () => closeModal(overlay);
        
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal(overlay);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        return overlay;
    }

    function closeModal(overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    }

    async function loadDashboardData() {
        try {
            const sprintsRes = await fetch(SPRINTS_API_URL, { credentials: 'include' });
            if (sprintsRes.ok) {
                allSprints = await sprintsRes.json();
            }
            
            const tasksRes = await fetch(TASKS_API_URL, { credentials: 'include' });
            if (tasksRes.ok) {
                allTasks = await tasksRes.json();
            }
            
            await loadUpcomingTasks();
            updateTimeTracker();
            await updateTeamWidget();
            
        } catch (err) {
            console.error('Dashboard error:', err);
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
        
        const h = 28, t = 40, p = Math.round((h / t) * 100);
        
        ttc.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 11px; color: #7f8c8d; font-weight: 500;">This Week</span>
                <span style="font-size: 12px; color: #2c3e50; font-weight: 600;">${h}h / ${t}h</span>
            </div>
            <div style="width: 100%; height: 18px; background: #ecf0f1; border-radius: 10px; overflow: hidden;">
                <div style="height: 100%; background: linear-gradient(90deg, #3498db 0%, #2ecc71 100%); width: ${p}%; border-radius: 10px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                    <span style="color: white; font-size: 10px; font-weight: 600;">${p}%</span>
                </div>
            </div>
        `;
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
            
            let users = await response.json();
            console.log('[TEAM] Received', users.length, 'users');
            
            if (currentProjectFilter) {
                const projectSprints = allSprints.filter(s => s.project_id === currentProjectFilter);
                const sprintIds = projectSprints.map(s => s.sprint_id);
                const projectTasks = allTasks.filter(t => sprintIds.includes(t.sprint_id));
                const projectUserIds = [...new Set(projectTasks.map(t => t.assigned_id))];
                
                users = users.filter(u => projectUserIds.includes(u.user_id));
                console.log('[TEAM] Filtered to', users.length, 'users for project', currentProjectFilter);
            }
            
            tm.innerHTML = '';
            
            if (!users || users.length === 0) {
                const emptyMsg = currentProjectFilter 
                    ? 'No team members assigned to this project'
                    : 'No team members found';
                tm.innerHTML = `<div style="text-align: center; padding: 20px; color: #95a5a6; font-style: italic;">${emptyMsg}</div>`;
                return;
            }
            
            if (users.length > 8) {
                tm.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 15px; max-height: 300px; overflow-y: auto; padding-right: 5px;';
                
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
            
            const colors = [
                '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
                '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
                '#16a085', '#27ae60', '#2980b9', '#8e44ad',
                '#c0392b', '#d35400', '#7f8c8d', '#2c3e50'
            ];
            
            users.forEach(user => {
                const div = document.createElement('div');
                div.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.2s;';
                
                const displayName = user.name || user.username || `User ${user.user_id}`;
                let tooltipText = `${displayName} - ${user.email || 'No email'}`;
                
                if (currentProjectFilter) {
                    const userTaskCount = allTasks.filter(t => 
                        t.assigned_id === user.user_id && 
                        allSprints.some(s => s.sprint_id === t.sprint_id && s.project_id === currentProjectFilter)
                    ).length;
                    tooltipText += `\n${userTaskCount} task${userTaskCount !== 1 ? 's' : ''}`;
                }
                
                div.title = tooltipText;
                
                div.onmouseenter = () => div.style.transform = 'scale(1.05)';
                div.onmouseleave = () => div.style.transform = 'scale(1)';
                
                const nameParts = displayName.trim().split(' ');
                let initials;
                
                if (nameParts.length >= 2) {
                    initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
                } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
                    initials = nameParts[0].substring(0, 2);
                } else {
                    initials = nameParts[0][0] + (nameParts[0][1] || '');
                }
                
                initials = initials.toUpperCase();
                const color = colors[user.user_id % colors.length];
                
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
        
        if (!txt) {
            showNotification('Enter updates', 'error');
            return;
        }
        
        const out = document.getElementById('summary-output');
        out.classList.remove('hidden');
        out.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Generating...</p>';
        
        generateBtn.disabled = true;
        
        await new Promise(r => setTimeout(r, 2000));
        
        out.innerHTML = `<p>Summary: ${txt.substring(0, 100)}...</p>`;
        generateBtn.disabled = false;
    }

    function showNotification(msg, type = 'info') {
        const n = document.createElement('div');
        const colors = { success: '#27ae60', error: '#e74c3c', info: '#3498db' };
        n.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${colors[type]};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s;
        `;
        n.textContent = msg;
        document.body.appendChild(n);
        
        setTimeout(() => {
            n.style.animation = 'slideOut 0.3s';
            setTimeout(() => n.remove(), 300);
        }, 3000);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    console.log('[HOME] Initialization complete');
});
