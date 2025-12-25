document.addEventListener('DOMContentLoaded', () => {
    const connectGithubBtn = document.getElementById('connect-github-btn');
    const githubStatus = document.getElementById('github-status');
    const githubConfig = document.getElementById('github-config');
    const repoTableBody = document.querySelector('#repo-table tbody');

    // --- Helper Function to Render ---
    function renderRepos(repos) {
        repoTableBody.innerHTML = ''; 
        if (repos.length === 0) {
            repoTableBody.innerHTML = '<tr><td colspan="4">No repositories found.</td></tr>';
            return;
        }

        repos.forEach(repo => {
            const statusClass = repo.status.toLowerCase();
            const row = `
                <tr>
                    <td><a href="${repo.url}" target="_blank">${repo.name}</a></td>
                    <td>${repo.updated}</td>
                    <td>${repo.owner}</td>
                    <td><span class="status-badge ${statusClass}">${repo.status}</span></td>
                </tr>
            `;
            repoTableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    // --- 1. Load Real Data from Backend ---
    async function loadRepositories() {
        console.log("Fetching repositories...");
        
        try {
            const response = await fetch('/integration/api/repos');
            const data = await response.json();

            if (data.connected) {
                checkIntegrationStatus(true);
                renderRepos(data.repositories);
            } else {
                checkIntegrationStatus(false);
                repoTableBody.innerHTML = '<tr><td colspan="4">Connect to GitHub to see repositories.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching repos:', error);
            repoTableBody.innerHTML = '<tr><td colspan="4">Error loading data.</td></tr>';
        }
    }

    // --- 2. Connect Button Logic ---
    connectGithubBtn.addEventListener('click', () => {
        if (connectGithubBtn.textContent.includes('Disconnect')) {
            window.location.href = '/integration/github/disconnect';
        } else {
            // Redirect to backend to start OAuth
            window.location.href = '/integration/github/connect';
        }
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
            githubStatus.classList.add('disconnected');
            githubStatus.classList.remove('connected');
            githubStatus.querySelector('.status-text').textContent = 'Status: Disconnected';
            connectGithubBtn.textContent = 'Connect to GitHub';
            connectGithubBtn.classList.add('btn-github');
            connectGithubBtn.classList.remove('btn-secondary');
            githubConfig.classList.add('hidden');
        }
    }

    // Initialize
    loadRepositories();
});