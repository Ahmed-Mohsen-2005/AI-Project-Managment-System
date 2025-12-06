// --- MOCK Data Source for Personal/Portfolio Overview ---
// Simulating data received from Resource & Task Services for the current user
const MOCK_PERSONAL_DATA = {
    tasksDueToday: 5,
    personalRiskScore: 65, // AI Overload Risk Score (FR-301)
    myVelocity: 100, // Tasks completed vs planned last sprint
    projectCount: 3,
    
    urgentTasks: [
        { id: 1002, title: 'Fix critical security vulnerability (Backend)', priority: 'P1', link: '/tasks/1002' },
        { id: 405, title: 'Investigate S3 connection timeout (Frontend)', priority: 'P2', link: '/tasks/405' },
        { id: 112, title: 'Finalize Sprint 5 Review (UX)', priority: 'P2', link: '/tasks/112' },
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-summary-btn');
    const summaryPrompt = document.getElementById('summary-prompt');
    const aiOutput = document.getElementById('ai-output');
    const API_URL = '/api/v1/ai/portfolio_summary'; // Endpoint for Portfolio AI (FR-401)

    // --- INITIALIZATION ---
    loadPersonalMetrics();
    renderUrgentTasks(MOCK_PERSONAL_DATA.urgentTasks);
    
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateSummary);
    }
    
    function loadPersonalMetrics() {
        // Loads data into the top metric bar
        document.getElementById('tasks-due-today').textContent = MOCK_PERSONAL_DATA.tasksDueToday;
        document.getElementById('personal-risk-score').textContent = MOCK_PERSONAL_DATA.personalRiskScore + '%';
        document.getElementById('my-velocity').textContent = MOCK_PERSONAL_DATA.myVelocity + '%';
        document.getElementById('project-count').textContent = MOCK_PERSONAL_DATA.projectCount;
        
        // Add visual indicator if personal risk is high
        if (MOCK_PERSONAL_DATA.personalRiskScore > 60) {
            document.getElementById('personal-risk-score').style.color = '#cc6600'; // Amber/Warning
        }
    }
    
    function renderUrgentTasks(tasks) {
        const list = document.getElementById('urgent-tasks-list');
        list.innerHTML = '';
        if (tasks.length === 0) {
            list.innerHTML = '<li><span class="task-text">No urgent tasks currently assigned.</span></li>';
            return;
        }
        
        tasks.forEach(task => {
            // Apply red color if P1
            const priorityClass = task.priority === 'P1' ? 'text-red-600' : '';
            const item = document.createElement('li');
            item.innerHTML = `
                <span class="task-text ${priorityClass}">
                    ${task.priority}: ${task.title}
                </span>
                <a href="${task.link}" class="view-link">View</a>
            `;
            list.appendChild(item);
        });
    }

    // --- AI PORTFOLIO ASSISTANT (FR-401 Simulation) ---
    async function handleGenerateSummary() {
        const promptText = summaryPrompt.value.trim();
        if (!promptText) return;

        // Show loading state
        displayAiOutput('<p><i class="fas fa-spinner fa-spin"></i> Analyzing portfolio risks...</p>', true);
        generateBtn.disabled = true;

        // --- REAL API CALL Placeholder ---
        // In production, this would be a fetch POST to the Flask Controller:
        // fetch(API_URL, { method: 'POST', body: JSON.stringify({ prompt: promptText, user: current_user_id }) })
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate latency

        // Mock AI Response based on the personal/portfolio context
        const summary = `AI Portfolio Insight: The Core Backend Initiative currently shows the highest risk (45% AI Risk Index). Your personal workload is manageable (65% overload risk). Recommended focus for the next 48 hours: Clear P1 tasks from the Backend initiative.`;
        
        displayAiOutput(`<p class="summary-header">AI Portfolio Insight:</p><p>${summary}</p>`, false);
        generateBtn.disabled = false;
    }
    
    function displayAiOutput(html, isLoading) {
        aiOutput.innerHTML = html;
        aiOutput.classList.remove('hidden');
        
        // Use amber for portfolio insights
        aiOutput.style.borderLeftColor = '#cc6600'; 
        
        if (isLoading) {
             aiOutput.classList.add('loading');
        } else {
             aiOutput.classList.remove('loading');
        }
    }
});