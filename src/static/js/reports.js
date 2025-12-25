document.addEventListener('DOMContentLoaded', () => {
    const reportTypeSelect = document.getElementById('report-type-select');
    const projectFilter = document.getElementById('project-filter');  // CHANGED from sprint-filter
    const generateBtn = document.getElementById('generate-report-btn');
    
    // Output areas
    const reportOutputTitle = document.getElementById('report-output-title');
    // const chartTitle = document.getElementById('chart-title');
    const summaryOutput = document.getElementById('ai-summary-output');
    const analysisDetails = document.getElementById('analysis-details-list');

    // API URLs
    const PROJECT_API_URL = '/api/v1/projects';
    const DOCUMENTATION_API_URL = '/api/v1/documentation';
    // Inside your DOMContentLoaded listener
    const exportBtn = document.getElementById('export-report-btn');

    exportBtn.addEventListener('click', async () => {
            const projectId = projectFilter.value;
            const reportTypeLabel = reportTypeSelect.options[reportTypeSelect.selectedIndex].text;
            const aiContent = summaryOutput.innerHTML;

            // Validation: Ensure a report exists before exporting
            if (!projectId || aiContent.includes('loading-message')) {
                alert('Please generate a report first before exporting.');
                return;
            }

            // Visual feedback
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';

            try {
                const response = await fetch(`/api/v1/documentation/project/${projectId}/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        content: aiContent,
                        report_type: reportTypeLabel 
                    })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Project_Report_${projectId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
                    alert('Server error during PDF generation.');
                }
            } catch (err) {
                console.error('Export failed:', err);
                alert('Connection error. Could not export PDF.');
            } finally {
                exportBtn.disabled = false;
                exportBtn.innerHTML = '<i class="fas fa-download"></i> Export PDF';
            }
        });

    // Initialize
    loadProjects();  // CHANGED from loadSprints()
    reportTypeSelect.addEventListener('change', updateUILayout);
    generateBtn.addEventListener('click', handleGenerateReport);
    
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
            
            if (line.includes('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line);
                continue;
            } else if (inTable) {
                html += parseTable(tableRows);
                inTable = false;
                tableRows = [];
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
        
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return html;
    }
    
    function parseTable(rows) {
        if (rows.length < 2) return '';
        
        let html = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 15px 0;">';
        
        let headerCells = rows[0].split('|').slice(1, -1).map(cell => cell.trim());
        html += '<thead><tr>';
        headerCells.forEach(cell => {
            html += '<th style="padding: 10px; text-align: left; background-color: #f3f4f6; border: 1px solid #e5e7eb;">' + cell + '</th>';
        });
        html += '</tr></thead>';
        
        if (rows.length > 1 && rows[1].includes('---')) {
            html += '<tbody>';
            for (let i = 2; i < rows.length; i++) {
                let cells = rows[i].split('|').slice(1, -1).map(cell => cell.trim());
                html += '<tr>';
                cells.forEach(cell => {
                    html += '<td style="padding: 10px; border: 1px solid #e5e7eb;">' + cell + '</td>';
                });
                html += '</tr>';
            }
            html += '</tbody>';
        }
        
        html += '</table>';
        return html;
    }

    // ============================================
    // LOAD PROJECTS (CHANGED from loadSprints)
    // ============================================
    async function loadProjects() {
        try {
            const res = await fetch(PROJECT_API_URL);
            if (!res.ok) throw new Error('Failed to fetch projects');
            
            const projects = await res.json();
            projectFilter.innerHTML = '<option value="">Select Project</option>';
            
            projects.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.project_id;
                opt.textContent = p.name || `Project ${p.project_id}`;
                projectFilter.appendChild(opt);
            });
            
            console.log(`✅ Loaded ${projects.length} projects`);
        } catch (err) {
            console.error('[ERROR] Load projects failed:', err);
            projectFilter.innerHTML = '<option value="">Failed to load projects</option>';
        }
    }

    function updateUILayout() {
        const reportType = reportTypeSelect.value;
        
        const titles = {
            'summary': "Executive Summary (AI Generated)",
            'velocity': "Sprint Velocity History",
            'risk': "Predictive Risk Forecast",
            'rca': "Root Cause Analysis (RCA)"
        };
        
        // const chartTitles = {
        //     'summary': "Project Health Score Over Time",
        //     'velocity': "Completed Points vs. Target Line",
        //     'risk': "Risk Probability Over Time",
        //     'rca': "Blocker Timeline"
        // };

        reportOutputTitle.textContent = titles[reportType] || "Report";
        chartTitle.textContent = chartTitles[reportType] || "Chart";
        
        summaryOutput.innerHTML = '<p class="loading-message">Select a project and click Generate Report to view AI-generated analysis.</p>';
        analysisDetails.innerHTML = '';
        
        // const chartArea = document.getElementById('chart-visualization');
        // chartArea.innerHTML = `<img src="https://placehold.co/400x300/e6e9ee/2c3e50?text=${(chartTitles[reportType] || 'Chart').replace(/\s/g, '+')}" alt="Chart Placeholder">`;
    }

    // ============================================
    // GENERATE REPORT (UPDATED for projects)
    // ============================================
    async function handleGenerateReport() {
        const reportType = reportTypeSelect.value;
        const projectId = projectFilter.value;  // CHANGED from sprintId
        
        if (!projectId) {
            alert('Please select a project');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        summaryOutput.innerHTML = '<p class="loading-message"><i class="fas fa-robot"></i> Querying AI with project data, notes, and historical context...</p>';

        console.log(`[REPORT] Generating ${reportType} report for Project ${projectId}...`);

        try {
            // Fetch comprehensive project data with notes
            const projectRes = await fetch(`${DOCUMENTATION_API_URL}/project/${projectId}`);

            if (!projectRes.ok) {
                throw new Error('Failed to fetch project data');
            }

            const projectData = await projectRes.json();
            console.log('✅ Project data loaded:', projectData);

            // Build enhanced prompt with notes
            const basePrompts = {
                'summary': `Generate an executive summary for "${projectData.project_info.name}" based on comprehensive project data including team notes and insights.`,
                'velocity': `Analyze the sprint velocity history and team performance trends for "${projectData.project_info.name}" using all available data and team notes.`,
                'risk': `Perform a comprehensive predictive risk analysis for "${projectData.project_info.name}" considering project history, blocked tasks, and team notes about challenges.`,
                'rca': `Conduct a thorough root cause analysis for "${projectData.project_info.name}" using complete project history, task data, and team notes about issues and blockers.`
            };

            const enhancedPrompt = `${basePrompts[reportType]}

PROJECT CONTEXT:
${JSON.stringify(projectData, null, 2)}

The data includes:
- ${projectData.overall_metrics.total_sprints} sprints
- ${projectData.overall_metrics.total_tasks} tasks
- ${projectData.notes.length} team notes and insights
- Sprint performance history
- Blocked tasks and challenges

Please analyze this comprehensive data and provide a detailed, insightful report in Markdown format with sections, lists, and tables where appropriate. Pay special attention to the team notes as they contain valuable context about challenges, decisions, and insights.`;

            // Generate AI report
            const aiRes = await fetch(`${DOCUMENTATION_API_URL}/project/${projectId}/ai-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: enhancedPrompt })
            });

            if (!aiRes.ok) throw new Error('AI generation failed');
            const aiData = await aiRes.json();

            // Render Results with Markdown
            let summaryHtml = simpleMarkdown(aiData.summary);
            summaryOutput.innerHTML = summaryHtml;

            // Render Analysis Details
            analysisDetails.innerHTML = '';
            const details = [
                { label: 'Project', value: projectData.project_info.name },
                { label: 'Total Sprints', value: projectData.overall_metrics.total_sprints },
                { label: 'Overall Completion Rate', value: `${projectData.overall_metrics.overall_completion_rate}%` },
                { label: 'Total Tasks', value: projectData.overall_metrics.total_tasks },
                { label: 'Completed Tasks', value: projectData.overall_metrics.completed_tasks },
                { label: 'Blocked Tasks', value: projectData.overall_metrics.blocked_tasks },
                { label: 'Average Velocity', value: projectData.overall_metrics.average_sprint_velocity },
                { label: 'Total Notes', value: projectData.notes.length },
                { label: 'Completed Hours', value: `${projectData.overall_metrics.completed_hours}h` }
            ];
            
            details.forEach(detail => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${detail.label}:</strong> <span>${detail.value}</span>`;
                analysisDetails.appendChild(li);
            });

            console.log('✅ Report generated successfully');

        } catch (err) {
            console.error('[ERROR] Report generation failed:', err);
            summaryOutput.innerHTML = `<p style="color: #ef4444;">❌ Error: ${err.message}</p>`;
        }

        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-check"></i> Report Complete';
        setTimeout(() => {
            generateBtn.innerHTM = '<i class="fas fa-microchip"></i> Generate Report';
        }, 3000);
    }
});