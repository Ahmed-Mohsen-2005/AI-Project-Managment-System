document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-summary-btn');
    const summaryPrompt = document.getElementById('summary-prompt');
    const aiOutput = document.getElementById('ai-output');

    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateSummary);
    }

    function handleGenerateSummary() {
        const promptText = summaryPrompt.value.trim();
        if (!promptText) {
            aiOutput.innerHTML = '<p class="text-red-500">Please enter a prompt to generate the summary.</p>';
            aiOutput.classList.remove('hidden');
            return;
        }

        // Show loading state and disable button
        aiOutput.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Analyzing project data...</p>';
        aiOutput.classList.remove('hidden');
        generateBtn.disabled = true;

        console.log(`Sending prompt to AI Reporting Service (FR-401): ${promptText}`);

        // --- Simulated API Call to Flask Backend ---
        // In a real application, this would be a fetch() call to:
        // POST /api/v1/reports/summary (Controller: report_controller.py)
        // Which then calls the AI Planning Service (Model)

        setTimeout(() => {
            // Simulate AI response delay
            const summary = `The AI reports a 7-day velocity of 98%. **CRITICAL BLOCKER:** Task WI-440 (Database Migration) is at high risk due to resource overload, with a projected delay of 3 days. Team Stress Index (FR-503) is 0.75, primarily in the backend team. Recommended action: Reassign WI-440 subtasks to Alice J. (Frontend) for documentation review to free up backend hours.`;

            aiOutput.innerHTML = `
                <p class="summary-header">AI Executive Summary Generated:</p>
                <p>${summary}</p>
                <p class="source-note">Confidence Score: 92% (Risk Model v2.1)</p>
            `;
            generateBtn.disabled = false;
        }, 2500); // 2.5 second simulated latency
    }
});