document.addEventListener('DOMContentLoaded', () => {
    const sprintList = document.getElementById('sprint-item-list');
    const createSprintBtn = document.getElementById('create-new-sprint-btn');
    const modal = document.getElementById('create-sprint-modal');
    const closeBtn = document.querySelector('.close-btn');
    const createSprintForm = document.getElementById('create-sprint-form');
    const projectFilter = document.getElementById('project-filter');
    
    // --- API CONFIGURATION ---
    const API_BASE_URL = '/api/v1/sprints';

    // --- INITIALIZATION ---
    loadSprints();
    
    // --- EVENT LISTENERS ---
    createSprintBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    createSprintForm.addEventListener('submit', handleCreateSprintSubmit);
    projectFilter.addEventListener('change', loadSprints); 


    // --- MODAL CONTROL ---
    function openModal() { modal.style.display = 'block'; }
    function closeModal() { modal.style.display = 'none'; createSprintForm.reset(); }

    // --- DATA LOADING & RENDERING ---
    async function loadSprints() {
        sprintList.innerHTML = ''; // Clear current list
        
        const currentProjectId = projectFilter.value;
        
        // Construct URL based on filter
        let url = API_BASE_URL + "/";
        if (currentProjectId !== 'all') {
            url += `?project_id=${currentProjectId}`;
        }

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sprintsData = await response.json();

            if (sprintsData.length === 0) {
                sprintList.innerHTML = '<li class="loading-message">No sprints found.</li>';
                return;
            }
            
            sprintsData.forEach(sprintData => {
                // Map the DB response to the format the UI expects
                const uiSprint = mapApiDataToUiModel(sprintData);
                sprintList.insertAdjacentHTML('beforeend', createSprintRow(uiSprint));
            });

        } catch (error) {
            console.error('Error loading sprints:', error);
            sprintList.innerHTML = `<li class="error-message">Error loading sprints: ${error.message}</li>`;
        }
    }

    /**
     * Bridges the gap between Python DB keys (snake_case) and UI keys.
     */
    function mapApiDataToUiModel(apiData) {
        // Handle case where status might be missing from DB or API
        const statusVal = apiData.status ? apiData.status.toLowerCase() : 'future';
        
        return {
            id: apiData.sprint_id,
            name: apiData.name,
            start: apiData.start_date, 
            end: apiData.end_date,
            status: statusVal,
            velocity: apiData.velocity || 0,
            project_id: apiData.project_id,
            tasks_done: 0, // Placeholder
            total_tasks: 0, // Placeholder
            // Calculate forecast based on status if API doesn't provide it
            ai_forecast: statusVal === 'future' ? 'Needs Planning' : 'On Time'
        };
    }
    
    function createSprintRow(sprint) {
        // Handle division by zero
        const velocityPercent = sprint.total_tasks > 0 
            ? Math.floor((sprint.tasks_done / sprint.total_tasks) * 100) 
            : 0;

        const statusClass = sprint.status; 
        const forecastClass = sprint.ai_forecast.includes('Delayed') ? 'delayed' : 'on-time';

        return `
            <li class="sprint-item">
                <span class="col-status">
                    <span class="status-badge ${statusClass}">${sprint.status.toUpperCase()}</span>
                </span>
                <span class="col-title">
                    <strong>${sprint.name}</strong>
                    <span class="sprint-duration">
                        ${sprint.start} to ${sprint.end}
                    </span>
                </span>
                <span class="col-velocity">
                    ${velocityPercent}%
                    <div class="velocity-bar">
                        <div class="velocity-fill" style="width: ${velocityPercent}%"></div>
                    </div>
                </span>
                <span class="col-forecast">
                    <strong class="forecast-value ${forecastClass}">
                        <i class="fas fa-robot"></i> ${sprint.ai_forecast}
                    </strong>
                    <span class="forecast-label">Forecasted Completion</span>
                </span>
                <span class="col-tasks">
                    ${sprint.tasks_done} / ${sprint.total_tasks}
                </span>
                <span class="col-actions">
                    <button class="btn-icon"><i class="fas fa-edit" title="Edit Sprint"></i></button>
                    <button class="btn-icon"><i class="fas fa-stopwatch" title="Start/Stop Sprint"></i></button>
                </span>
            </li>
        `;
    }

    // --- FORM SUBMISSION LOGIC ---
    async function handleCreateSprintSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('sprint-name-input').value.trim();
        const start = document.getElementById('sprint-start-date').value;
        const end = document.getElementById('sprint-end-date').value;
        const projectId = document.getElementById('sprint-project').value;

        if (!name || !start || !end) return;

        // UPDATED PAYLOAD: 
        // 1. Removed 'status' (DB doesn't use it anymore)
        // 2. Added 'velocity' (DB expects it, default to 0)
        const sprintPayload = {
            name: name,
            project_id: projectId,
            start_date: start, 
            end_date: end,     
            velocity: 0 
        };
        
        try {
            const response = await fetch(API_BASE_URL + "/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sprintPayload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`[SUCCESS] Sprint created with ID: ${result.sprint_id}`);
                closeModal();
                loadSprints(); // Reload list
            } else {
                const err = await response.json();
                alert('Error creating sprint: ' + (err.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Failed to connect to server.');
        }
    }

});