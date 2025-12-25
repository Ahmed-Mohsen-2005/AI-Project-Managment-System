document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. API Configuration
    // =========================================================
    const API_BASE_URL = '/api/v1/dashboard';

    // =========================================================
    // 2. Element Mapping & Initialization
    // =========================================================
    
    const selector = document.getElementById('project-selector');
    const simulationBtn = document.getElementById('run-simulation-btn');
    const assignTasksBtn = document.getElementById('assign-tasks-btn');
    const assignModal = document.getElementById('assign-modal');
    const closeAssignModal = document.getElementById('close-assign-modal');
    const cancelAssign = document.getElementById('cancel-assign');
    const confirmAssign = document.getElementById('confirm-assign');
    const taskSelect = document.getElementById('task-select');
    const userSelect = document.getElementById('user-select');

    let burndownChart = null;
    let currentCriticalTasks = [];

    // Initialize
    loadProjects();

    // Event Listeners
    selector.addEventListener('change', () => loadProjectData(selector.value));
    
    if (simulationBtn) simulationBtn.addEventListener('click', runResourceSimulation);
    if (assignTasksBtn) assignTasksBtn.addEventListener('click', openAssignModal);
    
    // Modal Listeners
    if (closeAssignModal) closeAssignModal.addEventListener('click', closeModal);
    if (cancelAssign) cancelAssign.addEventListener('click', closeModal);
    if (confirmAssign) confirmAssign.addEventListener('click', handleAssignTask);
    if (assignModal) {
        assignModal.addEventListener('click', (e) => {
            if (e.target === assignModal) closeModal();
        });
    }

    // =========================================================
    // 3. Logic Functions (Now using STATIC_DATA)
    // =========================================================

    async function loadProjects() {
        console.log("Loading projects from API...");

        try {
            const response = await fetch(`${API_BASE_URL}/projects`);
            if (!response.ok) throw new Error('Failed to load projects');

            const projects = await response.json();

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

            // Load first project by default
            if (projects.length > 0) {
                loadProjectData(projects[0].project_id);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            selector.innerHTML = '<option value="">Error loading projects</option>';
        }
    }

    async function loadProjectData(projectId) {
        if (!projectId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/project/${projectId}`);
            if (!response.ok) throw new Error('Failed to load project data');

            const data = await response.json();

            // --- Update UI ---

            // 1. Header
            document.querySelector('.page-title').innerHTML = `<i class="fas fa-chart-bar"></i> ${data.project.name} Analytics`;

            const statusBadge = document.getElementById('project-status');
            statusBadge.textContent = data.status;
            statusBadge.className = 'status-badge';
            if (data.status === 'COMPLETED') statusBadge.classList.add('status-completed');
            else if (data.status === 'PLANNING') statusBadge.classList.add('status-planning');
            else statusBadge.classList.add('status-active');

            // 2. Metrics
            document.getElementById('current-velocity').textContent = data.stats.velocity || '0%';
            document.getElementById('risk-index').textContent = data.stats.aiRiskIndex || '0';
            document.getElementById('tasks-remaining').textContent = data.stats.tasksRemaining || '0';
            document.getElementById('budget-forecast').textContent = data.stats.budgetForecast || '$0';

            // 3. Store critical tasks for assignment modal
            currentCriticalTasks = data.criticalTasks || [];

            // 4. Widgets
            renderActivityFeed(data.activities || []);

            // 5. Chart
            loadBurndownChart(projectId);
        } catch (error) {
            console.error('Error loading project data:', error);
            alert('Failed to load project data. Please try again.');
        }
    }

    async function loadBurndownChart(projectId) {
        const chartContainer = document.getElementById('burndown-chart');
        const noDataMessage = document.getElementById('chart-no-data');
        const sprintNameEl = document.getElementById('sprint-name');

        try {
            const response = await fetch(`${API_BASE_URL}/project/${projectId}/burndown`);
            if (!response.ok) throw new Error('Failed to load burndown data');

            const data = await response.json();

            if (sprintNameEl) sprintNameEl.textContent = data.sprintName || 'Active Sprint';

            if (!data.labels || data.labels.length === 0) {
                chartContainer.style.display = 'none';
                noDataMessage.style.display = 'flex';
                return;
            }

            chartContainer.style.display = 'block';
            noDataMessage.style.display = 'none';

            renderBurndownChart(data);
        } catch (error) {
            console.error('Error loading burndown chart:', error);
            chartContainer.style.display = 'none';
            noDataMessage.style.display = 'flex';
        }
    }

    function renderBurndownChart(data) {
        const ctx = document.getElementById('burndown-canvas').getContext('2d');

        if (burndownChart) {
            burndownChart.destroy();
        }

        burndownChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Ideal Burndown',
                        data: data.ideal,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Actual Progress',
                        data: data.actual,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.1,
                        spanGaps: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Remaining Tasks' } },
                    x: { title: { display: true, text: 'Sprint Timeline' } }
                }
            }
        });
    }

    // =========================================================
    // 4. Render Helper Functions
    // =========================================================

    function renderAIRecommendations(recommendations) {
        const list = document.getElementById('ai-recommendations');
        list.innerHTML = '';
        if (!recommendations || recommendations.length === 0) {
            list.innerHTML = '<li>No active recommendations.</li>';
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
            list.innerHTML = '<li style="justify-content:center; color:#7f8c8d;">All critical tasks assigned!</li>';
            return;
        }
        list.innerHTML = tasks.map(task => `
            <li>
                <span class="task-priority-${task.priority}">${task.priority}: ${task.title}</span>
                <span class="task-owner">Unassigned</span>
            </li>
        `).join('');
    }

    function renderActivityFeed(activities) {
        const list = document.getElementById('recent-activity');
        list.innerHTML = '';
        activities.forEach(activity => {
            const item = document.createElement('li');
            item.innerHTML = `<small class="activity-time">${activity.time}</small><p class="activity-detail">${activity.detail}</p>`;
            list.appendChild(item);
        });
    }

    function updateStressIndex(index, detail) {
        const stressElement = document.getElementById('stress-index');
        const detailElement = document.getElementById('stress-detail');

        const stressValue = index || 0;
        stressElement.textContent = stressValue.toFixed(2);
        detailElement.textContent = detail || "Analysis pending...";

        stressElement.classList.remove('text-high', 'text-medium', 'text-low');
        if (stressValue > 0.70) stressElement.classList.add('text-high');
        else if (stressValue > 0.40) stressElement.classList.add('text-medium');
        else stressElement.classList.add('text-low');
    }

    // =========================================================
    // 5. Interaction Simulation (Actions)
    // =========================================================

    function runResourceSimulation() {
        const originalText = simulationBtn.innerHTML;
        simulationBtn.textContent = "Running AI Simulation... (2s)";
        simulationBtn.disabled = true;

        setTimeout(() => {
            alert("AI Simulation Complete: Workload re-balanced.\n\nResult: Risk index lowered by 12%.");
            simulationBtn.innerHTML = originalText;
            simulationBtn.disabled = false;
        }, 2000);
    }

    async function openAssignModal() {
        if (currentCriticalTasks.length === 0) {
            alert('No unassigned critical tasks available.');
            return;
        }

        // Populate Tasks
        taskSelect.innerHTML = '<option value="">-- Select a task --</option>';
        currentCriticalTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = `${task.priority}: ${task.title}`;
            taskSelect.appendChild(option);
        });

        // Populate Users from API
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (!response.ok) throw new Error('Failed to load users');

            const users = await response.json();
            userSelect.innerHTML = '<option value="">-- Select a user --</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.user_id;
                option.textContent = user.name;
                userSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading users:', error);
            userSelect.innerHTML = '<option value="">Error loading users</option>';
        }

        assignModal.style.display = 'flex';
    }

    function closeModal() {
        assignModal.style.display = 'none';
        taskSelect.value = '';
        userSelect.value = '';
    }

    async function handleAssignTask() {
        const taskId = taskSelect.value;
        const userId = userSelect.value;

        if (!taskId || !userId) {
            alert('Please select both a task and a user.');
            return;
        }

        const projectId = selector.value;

        try {
            // Call API to assign task
            const response = await fetch(`${API_BASE_URL}/task/${taskId}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId
                })
            });

            if (!response.ok) throw new Error('Failed to assign task');

            const result = await response.json();
            alert(result.message || 'Task successfully assigned!');
            closeModal();

            // Refresh view
            await loadProjectData(projectId);
        } catch (error) {
            console.error('Error assigning task:', error);
            alert('Failed to assign task. Please try again.');
        }
    }

});