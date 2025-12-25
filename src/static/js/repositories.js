document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const connectGithubBtn = document.getElementById('connect-github-btn');
    const githubStatus = document.getElementById('github-status');
    const githubConfig = document.getElementById('github-config');
    const repoTableBody = document.querySelector('#repo-table tbody');
    const copyBtn = document.querySelector('.copy-btn');
    
    // Modal Elements
    const modal = document.getElementById('create-repo-modal');
    const addNewRepoBtn = document.getElementById('add-new-repo-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');
    const confirmCreateBtn = document.getElementById('confirm-create-btn');
    
    // Configuration Checkboxes
    const configCheckboxes = document.querySelectorAll('#github-config input[type="checkbox"]');

    // --- 1. Helper Function to Render Table ---
    function renderRepos(repos) {
        repoTableBody.innerHTML = ''; 
        if (!repos || repos.length === 0) {
            repoTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No repositories found.</td></tr>';
            return;
        }

        repos.forEach(repo => {
            const statusClass = repo.status.toLowerCase();
            const row = `
                <tr>
                    <td>
                        <a href="${repo.url}" target="_blank" style="font-weight: 600; color: #333; text-decoration: none;">
                            ${repo.name} 
                            ${repo.is_private ? '<i class="fas fa-lock" style="font-size: 10px; margin-left: 5px; color: #666;"></i>' : ''}
                        </a>
                    </td>
                    <td>${repo.updated}</td>
                    <td>${repo.owner}</td>
                    <td><span class="status-badge ${statusClass}">${repo.status}</span></td>
                </tr>
            `;
            repoTableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    // --- 2. Load Real Data from Backend ---
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
                repoTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Connect to GitHub to see repositories.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching repos:', error);
            repoTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: red;">Error loading data from server.</td></tr>';
        }
    }

    // --- 3. UI Status Management ---
    function checkIntegrationStatus(isConnected) {
        if (isConnected) {
            githubStatus.classList.remove('disconnected');
            githubStatus.classList.add('connected');
            githubStatus.querySelector('.status-text').innerHTML = '<i class="fas fa-check-circle"></i> Status: Connected';
            
            connectGithubBtn.textContent = 'Disconnect from GitHub';
            connectGithubBtn.classList.remove('btn-github');
            connectGithubBtn.classList.add('btn-secondary');
            
            githubConfig.classList.remove('hidden');
            addNewRepoBtn.disabled = false; // Enable "New Repo" button
        } else {
            githubStatus.classList.add('disconnected');
            githubStatus.classList.remove('connected');
            githubStatus.querySelector('.status-text').innerHTML = 'Status: Disconnected';
            
            connectGithubBtn.textContent = 'Connect to GitHub';
            connectGithubBtn.classList.add('btn-github');
            connectGithubBtn.classList.remove('btn-secondary');
            
            githubConfig.classList.add('hidden');
            addNewRepoBtn.disabled = true; // Disable "New Repo" button if not connected
        }
    }

    // --- 4. Connect/Disconnect Button Logic ---
    connectGithubBtn.addEventListener('click', () => {
        if (connectGithubBtn.textContent.includes('Disconnect')) {
            if(confirm("Are you sure you want to disconnect GitHub?")) {
                window.location.href = '/integration/github/disconnect';
            }
        } else {
            // Redirect to backend to start OAuth
            window.location.href = '/integration/github/connect';
        }
    });

    // --- 5. Copy Webhook URL Logic ---
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const webhookInput = document.querySelector('#github-config input[type="text"]');
            webhookInput.select();
            document.execCommand('copy');
            
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        });
    }

    // --- 6. Modal Logic (Open/Close) ---
    function openModal() {
        modal.classList.remove('hidden');
        document.getElementById('new-repo-name').focus();
    }
    
    function closeModal() {
        modal.classList.add('hidden');
        // Reset form
        document.getElementById('new-repo-name').value = '';
        document.getElementById('new-repo-desc').value = '';
        document.getElementById('new-repo-private').checked = false;
    }

    if (addNewRepoBtn) addNewRepoBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelCreateBtn) cancelCreateBtn.addEventListener('click', closeModal);

    // Close modal if clicking outside content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // --- 7. Create Repository Logic (API Call) ---
    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', async () => {
            const name = document.getElementById('new-repo-name').value;
            const desc = document.getElementById('new-repo-desc').value;
            const isPrivate = document.getElementById('new-repo-private').checked;
            const btnOriginalText = confirmCreateBtn.textContent;

            if (!name) {
                alert('Repository Name is required');
                return;
            }

            // UI Loading State
            confirmCreateBtn.textContent = 'Creating...';
            confirmCreateBtn.disabled = true;

            try {
                const response = await fetch('/integration/api/repos/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        description: desc,
                        is_private: isPrivate
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    closeModal();
                    alert(data.message);
                    loadRepositories(); // Refresh the list to show the new repo
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error(error);
                alert('Failed to connect to server.');
            } finally {
                confirmCreateBtn.textContent = btnOriginalText;
                confirmCreateBtn.disabled = false;
            }
        });
    }

    // --- 8. Save Configuration Settings (Auto-Save) ---
    if (configCheckboxes) {
        configCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', async () => {
                const settings = {
                    notify_pr: configCheckboxes[0].checked,
                    notify_merge: configCheckboxes[1].checked,
                    notify_ci: configCheckboxes[2].checked
                };
                
                try {
                    await fetch('/integration/api/settings/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(settings)
                    });
                    console.log('Settings saved automatically');
                } catch (err) {
                    console.error('Failed to save settings', err);
                }
            });
        });
    }

    // --- Initialize ---
    loadRepositories();
});