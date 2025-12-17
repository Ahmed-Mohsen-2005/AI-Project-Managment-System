document.addEventListener('DOMContentLoaded', () => {

    // --- API Configuration ---
    const API_BASE_URL = '/api/v1/dashboard';

    // --- Element Mapping ---
    const selector = document.getElementById('project-selector');
    const simulationBtn = document.getElementById('run-simulation-btn');

    // --- Initialization ---
    loadProjects();

    // Attach listener to load new data when project selection changes
    selector.addEventListener('change', () => loadProjectData(selector.value));

    // Attach listener for the simulation button
    if (simulationBtn) {
        simulationBtn.addEventListener('click', runResourceSimulation);
    }

    // --- Load Projects for Selector ---
    async function loadProjects() {
        try {
            const response = await fetch(`${API_BASE_URL}/projects`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const projects = await response.json();

            // Populate the project selector
            selector.innerHTML = '';

            if (projects.length === 0) {
                selector.innerHTML = '<option value="">No projects found</option>';
                return;
            }

            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.project_id;
                option.textContent = project.name;
                selector.appendChild(option);
            });

            // Load data for the first project
            if (projects.length > 0) {
                loadProjectData(projects[0].project_id);
            }

        } catch (error) {
            console.error('Error loading projects:', error);
            selector.innerHTML = '<option value="">Error loading projects</option>';
        }
    }

    // --- Data Loading Function ---
    async function loadProjectData(projectId) {
        if (!projectId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/project/${projectId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Update Project Header
            document.querySelector('.page-title').innerHTML = `<i class="fas fa-chart-bar"></i> ${data.project.name} Analytics`;
            document.getElementById('project-status').textContent = data.status;

            // Update Top Metrics
            document.getElementById('current-velocity').textContent = data.stats.velocity;
            document.getElementById('risk-index').textContent = data.stats.aiRiskIndex + '%';
            document.getElementById('tasks-remaining').textContent = data.stats.tasksRemaining;
            document.getElementById('budget-forecast').textContent = data.stats.budgetForecast;

            // Update Widgets
            renderAIRecommendations(data.recommendations);
            renderCriticalTasks(data.criticalTasks);
            renderActivityFeed(data.activities);
            updateStressIndex(data.stressIndex, data.stressDetail);

            console.log(`[DASHBOARD] Loaded data for Project ID: ${projectId}`);

        } catch (error) {
            console.error('Error loading project data:', error);

            // Show error state
            document.getElementById('current-velocity').textContent = '--';
            document.getElementById('risk-index').textContent = '--';
            document.getElementById('tasks-remaining').textContent = '--';
            document.getElementById('budget-forecast').textContent = '--';
        }
    }

    // --- WIDGET RENDERING FUNCTIONS ---
    function renderAIRecommendations(recommendations) {
        const list = document.getElementById('ai-recommendations');
        list.innerHTML = '';

        if (!recommendations || recommendations.length === 0) {
            list.innerHTML = '<li>No immediate AI actions required.</li>';
            return;
        }

        list.innerHTML = recommendations.map(rec => {
            const riskClass = rec.risk === 'high' ? 'status-danger' : rec.risk === 'medium' ? 'status-warning' : 'status-active';
            return `<li class="${riskClass}"><span class="rec-dot"></span> ${rec.text}</li>`;
        }).join('');
    }

    function renderCriticalTasks(tasks) {
        const list = document.getElementById('critical-tasks');
        list.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            list.innerHTML = '<li>No unassigned P1/P2 tasks found.</li>';
            return;
        }

        list.innerHTML = tasks.map(task => `
            <li>
                <span>${task.priority}: ${task.title}</span>
                <span class="task-owner">Unassigned</span>
            </li>
        `).join('');
    }

    function renderActivityFeed(activities) {
        const list = document.getElementById('recent-activity');
        list.innerHTML = '';

        if (!activities || activities.length === 0) {
            list.innerHTML = '<li><p class="activity-detail">No recent activity.</p></li>';
            return;
        }

        activities.forEach(activity => {
            const item = document.createElement('li');
            item.innerHTML = `
                <small class="activity-time">${activity.time}</small>
                <p class="activity-detail">${activity.detail}</p>
            `;
            list.appendChild(item);
        });
    }

    function updateStressIndex(index, detail) {
        const stressElement = document.getElementById('stress-index');
        const detailElement = document.getElementById('stress-detail');

        stressElement.textContent = (index || 0).toFixed(2);
        detailElement.textContent = detail || 'Awaiting analysis...';

        // Visual risk indicator based on index value
        stressElement.classList.remove('text-high', 'text-medium');
        if (index > 0.70) {
            stressElement.classList.add('text-high');
        } else if (index > 0.45) {
            stressElement.classList.add('text-medium');
        }
    }

    // --- SIMULATION LOGIC (FR-507) ---
    async function runResourceSimulation() {
        console.log("[SIMULATION] Running resource optimization 'What If' scenario (FR-507)...");

        const originalText = simulationBtn.innerHTML;
        simulationBtn.textContent = "Running AI Simulation... (3s)";
        simulationBtn.disabled = true;

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 3000));

        alert("AI Simulation Complete: Analysis finished. Check recommendations for suggested actions.");

        simulationBtn.innerHTML = originalText;
        simulationBtn.disabled = false;

        // Reload project data to show updated recommendations
        loadProjectData(selector.value);
    }
});
