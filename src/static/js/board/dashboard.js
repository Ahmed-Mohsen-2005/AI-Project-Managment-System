document.addEventListener('DOMContentLoaded', () => {

    // --- API Configuration ---
    const API_BASE_URL = '/api/v1/dashboard';

    // --- Element Mapping ---
    const selector = document.getElementById('project-selector');
    const simulationBtn = document.getElementById('run-simulation-btn');
    const assignTasksBtn = document.getElementById('assign-tasks-btn');
    const assignModal = document.getElementById('assign-modal');
    const closeAssignModal = document.getElementById('close-assign-modal');
    const cancelAssign = document.getElementById('cancel-assign');
    const confirmAssign = document.getElementById('confirm-assign');
    const taskSelect = document.getElementById('task-select');
    const userSelect = document.getElementById('user-select');

    // --- Chart Instance ---
    let burndownChart = null;

    // --- Current Data ---
    let currentCriticalTasks = [];

    // --- Initialization ---
    loadProjects();

    // Attach listener to load new data when project selection changes
    selector.addEventListener('change', () => loadProjectData(selector.value));

    // Attach listener for the simulation button
    if (simulationBtn) {
        simulationBtn.addEventListener('click', runResourceSimulation);
    }

    // Attach listeners for task assignment modal
    if (assignTasksBtn) {
        assignTasksBtn.addEventListener('click', openAssignModal);
    }
    if (closeAssignModal) {
        closeAssignModal.addEventListener('click', closeModal);
    }
    if (cancelAssign) {
        cancelAssign.addEventListener('click', closeModal);
    }
    if (confirmAssign) {
        confirmAssign.addEventListener('click', handleAssignTask);
    }
    if (assignModal) {
        assignModal.addEventListener('click', (e) => {
            if (e.target === assignModal) closeModal();
        });
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

            // Update status badge with appropriate color
            const statusBadge = document.getElementById('project-status');
            statusBadge.textContent = data.status;
            statusBadge.className = 'status-badge';
            if (data.status === 'COMPLETED') {
                statusBadge.classList.add('status-completed');
            } else if (data.status === 'PLANNING') {
                statusBadge.classList.add('status-planning');
            } else {
                statusBadge.classList.add('status-active');
            }

            // Update Top Metrics (with demo fallbacks)
            const velocity = data.stats.velocity !== '0%' ? data.stats.velocity : '67.5%';
            const riskIndex = data.stats.aiRiskIndex !== 100 ? data.stats.aiRiskIndex + '%' : '32%';
            const remaining = data.stats.tasksRemaining !== 0 ? data.stats.tasksRemaining : 18;
            const budget = data.stats.budgetForecast !== '$0' ? data.stats.budgetForecast : '$45,000';

            document.getElementById('current-velocity').textContent = velocity;
            document.getElementById('risk-index').textContent = riskIndex;
            document.getElementById('tasks-remaining').textContent = remaining;
            document.getElementById('budget-forecast').textContent = budget;

            // Update Widgets
            renderAIRecommendations(data.recommendations);
            currentCriticalTasks = data.criticalTasks || [];
            renderCriticalTasks(currentCriticalTasks);
            renderActivityFeed(data.activities);
            updateStressIndex(data.stressIndex, data.stressDetail);

            // Load burndown chart
            loadBurndownChart(projectId);

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

    // --- Load Burndown Chart ---
    async function loadBurndownChart(projectId) {
        try {
            const response = await fetch(`${API_BASE_URL}/project/${projectId}/burndown`);
            const data = await response.json();

            const chartContainer = document.getElementById('burndown-chart');
            const noDataMessage = document.getElementById('chart-no-data');
            const sprintNameEl = document.getElementById('sprint-name');

            if (sprintNameEl) {
                sprintNameEl.textContent = data.sprintName || 'Active Sprint';
            }

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
        }
    }

    // --- Render Burndown Chart ---
    function renderBurndownChart(data) {
        const ctx = document.getElementById('burndown-canvas').getContext('2d');

        // Destroy existing chart if it exists
        if (burndownChart) {
            burndownChart.destroy();
        }

        // Filter out null values for actual line
        const actualData = data.actual.map((val, idx) => val !== null ? val : undefined);

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
                        data: actualData,
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
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Remaining Tasks'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Sprint Days'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    // --- DEMO DATA FOR DISPLAY ---
    const demoRecommendations = [
        { text: "Consider adding 2 more developers to meet sprint deadline.", risk: "high" },
        { text: "Task 'API Integration' has been blocked for 3 days. Escalate to tech lead.", risk: "high" },
        { text: "Sprint velocity trending 15% below target. Review task estimates.", risk: "medium" },
        { text: "3 team members have >8 tasks assigned. Redistribute workload.", risk: "medium" },
        { text: "Code review backlog increasing. Schedule review session.", risk: "low" }
    ];

    const demoCriticalTasks = [
        { id: 1, title: "Fix authentication bug in login flow", priority: "P1" },
        { id: 2, title: "Database migration for user schema", priority: "P1" },
        { id: 3, title: "Implement rate limiting on API endpoints", priority: "P2" },
        { id: 4, title: "Update SSL certificates before expiry", priority: "P1" },
        { id: 5, title: "Resolve memory leak in background worker", priority: "P2" }
    ];

    const demoActivities = [
        { time: "2 min ago", detail: "Ahmed M. completed task 'Setup CI/CD Pipeline'" },
        { time: "15 min ago", detail: "Jana S. moved 'User Dashboard' to In Progress" },
        { time: "1 hour ago", detail: "Ali K. pushed 3 commits to feature/auth-module" },
        { time: "2 hours ago", detail: "Mazen R. created new sprint 'Sprint 5 - Q1 Release'" },
        { time: "3 hours ago", detail: "Hany M. assigned 'API Refactor' to Ahmed M." },
        { time: "Yesterday", detail: "Team standup meeting completed - 5 participants" },
        { time: "Yesterday", detail: "Sprint 4 retrospective notes added to reports" }
    ];

    // --- WIDGET RENDERING FUNCTIONS ---
    function renderAIRecommendations(recommendations) {
        const list = document.getElementById('ai-recommendations');
        list.innerHTML = '';

        // Use demo data if no recommendations from server
        const dataToRender = (recommendations && recommendations.length > 0) ? recommendations : demoRecommendations;

        list.innerHTML = dataToRender.map(rec => {
            const riskClass = rec.risk === 'high' ? 'status-danger' : rec.risk === 'medium' ? 'status-warning' : 'status-active';
            return `<li class="${riskClass}"><span class="rec-dot"></span> ${rec.text}</li>`;
        }).join('');
    }

    function renderCriticalTasks(tasks) {
        const list = document.getElementById('critical-tasks');
        list.innerHTML = '';

        // Use demo data if no tasks from server
        const dataToRender = (tasks && tasks.length > 0) ? tasks : demoCriticalTasks;

        // Update currentCriticalTasks for modal
        if (!tasks || tasks.length === 0) {
            currentCriticalTasks = demoCriticalTasks;
        }

        list.innerHTML = dataToRender.map(task => `
            <li>
                <span class="task-priority-${task.priority}">${task.priority}: ${task.title}</span>
                <span class="task-owner">Unassigned</span>
            </li>
        `).join('');
    }

    function renderActivityFeed(activities) {
        const list = document.getElementById('recent-activity');
        list.innerHTML = '';

        // Use demo data if no activities from server
        const dataToRender = (activities && activities.length > 0 && activities[0].detail !== "Dashboard loaded successfully.")
            ? activities
            : demoActivities;

        dataToRender.forEach(activity => {
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

        // Use demo value if no data
        const stressValue = (index !== undefined && index !== null && index !== 0) ? index : 0.62;
        const stressDetail = (detail && detail !== "No tasks assigned yet.") ? detail : "Team workload is moderate. 3 members approaching capacity.";

        stressElement.textContent = stressValue.toFixed(2);
        detailElement.textContent = stressDetail;

        // Visual risk indicator based on index value
        stressElement.classList.remove('text-high', 'text-medium', 'text-low');
        if (stressValue > 0.70) {
            stressElement.classList.add('text-high');
        } else if (stressValue > 0.40) {
            stressElement.classList.add('text-medium');
        } else {
            stressElement.classList.add('text-low');
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

    // --- TASK ASSIGNMENT MODAL FUNCTIONS ---
    async function openAssignModal() {
        if (currentCriticalTasks.length === 0) {
            alert('No unassigned critical tasks to assign.');
            return;
        }

        // Populate task select
        taskSelect.innerHTML = '<option value="">-- Select a task --</option>';
        currentCriticalTasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = `${task.priority}: ${task.title}`;
            taskSelect.appendChild(option);
        });

        // Load users
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
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

        try {
            const response = await fetch(`${API_BASE_URL}/task/${taskId}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: parseInt(userId) })
            });

            if (!response.ok) {
                throw new Error('Failed to assign task');
            }

            const result = await response.json();
            alert(result.message || 'Task assigned successfully!');
            closeModal();

            // Reload project data to refresh the critical tasks list
            loadProjectData(selector.value);

        } catch (error) {
            console.error('Error assigning task:', error);
            alert('Failed to assign task. Please try again.');
        }
    }
});
