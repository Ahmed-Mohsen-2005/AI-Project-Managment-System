// --- MOCK Data Source for Project Analytics (Dynamically loaded based on selector) ---
// Simulates data fetched from Resource, Task, and AI Services for a given project ID.
const PROJECT_DATA = {
    '1': { // Core Backend Initiative
        projectName: 'Core Backend Initiative',
        velocity: '95%', tasksRemaining: 24, aiRiskIndex: 45, budgetForecast: '$10K (9% Over)', status: 'ACTIVE',
        stressIndex: 0.75, stressDetail: 'Backend Team is highly utilized (95% avg.).',
        recommendations: [{ text: 'Execute Swarm Assignment for WI-1002 (Security)', risk: 'high' }, { text: 'Reassign 3 P3 tasks from Charlie W. (95% utilization)', risk: 'medium' }],
        criticalTasks: [{ id: 1002, title: 'Fix critical security vulnerability', priority: 'P1' }, { id: 405, title: 'Investigate S3 connection timeout', priority: 'P2' }],
        activities: [{ time: '5m ago', type: 'Commit', detail: 'Bob S. merged PR #123 (UI Revamp) into main.', link: '/repositories' }],
    },
    '2': { // Frontend UI Revamp
        projectName: 'Frontend UI Revamp',
        velocity: '80%', tasksRemaining: 15, aiRiskIndex: 20, budgetForecast: '$500 (Under Budget)', status: 'ACTIVE',
        stressIndex: 0.40, stressDetail: 'Design team requires new tasks.',
        recommendations: [{ text: 'Initiate task creation using AI Blueprint (FR-101).', risk: 'low' }],
        criticalTasks: [{ id: 201, title: 'UI requires final sign-off', priority: 'P1' }],
        activities: [{ time: '1h ago', type: 'Task', detail: 'Alice J. set WI-200 to In Review.', link: '/tasks/200' }],
    },
    '3': { // AI Model Optimization
        projectName: 'AI Model Optimization',
        velocity: '100%', tasksRemaining: 5, aiRiskIndex: 5, budgetForecast: '$2K (Under Budget)', status: 'PLANNING',
        stressIndex: 0.30, stressDetail: 'Team is currently idle.',
        recommendations: [{ text: 'Launch Sprint 1 for model training.', risk: 'low' }],
        criticalTasks: [],
        activities: [{ time: '1d ago', type: 'Config', detail: 'Project created via AI Blueprint (FR-101).', link: '' }],
    }
};


document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Initialization and Element Mapping ---
    const selector = document.getElementById('project-selector');
    const simulationBtn = document.getElementById('run-simulation-btn');
    
    // Attach listener to load new data when project selection changes
    selector.addEventListener('change', () => loadProjectData(selector.value));

    // Attach listener for the simulation button
    if (simulationBtn) {
        simulationBtn.addEventListener('click', runResourceSimulation);
    }
    
    // Load default project data
    loadProjectData(selector.value);


    // --- 2. Data Loading Function (Controller Orchestration Simulation) ---
    function loadProjectData(projectId) {
        // Retrieve data based on the selected project ID, defaulting if necessary
        const data = PROJECT_DATA[projectId] || PROJECT_DATA['1']; 
        
        // Update Project Header
        document.querySelector('.page-title').innerHTML = `<i class="fas fa-chart-bar"></i> ${data.projectName} Analytics`;
        document.getElementById('project-status').textContent = data.status.toUpperCase();

        // Update Top Metrics
        document.getElementById('current-velocity').textContent = data.velocity;
        document.getElementById('risk-index').textContent = data.aiRiskIndex + '%';
        document.getElementById('tasks-remaining').textContent = data.tasksRemaining;
        document.getElementById('budget-forecast').textContent = data.budgetForecast;
        
        // Update Widgets
        renderAIRecommendations(data.recommendations);
        renderCriticalTasks(data.criticalTasks);
        renderActivityFeed(data.activities);
        updateStressIndex(data.stressIndex, data.stressDetail);
        
        console.log(`Loaded data for Project ID: ${projectId}`);
    }

    // --- WIDGET RENDERING FUNCTIONS ---
    function renderAIRecommendations(recommendations) {
        const list = document.getElementById('ai-recommendations');
        list.innerHTML = '';
        if (recommendations.length === 0) {
            list.innerHTML = '<li>No immediate AI actions required.</li>';
            return;
        }

        list.innerHTML = recommendations.map(rec => {
            // Mapping risk level to CSS classes for visual indicator
            const riskClass = rec.risk === 'high' ? 'status-danger' : rec.risk === 'medium' ? 'status-warning' : 'status-active';
            return `<li class="${riskClass}"><span class="rec-dot">●</span> ${rec.text}</li>`;
        }).join('');
    }

    function renderCriticalTasks(tasks) {
        const list = document.getElementById('critical-tasks');
        list.innerHTML = '';

        if (tasks.length === 0) {
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
        stressElement.textContent = index.toFixed(2);
        detailElement.textContent = detail;

        // Visual risk indicator based on index value
        if (index > 0.70) {
            stressElement.classList.add('text-high');
            stressElement.classList.remove('text-medium');
        } else if (index > 0.45) {
            stressElement.classList.add('text-medium');
            stressElement.classList.remove('text-high');
        } else {
            stressElement.classList.remove('text-high', 'text-medium');
        }
    }


    // --- SIMULATION LOGIC (FR-507: Predictive Time Off/Absence Impact) ---
    async function runResourceSimulation() {
        console.log("[SIMULATION] Running resource optimization 'What If' scenario (FR-507)...");
        
        const originalText = simulationBtn.innerHTML;
        simulationBtn.textContent = "Running AI Simulation... (3s)";
        simulationBtn.disabled = true;
        
        // This simulates a POST request to the AI Planning Engine (Model)
        // fetch('/api/v1/ai/simulate/resources', { method: 'POST', body: JSON.stringify({ projectId: selector.value, resourceId: 'U-456' }) })
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        alert("AI Simulation Complete: Proposed task reassignment reduces project delay from 3 days to 1 day.");
        
        simulationBtn.innerHTML = originalText;
        simulationBtn.disabled = false;
        
        // After simulation, mock an updated result showing the effect
        const currentProject = selector.value;
        if (PROJECT_DATA[currentProject]) {
            const newRec = { text: 'SIMULATION RESULT: Reassign 3 P3 tasks to Bob S. to mitigate delay.', risk: 'low' };
            PROJECT_DATA[currentProject].recommendations.unshift(newRec); // Add new result to top

            loadProjectData(currentProject); // Re-render the dashboard to show the new recommendation
        }
    }
});