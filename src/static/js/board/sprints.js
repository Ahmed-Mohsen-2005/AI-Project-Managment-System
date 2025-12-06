// --- MOCK Data Source (Simulates fetch from Project Service) ---
const MOCK_SPRINTS = [
    { id: 1, name: 'Sprint 1 - Foundations', start: '2025-10-01', end: '2025-10-14', status: 'complete', velocity: 90, tasks_done: 18, total_tasks: 20, project_id: '1', ai_forecast: 'On Time' },
    { id: 2, name: 'Sprint 2 - User Auth & RBAC', start: '2025-10-15', end: '2025-10-28', status: 'complete', velocity: 100, tasks_done: 22, total_tasks: 22, project_id: '1', ai_forecast: 'On Time' },
    { id: 3, name: 'Sprint 3 - AI Monitoring MVP', start: '2025-11-01', end: '2025-11-14', status: 'complete', velocity: 75, tasks_done: 15, total_tasks: 20, project_id: '1', ai_forecast: 'Delayed by 2 days' },
    { id: 4, name: 'Sprint 4 - Frontend Redesign', start: '2025-11-15', end: '2025-11-28', status: 'active', velocity: 60, tasks_done: 12, total_tasks: 20, project_id: '2', ai_forecast: 'Delayed by 1 day' },
    { id: 5, name: 'Sprint 5 - Final Testing', start: '2025-12-01', end: '2025-12-14', status: 'future', velocity: 0, tasks_done: 0, total_tasks: 15, project_id: '1', ai_forecast: 'Needs Planning' },
];

document.addEventListener('DOMContentLoaded', () => {
    const sprintList = document.getElementById('sprint-item-list');
    const createSprintBtn = document.getElementById('create-new-sprint-btn');
    const modal = document.getElementById('create-sprint-modal');
    const closeBtn = document.querySelector('.close-btn');
    const createSprintForm = document.getElementById('create-sprint-form');
    const projectFilter = document.getElementById('project-filter');
    
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
    function loadSprints() {
        sprintList.innerHTML = '';
        const currentProjectId = projectFilter.value;
        
        const filteredSprints = MOCK_SPRINTS.filter(s => 
            currentProjectId === 'all' || s.project_id === currentProjectId
        );

        setTimeout(() => { // Simulate API latency
            if (filteredSprints.length === 0) {
                sprintList.innerHTML = '<li class="loading-message">No sprints found for this project.</li>';
                return;
            }
            
            filteredSprints.forEach(sprint => {
                sprintList.insertAdjacentHTML('beforeend', createSprintRow(sprint));
            });
        }, 400);
    }
    
    function createSprintRow(sprint) {
        const statusClass = sprint.status;
        const velocityPercent = sprint.status === 'complete' ? sprint.velocity : Math.floor((sprint.tasks_done / sprint.total_tasks) * 100);
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
    function handleCreateSprintSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('sprint-name-input').value.trim();
        const start = document.getElementById('sprint-start-date').value;
        const end = document.getElementById('sprint-end-date').value;
        const projectId = document.getElementById('sprint-project').value;

        if (!name || !start || !end) return;

        const newSprint = {
            id: Date.now(),
            name: name,
            start: start,
            end: end,
            status: 'future', 
            velocity: 0,
            tasks_done: 0,
            total_tasks: 0,
            project_id: projectId,
            ai_forecast: 'Needs Planning'
        };
        
        // --- API ACTION: Submit New Sprint Data ---
        submitNewSprint(newSprint);
        closeModal();
    }
    
    function submitNewSprint(sprintData) {
        console.log(`[ACTION] Submitting new sprint: ${sprintData.name}`);
        
        // --- REAL API CALL Placeholder ---
        // fetch('/api/v1/sprints', { method: 'POST', body: JSON.stringify(sprintData) })
        // .then(response => { if (response.ok) MOCK_SPRINTS.push(sprintData); loadSprints(); })
        
        // --- Simulation Success ---
        MOCK_SPRINTS.push(sprintData); // Add to mock array
        loadSprints(); // Reload list to show the new sprint
    }

});