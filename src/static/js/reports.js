document.addEventListener('DOMContentLoaded', () => {
    const reportTypeSelect = document.getElementById('report-type-select');
    const projectFilter = document.getElementById('project-filter');
    const generateBtn = document.getElementById('generate-report-btn');
    
    // Output areas
    const reportOutputTitle = document.getElementById('report-output-title');
    const chartTitle = document.getElementById('chart-title');
    const summaryOutput = document.getElementById('ai-summary-output');
    const analysisDetails = document.getElementById('analysis-details-list');

    // --- INITIALIZATION ---
    reportTypeSelect.addEventListener('change', updateUILayout);
    generateBtn.addEventListener('click', handleGenerateReport);
    
    // Set initial view state
    updateUILayout(); 

    // --- MOCK DATA STRUCTURES ---
    const MOCK_DATA = {
        'summary': { 
            title: "Executive Summary (AI Generated)",
            chart: "Project Risk/Health Score Over Time",
            ai_text: `AI generated synthesis:\n\n- The project health score is currently 78/100, down 5 points this sprint due to resource contention.\n- Key finding (FR-401): The deployment pipeline task (WI-105) consumed 150% of the estimated time, primarily due to scope creep.\n- Recommendation: Prioritize resource allocation (FR-301) for the next sprint to mitigate a 12% budget overrun forecast.`,
            details: [{ label: 'Health Score', value: '78/100' }, { label: 'Scope Drift', value: '15%' }]
        },
        'velocity': {
            title: "Sprint Velocity History",
            chart: "Completed Points vs. Target Line",
            ai_text: "Historical velocity analysis confirms the team is highly consistent, averaging 95% completion over the last 3 sprints. The current trend suggests the active sprint will complete 5% ahead of schedule.",
            details: [{ label: 'Average Velocity', value: '95 points/sprint' }, { label: 'Worst Sprint (S3)', value: '75 points' }]
        },
        'rca': {
            title: "Root Cause Analysis (RCA) - Sprint 3",
            chart: "Blocker Timeline",
            ai_text: "RCA (FR-402) found that 60% of the Sprint 3 delay was traced back to 'Unclear Requirements' from the Product Owner (measured by task rejections and high comment volume). Corrective action: Implement mandatory requirement sign-off checklist.",
            details: [{ label: 'Primary Cause', value: 'Unclear Requirements (60%)' }, { label: 'Secondary Cause', value: 'External API Delay (20%)' }]
        }
    };
    
    // --- UI/STATE CONTROL ---
    function updateUILayout() {
        const reportType = reportTypeSelect.value;
        const data = MOCK_DATA[reportType];

        // Update titles
        reportOutputTitle.textContent = data.title;
        chartTitle.textContent = data.chart;
        
        // Clear previous content
        summaryOutput.innerHTML = '';
        analysisDetails.innerHTML = '';
        
        // Update Chart Placeholder (Simulated)
        const chartArea = document.getElementById('chart-visualization');
        chartArea.innerHTML = `<img src="https://placehold.co/400x300/e6e9ee/2c3e50?text=${data.chart.replace(/\s/g, '+')}" alt="Chart Placeholder">`;
    }

    // --- GENERATE REPORT (API Simulation) ---
    async function handleGenerateReport() {
        const reportType = reportTypeSelect.value;
        const projectId = projectFilter.value;
        const data = MOCK_DATA[reportType];

        // Show Loading State
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        summaryOutput.innerHTML = '<p class="loading-message">Querying AI Services and historical data...</p>';

        console.log(`[REPORT] Generating ${reportType} report for Project ${projectId}...`);

        // --- REAL API CALL Placeholder (POST /api/v1/reports/generate) ---
        await new Promise(resolve => setTimeout(resolve, 2000)); 

        // --- Render Results ---
        
        // 1. Render Summary Output
        summaryOutput.innerHTML = data.ai_text.replace(/(\b[A-Z][A-Z0-9]+-\d+\b)/g, '<strong class="highlight">$&</strong>'); // Highlight WI/FR IDs

        // 2. Render Analysis Details List
        data.details.forEach(detail => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${detail.label}</strong> <span>${detail.value}</span>`;
            analysisDetails.appendChild(li);
        });

        // Final state
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-microchip"></i> Report Complete';
        setTimeout(() => {
             generateBtn.innerHTML = '<i class="fas fa-microchip"></i> Generate Report';
        }, 3000);
    }
});