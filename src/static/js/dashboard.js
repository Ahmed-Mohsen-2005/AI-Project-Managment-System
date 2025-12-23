document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. STATIC MOCK DATA (Simulating Database/API)
    // =========================================================
    const STATIC_DATA = {
        users: [
            { user_id: 101, name: "Ahmed Mahfouz" },
            { user_id: 102, name: "Sarah Connor" },
            { user_id: 103, name: "Ali Hassan" },
            { user_id: 104, name: "Mazen R." }
        ],
        projects: [
            { project_id: "p-001", name: "AIPMS - Core Platform" },
            { project_id: "p-002", name: "Website Redesign 2025" },
            { project_id: "p-003", name: "Mobile App Integration" }
        ],
        // Data for each specific project
        details: {
            "p-001": {
                status: "ACTIVE",
                sprintName: "Sprint 4 - AI Modules",
                stats: {
                    velocity: "72.5%",
                    aiRiskIndex: 65,
                    tasksRemaining: 24,
                    budgetForecast: "$12,450"
                },
                recommendations: [
                    { text: "High complexity detected in 'Algorithm Optimization'. Assign senior dev.", risk: "high" },
                    { text: "Sprint velocity is 10% lower than average due to testing bottlenecks.", risk: "medium" },
                    { text: "Review pending for 3 days on 'User Auth'.", risk: "low" }
                ],
                criticalTasks: [
                    { id: 101, title: "Fix Memory Leak in Docker Container", priority: "P1" },
                    { id: 102, title: "Refactor API Middleware", priority: "P1" },
                    { id: 103, title: "Update Python Dependencies", priority: "P2" }
                ],
                activities: [
                    { time: "10 min ago", detail: "Ahmed M. pushed to 'feature/ai-logic'" },
                    { time: "2 hours ago", detail: "System flagged potential delay in Sprint 4" },
                    { time: "Yesterday", detail: "Code Review completed for Module A" }
                ],
                stressIndex: 0.78,
                stressDetail: "High workload detected. 2 members are over-allocated.",
                burndown: {
                    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
                    ideal: [100, 85, 70, 55, 40, 25, 10],
                    actual: [100, 95, 88, 75, 72, null, null] // Null simulates future days
                }
            },
            "p-002": {
                status: "PLANNING",
                sprintName: "Backlog Refinement",
                stats: {
                    velocity: "0%",
                    aiRiskIndex: 12,
                    tasksRemaining: 45,
                    budgetForecast: "$5,000"
                },
                recommendations: [
                    { text: "Define clear acceptance criteria for UI stories.", risk: "medium" },
                    { text: "Budget estimate missing for Frontend implementation.", risk: "low" }
                ],
                criticalTasks: [
                    { id: 201, title: "Approve Wireframes", priority: "P1" },
                    { id: 202, title: "Select Color Palette", priority: "P2" }
                ],
                activities: [
                    { time: "1 day ago", detail: "Project created by Admin" },
                    { time: "2 days ago", detail: "Initial budget approved" }
                ],
                stressIndex: 0.20,
                stressDetail: "Team is in planning phase. Low stress.",
                burndown: {
                    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                    ideal: [40, 30, 20, 10],
                    actual: [40, 38, null, null]
                }
            },
            "p-003": {
                status: "COMPLETED",
                sprintName: "Final Release",
                stats: {
                    velocity: "98%",
                    aiRiskIndex: 5,
                    tasksRemaining: 0,
                    budgetForecast: "$0"
                },
                recommendations: [
                    { text: "Project completed successfully. Archive repository.", risk: "low" }
                ],
                criticalTasks: [], // Empty to test empty state
                activities: [
                    { time: "1 week ago", detail: "Final deployment to production" },
                    { time: "1 week ago", detail: "Client sign-off received" }
                ],
                stressIndex: 0.05,
                stressDetail: "Project finished. No active workload.",
                burndown: {
                    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
                    ideal: [50, 40, 30, 20, 10],
                    actual: [50, 35, 25, 15, 0]
                }
            }
        }
    };

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

    function loadProjects() {
        console.log("Loading static projects...");
        
        // Populate selector from static data
        selector.innerHTML = '';
        const projects = STATIC_DATA.projects;

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
    }

    function loadProjectData(projectId) {
        if (!projectId) return;

        // Simulate network delay for realism (optional)
        // setTimeout(() => { ... }, 200);

        const projectMeta = STATIC_DATA.projects.find(p => p.project_id === projectId);
        const data = STATIC_DATA.details[projectId];

        if (!data || !projectMeta) {
            console.error("No static data found for ID:", projectId);
            return;
        }

        // --- Update UI ---

        // 1. Header
        document.querySelector('.page-title').innerHTML = `<i class="fas fa-chart-bar"></i> ${projectMeta.name} Analytics`;
        
        const statusBadge = document.getElementById('project-status');
        statusBadge.textContent = data.status;
        statusBadge.className = 'status-badge';
        if (data.status === 'COMPLETED') statusBadge.classList.add('status-completed');
        else if (data.status === 'PLANNING') statusBadge.classList.add('status-planning');
        else statusBadge.classList.add('status-active');

        // 2. Metrics
        document.getElementById('current-velocity').textContent = data.stats.velocity;
        document.getElementById('risk-index').textContent = data.stats.aiRiskIndex + '%';
        document.getElementById('tasks-remaining').textContent = data.stats.tasksRemaining;
        document.getElementById('budget-forecast').textContent = data.stats.budgetForecast;

        // 3. Widgets
        renderAIRecommendations(data.recommendations);
        currentCriticalTasks = data.criticalTasks || [];
        renderCriticalTasks(currentCriticalTasks);
        renderActivityFeed(data.activities);
        updateStressIndex(data.stressIndex, data.stressDetail);

        // 4. Chart
        loadBurndownChart(projectId);
    }

    function loadBurndownChart(projectId) {
        const data = STATIC_DATA.details[projectId]?.burndown;
        const sprintName = STATIC_DATA.details[projectId]?.sprintName;

        const chartContainer = document.getElementById('burndown-chart');
        const noDataMessage = document.getElementById('chart-no-data');
        const sprintNameEl = document.getElementById('sprint-name');

        if (sprintNameEl) sprintNameEl.textContent = sprintName || 'Active Sprint';

        if (!data || !data.labels) {
            chartContainer.style.display = 'none';
            noDataMessage.style.display = 'flex';
            return;
        }

        chartContainer.style.display = 'block';
        noDataMessage.style.display = 'none';

        renderBurndownChart(data);
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

    function openAssignModal() {
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

        // Populate Users (Static)
        userSelect.innerHTML = '<option value="">-- Select a user --</option>';
        STATIC_DATA.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.user_id;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });

        assignModal.style.display = 'flex';
    }

    function closeModal() {
        assignModal.style.display = 'none';
        taskSelect.value = '';
        userSelect.value = '';
    }

    function handleAssignTask() {
        const taskId = taskSelect.value;
        const userId = userSelect.value;

        if (!taskId || !userId) {
            alert('Please select both a task and a user.');
            return;
        }

        // Find the user name for the alert
        const user = STATIC_DATA.users.find(u => u.user_id == userId);
        
        // Remove the task from the static data array to simulate assignment
        const projectId = selector.value;
        if(STATIC_DATA.details[projectId]) {
            STATIC_DATA.details[projectId].criticalTasks = STATIC_DATA.details[projectId].criticalTasks.filter(t => t.id != taskId);
        }

        alert(`Task successfully assigned to ${user.name}!`);
        closeModal();

        // Refresh view
        loadProjectData(projectId);
    }
});