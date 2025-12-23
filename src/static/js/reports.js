document.addEventListener('DOMContentLoaded', () => {
    const reportTypeSelect = document.getElementById('report-type-select');
    const sprintFilter = document.getElementById('sprint-filter');
    const generateBtn = document.getElementById('generate-report-btn');
    
    // Output areas
    const reportOutputTitle = document.getElementById('report-output-title');
    const chartTitle = document.getElementById('chart-title');
    const summaryOutput = document.getElementById('ai-summary-output');
    const analysisDetails = document.getElementById('analysis-details-list');

    // API URLs
    const SPRINT_API_URL = '/api/v1/sprints';
    const TASK_API_URL = '/api/v1/tasks';
    const PROJECT_API_URL = '/api/v1/projects';
    const DOCUMENTATION_API_URL = '/api/v1/documentation';

    // Initialize
    loadSprints();
    reportTypeSelect.addEventListener('change', updateUILayout);
    generateBtn.addEventListener('click', handleGenerateReport);
    
    // Set initial view state
    updateUILayout(); 

    // ============================================
    // SIMPLE MARKDOWN PARSER
    // ============================================
    function simpleMarkdown(text) {
        let lines = text.split('\n');
        let html = '';
        let inList = false;
        let inTable = false;
        let tableRows = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Check for table
            if (line.includes('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line);
                continue;
            } else if (inTable) {
                // End of table
                html += parseTable(tableRows);
                inTable = false;
                tableRows = [];
                // Fall through to process current line
            }
            
            if (line.startsWith('# ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<h1>' + line.substring(2) + '</h1>';
            } else if (line.startsWith('## ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<h2>' + line.substring(3) + '</h2>';
            } else if (line.startsWith('### ')) {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<h3>' + line.substring(4) + '</h3>';
            } else if (line.match(/^\* |^- |\d+\. /)) {
                if (!inList) { html += '<ul>'; inList = true; }
                html += '<li>' + line.replace(/^\* |^- |\d+\. /, '') + '</li>';
            } else if (line === '') {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<br>';
            } else {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<p>' + line + '</p>';
            }
        }
        
        if (inList) html += '</ul>';
        if (inTable) html += parseTable(tableRows);
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return html;
    }
    
    function parseTable(rows) {
        if (rows.length < 2) return '';
        
        let html = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        
        // First row is header
        let headerCells = rows[0].split('|').slice(1, -1).map(cell => cell.trim());
        html += '<thead><tr>';
        headerCells.forEach(cell => {
            html += '<th style="padding: 8px; text-align: left; background-color: #f2f2f2;">' + cell + '</th>';
        });
        html += '</tr></thead>';
        
        // Check if second row is separator
        if (rows.length > 1 && rows[1].includes('---')) {
            // Data rows start from index 2
            html += '<tbody>';
            for (let i = 2; i < rows.length; i++) {
                let cells = rows[i].split('|').slice(1, -1).map(cell => cell.trim());
                html += '<tr>';
                cells.forEach(cell => {
                    html += '<td style="padding: 8px;">' + cell + '</td>';
                });
                html += '</tr>';
            }
            html += '</tbody>';
        } else {
            // No separator, treat all as data
            html += '<tbody>';
            for (let i = 1; i < rows.length; i++) {
                let cells = rows[i].split('|').slice(1, -1).map(cell => cell.trim());
                html += '<tr>';
                cells.forEach(cell => {
                    html += '<td style="padding: 8px;">' + cell + '</td>';
                });
                html += '</tr>';
            }
            html += '</tbody>';
        }
        
        html += '</table>';
        return html;
    }

    // ============================================
    // LOAD SPRINTS
    // ============================================
    async function loadSprints() {
        try {
            const res = await fetch(SPRINT_API_URL);
            if (!res.ok) throw new Error('Failed to fetch sprints');
            
            const sprints = await res.json();
            sprintFilter.innerHTML = '<option value="">Select Sprint</option>';
            
            sprints.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.sprint_id;
                opt.textContent = s.name;
                sprintFilter.appendChild(opt);
            });
        } catch (err) {
            console.error('[ERROR] Load sprints failed:', err);
        }
    }
    // --- UI/STATE CONTROL ---
    function updateUILayout() {
        const reportType = reportTypeSelect.value;
        
        const titles = {
            'summary': "Executive Summary (AI Generated)",
            'velocity': "Sprint Velocity History",
            'risk': "Predictive Risk Forecast",
            'rca': "Root Cause Analysis (RCA)"
        };
        
        const chartTitles = {
            'summary': "Project Risk/Health Score Over Time",
            'velocity': "Completed Points vs. Target Line",
            'risk': "Risk Probability Over Time",
            'rca': "Blocker Timeline"
        };

        // Update titles
        reportOutputTitle.textContent = titles[reportType] || "Report";
        chartTitle.textContent = chartTitles[reportType] || "Chart";
        
        // Clear previous content
        summaryOutput.innerHTML = '<p class="loading-message">Select a sprint and click Generate Report to view AI-generated analysis.</p>';
        analysisDetails.innerHTML = '';
        
        // Update Chart Placeholder
        const chartArea = document.getElementById('chart-visualization');
        chartArea.innerHTML = `<img src="https://placehold.co/400x300/e6e9ee/2c3e50?text=${(chartTitles[reportType] || 'Chart').replace(/\s/g, '+')}" alt="Chart Placeholder">`;
    }

    // --- GENERATE REPORT ---
    async function handleGenerateReport() {
        const reportType = reportTypeSelect.value;
        const sprintId = sprintFilter.value;
        
        if (!sprintId) {
            alert('Please select a sprint');
            return;
        }

        // Show Loading State
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        summaryOutput.innerHTML = '<p class="loading-message">Querying AI Services and historical data...</p>';

        console.log(`[REPORT] Generating ${reportType} report for Sprint ${sprintId}...`);

        try {
            // Fetch comprehensive project data
            const [sprintRes, tasksRes, allSprintsRes, projectsRes] = await Promise.all([
                fetch(`${DOCUMENTATION_API_URL}/sprint/${sprintId}`),
                fetch(TASK_API_URL),
                fetch(SPRINT_API_URL),
                fetch(PROJECT_API_URL).catch(() => ({ ok: false, json: () => Promise.resolve([]) }))
            ]);

            if (!sprintRes.ok || !tasksRes.ok || !allSprintsRes.ok) {
                throw new Error('Failed to fetch required project data');
            }

            const sprintData = await sprintRes.json();
            const allTasks = await tasksRes.json();
            const allSprints = await allSprintsRes.json();
            const allProjects = projectsRes.ok ? await projectsRes.json() : [];

            // Build comprehensive context
            const context = {
                currentSprint: sprintData,
                allTasks: allTasks,
                allSprints: allSprints,
                allProjects: allProjects,
                reportType: reportType
            };

            // Enhanced prompts with full context
            const basePrompts = {
                'summary': `Generate an executive summary for Sprint "${sprintData.sprint_info.name}" based on the following comprehensive project data. Include key accomplishments, metrics, recommendations, and insights from the broader project context.`,
                'velocity': `Analyze the sprint velocity history and team performance trends using all available sprint and task data. Provide insights on patterns, improvements, and predictions.`,
                'risk': `Perform a comprehensive predictive risk analysis for Sprint "${sprintData.sprint_info.name}" considering all project sprints, tasks, and historical data. Identify potential issues and mitigation strategies.`,
                'rca': `Conduct a thorough root cause analysis for Sprint "${sprintData.sprint_info.name}" using complete project history, task data, and sprint information. Identify root causes and corrective actions.`
            };

            const enhancedPrompt = `${basePrompts[reportType]}

PROJECT CONTEXT:
${JSON.stringify(context, null, 2)}

Please analyze this data and provide a detailed, insightful report in Markdown format with sections, lists, and tables where appropriate.`;

            // Generate AI report
            const aiRes = await fetch(`${DOCUMENTATION_API_URL}/sprint/${sprintId}/ai-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: enhancedPrompt })
            });

            if (!aiRes.ok) throw new Error('AI generation failed');
            const aiData = await aiRes.json();

            // Render Results
            let summaryHtml = simpleMarkdown(aiData.summary);
            summaryOutput.innerHTML = summaryHtml;

            // Render Analysis Details
            analysisDetails.innerHTML = '';
            const details = [
                { label: 'Sprint', value: sprintData.sprint_info.name },
                { label: 'Completion Rate', value: `${sprintData.metrics.completion_rate}%` },
                { label: 'Completed Tasks', value: sprintData.metrics.completed_tasks },
                { label: 'Total Tasks in Project', value: allTasks.length },
                { label: 'Total Sprints', value: allSprints.length },
                { label: 'Total Projects', value: allProjects.length }
            ];
            
            details.forEach(detail => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${detail.label}</strong> <span>${detail.value}</span>`;
                analysisDetails.appendChild(li);
            });

        } catch (err) {
            console.error('[ERROR] Report generation failed:', err);
            summaryOutput.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
        }

        // Final state
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-microchip"></i> Report Complete';
        setTimeout(() => {
            generateBtn.innerHTML = '<i class="fas fa-microchip"></i> Generate Report';
        }, 3000);
    }
});