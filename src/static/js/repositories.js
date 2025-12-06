document.addEventListener('DOMContentLoaded', () => {
    const connectGithubBtn = document.getElementById('connect-github-btn');
    const githubStatus = document.getElementById('github-status');
    const githubConfig = document.getElementById('github-config');
    const repoTableBody = document.querySelector('#repo-table tbody');
    const copyBtn = document.querySelector('.copy-btn');

    // --- Simulated Data Source (Would come from your Flask API) ---
    const MOCK_REPOS = [
        { name: 'AIPMS-Core-Backend', updated: '1 hour ago', owner: 'Jane Doe', status: 'Active' },
        { name: 'AIPMS-Frontend-UI', updated: '5 hours ago', owner: 'You', status: 'Syncing' },
        { name: 'AI-Prediction-Models', updated: '2 days ago', owner: 'DevOps Team', status: 'Inactive' },
        { name: 'Documentation-Wiki', updated: '1 week ago', owner: 'Alice J.', status: 'Active' },
    ];

    // --- Helper Function ---
    function renderRepos(repos) {
        repoTableBody.innerHTML = ''; // Clear loading message
        repos.forEach(repo => {
            const statusClass = repo.status.toLowerCase().replace(' ', '');
            const row = `
                <tr>
                    <td>${repo.name}</td>
                    <td>${repo.updated}</td>
                    <td>${repo.owner}</td>
                    <td><span class="status-badge ${statusClass}">${repo.status}</span></td>
                </tr>
            `;
            repoTableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    // --- 1. Load Initial Repository Data ---
    async function loadRepositories() {
        console.log("Fetching repository list from /api/v1/integration/repos...");
        
        // --- REAL API CALL (Simulation) ---
        // Replace this setTimeout with a real fetch() call to your Flask Controller:
        // const response = await fetch('/api/v1/integration/repos');
        // const data = await response.json();
        // renderRepos(data.repositories);
        
        // Simulating 1.5s latency:
        setTimeout(() => {
            renderRepos(MOCK_REPOS);
            // After loading, check the current GitHub status (mocked here)
            checkIntegrationStatus(true); // Assuming connection is successful on load
        }, 1500);
    }

    // --- 2. GitHub Connection Logic (OAuth Initiation) ---
    connectGithubBtn.addEventListener('click', () => {
        // --- REAL API CALL ---
        // This button should hit your Flask Integration Controller (e.g., /api/v1/integration/github/connect)
        // The Flask Controller will then handle the OAuth redirect.
        
        console.log("Initiating GitHub OAuth flow...");
        alert("Simulating redirect to GitHub for Authorization. This action must be handled by the backend (Flask Controller) to ensure secure OAuth.");
        
        // In reality, Flask returns a Redirect response (HTTP 302) here.
        // window.location.href = '/api/v1/integration/github/connect';
    });
    
    // --- 3. UI Status Management ---
    function checkIntegrationStatus(isConnected) {
        if (isConnected) {
            githubStatus.classList.remove('disconnected');
            githubStatus.classList.add('connected');
            githubStatus.querySelector('.status-text').textContent = 'Status: Connected';
            connectGithubBtn.textContent = 'Disconnect from GitHub';
            connectGithubBtn.classList.remove('btn-github');
            connectGithubBtn.classList.add('btn-secondary');
            githubConfig.classList.remove('hidden');
        } else {
            // Restore disconnected state
            githubStatus.classList.add('disconnected');
            githubStatus.classList.remove('connected');
            githubStatus.querySelector('.status-text').textContent = 'Status: Disconnected';
            connectGithubBtn.textContent = 'Connect to GitHub';
            connectGithubBtn.classList.add('btn-github');
            connectGithubBtn.classList.remove('btn-secondary');
            githubConfig.classList.add('hidden');
        }
    }
    
    // --- 4. Copy Webhook Button ---
    copyBtn.addEventListener('click', () => {
        const webhookInput = document.querySelector('#github-config input');
        webhookInput.select();
        document.execCommand('copy');
        alert('Webhook URL copied to clipboard!');
    });


    // Start the process
    loadRepositories();
});