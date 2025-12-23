document.addEventListener('DOMContentLoaded', () => {
    const sprintList = document.getElementById('sprint-item-list');
    const createSprintBtn = document.getElementById('create-new-sprint-btn');
    const projectFilter = document.getElementById('project-filter');
    
    // Create Modal Elements
    const createModal = document.getElementById('create-sprint-modal');
    const createSprintForm = document.getElementById('create-sprint-form');
    const closeCreateBtn = createModal.querySelector('.close-btn');

    // Edit Modal Elements
    const editModal = document.getElementById('edit-sprint-modal');
    const editForm = document.getElementById('edit-sprint-form');
    const closeEditBtn = document.getElementById('close-edit-modal');
    
    const API_BASE_URL = '/api/v1/sprints';

    // --- INITIALIZATION ---
    loadSprints();
    
    // --- EVENT LISTENERS ---

    // Create Modal Logic
    createSprintBtn.addEventListener('click', () => { createModal.style.display = 'block'; });
    closeCreateBtn.addEventListener('click', () => { closeModal(createModal, createSprintForm); });

    // Edit Modal Logic
    closeEditBtn.addEventListener('click', () => { closeModal(editModal, editForm); });

    // Global Window Click (Close modals when clicking outside)
    window.addEventListener('click', (event) => {
        if (event.target === createModal) closeModal(createModal, createSprintForm);
        if (event.target === editModal) closeModal(editModal, editForm);
    });

    // Form Submissions
    createSprintForm.addEventListener('submit', handleCreateSprintSubmit);
    editForm.addEventListener('submit', handleEditSprintSubmit);
    
    // Filters
    projectFilter.addEventListener('change', loadSprints); 

    // --- MODAL CONTROL HELPERS ---
    function closeModal(modalElement, formElement) {
        modalElement.style.display = 'none';
        if (formElement) formElement.reset();
    }

    // --- DATA LOADING & RENDERING ---
    async function loadSprints() {
        sprintList.innerHTML = '<li class="loading-message">Loading...</li>';
        
        const currentProjectId = projectFilter.value;
        let url = API_BASE_URL + "/";
        if (currentProjectId !== 'all') url += `?project_id=${currentProjectId}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const sprintsData = await response.json();

            if (sprintsData.length === 0) {
                sprintList.innerHTML = '<li class="loading-message">No sprints found.</li>';
                return;
            }
            
            sprintList.innerHTML = ''; // Clear for real data
            sprintsData.forEach(sprintData => {
                const uiSprint = mapApiDataToUiModel(sprintData);
                sprintList.insertAdjacentHTML('beforeend', createSprintRow(uiSprint));
            });
        } catch (error) {
            console.error('Error loading sprints:', error);
            sprintList.innerHTML = `<li class="error-message">Error loading sprints: ${error.message}</li>`;
        }
    }

    function mapApiDataToUiModel(apiData) {
        const statusVal = apiData.status ? apiData.status.toLowerCase() : 'future';
        return {
            id: apiData.sprint_id,
            name: apiData.name,
            start: apiData.start_date, 
            end: apiData.end_date,
            status: statusVal,
            velocity: apiData.velocity || 0,
            project_id: apiData.project_id,
            tasks_done: apiData.tasks_done || 0,
            total_tasks: apiData.total_tasks || 0,
            ai_forecast: apiData.ai_forecast || (statusVal === 'future' ? 'Needs Planning' : 'On Time')
        };
    }
    
    function createSprintRow(sprint) {
        const velocityPercent = sprint.total_tasks > 0 
            ? Math.floor((sprint.tasks_done / sprint.total_tasks) * 100) 
            : 0;

        const isRunning = sprint.status === 'active';
        const forecastClass = sprint.ai_forecast.includes('Delayed') ? 'delayed' : 'on-time';

        return `
            <li class="sprint-item">
                <span class="col-status">
                    <span class="status-badge ${sprint.status}">${sprint.status.toUpperCase()}</span>
                </span>
                <span class="col-title">
                    <strong>${sprint.name}</strong>
                    <span class="sprint-duration">${sprint.start} to ${sprint.end}</span>
                </span>
                <span class="col-velocity">
                    ${velocityPercent}%
                    <div class="velocity-bar"><div class="velocity-fill" style="width: ${velocityPercent}%"></div></div>
                </span>
                <span class="col-forecast">
                    <strong class="forecast-value ${forecastClass}"><i class="fas fa-robot"></i> ${sprint.ai_forecast}</strong>
                    <span class="forecast-label">Forecasted Completion</span>
                </span>
                <span class="col-tasks">${sprint.tasks_done} / ${sprint.total_tasks}</span>
                <span class="col-actions">
                    <button class="btn-icon edit-btn" data-id="${sprint.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon toggle-sprint-btn ${isRunning ? 'active-sprint' : ''}" 
                            data-id="${sprint.id}" data-status="${sprint.status}">
                        <i class="fas ${isRunning ? 'fa-stop' : 'fa-play'}"></i>
                    </button>
                </span>
            </li>`;
    }

    // --- DELEGATED CLICK HANDLER (Edit / Toggle) ---
    sprintList.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const toggleBtn = e.target.closest('.toggle-sprint-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            openEditModal(id);
        }

        if (toggleBtn) {
            handleToggleSprint(toggleBtn.dataset.id, toggleBtn.dataset.status);
        }
    });

    // --- EDIT LOGIC ---
    async function openEditModal(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            if (!response.ok) throw new Error("Failed to fetch sprint");
            const sprint = await response.json();

            document.getElementById('edit-sprint-id').value = sprint.sprint_id;
            document.getElementById('edit-sprint-name').value = sprint.name;
            document.getElementById('edit-sprint-start-date').value = sprint.start_date;
            document.getElementById('edit-sprint-end-date').value = sprint.end_date;

            editModal.style.display = 'block';
        } catch (err) {
            alert("Could not load sprint data.");
        }
    }

    async function handleEditSprintSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('edit-sprint-id').value;
        const payload = {
            name: document.getElementById('edit-sprint-name').value.trim(),
            start_date: document.getElementById('edit-sprint-start-date').value,
            end_date: document.getElementById('edit-sprint-end-date').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                closeModal(editModal, editForm);
                loadSprints();
            }
        } catch (err) {
            alert("Error updating sprint.");
        }
    }

    // --- TOGGLE LOGIC ---
    async function handleToggleSprint(id, currentStatus) {
        const newStatus = currentStatus === 'active' ? 'complete' : 'active';
        if (!confirm(`Change sprint status to ${newStatus}?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) loadSprints();
            else alert("Failed to update status. Check if endpoint exists.");
        } catch (err) {
            alert("Could not connect to server.");
        }
    }

    // --- CREATE LOGIC ---
    async function handleCreateSprintSubmit(e) {
        e.preventDefault();
        const sprintPayload = {
            name: document.getElementById('sprint-name-input').value.trim(),
            project_id: document.getElementById('sprint-project').value,
            start_date: document.getElementById('sprint-start-date').value, 
            end_date: document.getElementById('sprint-end-date').value,     
            velocity: 0 
        };
        
        try {
            const response = await fetch(API_BASE_URL + "/", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sprintPayload)
            });

            if (response.ok) {
                closeModal(createModal, createSprintForm);
                loadSprints();
            }
        } catch (error) {
            alert('Failed to connect to server.');
        }
    }
});