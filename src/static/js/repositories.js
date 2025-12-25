document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const connectGithubBtn = document.getElementById('connect-github-btn');
    const githubStatus = document.getElementById('github-status');
    const githubConfig = document.getElementById('github-config');
    const repoTableBody = document.querySelector('#repo-table tbody');
    const copyBtn = document.querySelector('.copy-btn');
    
    // Create Repo Modal Elements
    const createModal = document.getElementById('create-repo-modal');
    const addNewRepoBtn = document.getElementById('add-new-repo-btn');
    const closeCreateBtn = document.getElementById('close-modal-btn');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');
    const confirmCreateBtn = document.getElementById('confirm-create-btn');

    // ✅ Link Project Modal Elements
    const linkModal = document.getElementById('link-project-modal');
    const closeLinkBtn = document.getElementById('close-link-modal-btn');
    const confirmLinkBtn = document.getElementById('confirm-link-btn');
    const cancelLinkBtn = document.getElementById('cancel-link-btn');
    const projectSelect = document.getElementById('project-select-dropdown');
    
    // Configuration Checkboxes
    const configCheckboxes = document.querySelectorAll('#github-config input[type="checkbox"]');

    // --- 1. Helper Function to Render Table ---
    function renderRepos(repos) {
        repoTableBody.innerHTML = ''; 
        if (!repos || repos.length === 0) {
            repoTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No repositories found.</td></tr>';
            return;
        }

        repos.forEach(repo => {
            const statusClass = repo.status.toLowerCase();
            
            // ✅ LINKING LOGIC
            let projectHtml = '';
            
            if (repo.linked_project) {
                // Already Linked -> Show Badge
                projectHtml = `
                    <a href="/projects/${repo.linked_project.id}/dashboard" class="project-link-badge">
                        <i class="fas fa-rocket"></i> ${repo.linked_project.name}
                    </a>
                `;
            } else {
                // Not Linked -> Show Link Button
                // We use 'onclick' to trigger the global function defined below
                projectHtml = `
                    <button class="btn-link-repo" onclick="openLinkModal('${repo.full_name}', '${repo.name}')">
                        <i class="fas fa-link"></i> Link
                    </button>
                `;
            }

            const row = `
                <tr>
                    <td>
                        <a href="${repo.url}" target="_blank" style="font-weight: 600; color: var(--color-text-main); text-decoration: none;">
                            ${repo.name} 
                            ${repo.is_private ? '<i class="fas fa-lock" style="font-size: 10px; margin-left: 5px; color: var(--color-text-secondary);"></i>' : ''}
                        </a>
                    </td>
                    <td>${repo.updated}</td>
                    <td>${repo.owner}</td>
                    <td><span class="status-badge ${statusClass}">${repo.status}</span></td>
                    <td>${projectHtml}</td> </tr>
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
                repoTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Connect to GitHub to see repositories.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching repos:', error);
            repoTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">Error loading data from server.</td></tr>';
        }
    }

    // --- 3. GLOBAL: Open Link Modal Logic ---
    // Attached to window so the HTML onclick="" can find it
    window.openLinkModal = function(fullRepoName, shortName) {
        // 1. Set the hidden values
        document.getElementById('selected-repo-name').textContent = shortName;
        document.getElementById('selected-repo-full-name').value = fullRepoName;
        
        // 2. Show Modal
        linkModal.classList.remove('hidden');
        
        // 3. Fetch Projects to populate dropdown
        projectSelect.innerHTML = '<option>Loading projects...</option>';
        
        // ✅ CRITICAL FIX: Updated URL to match the Integration Controller
        fetch('/integration/api/projects/all') 
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch projects");
                return res.json();
            })
            .then(data => {
                projectSelect.innerHTML = '<option value="">-- Choose a Project --</option>';
                if (data.projects && data.projects.length > 0) {
                    data.projects.forEach(p => {
                        projectSelect.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.name}</option>`);
                    });
                } else {
                    projectSelect.innerHTML = '<option value="">No projects created yet</option>';
                }
            })
            .catch(err => {
                console.error(err);
                projectSelect.innerHTML = '<option value="">Error loading projects</option>';
            });
    };

    // --- 4. Confirm Linking Logic ---
    if (confirmLinkBtn) {
        confirmLinkBtn.addEventListener('click', async () => {
            const repoName = document.getElementById('selected-repo-full-name').value;
            const projectId = projectSelect.value;
            const btnOriginalText = confirmLinkBtn.textContent;

            if (!projectId) {
                alert("Please select a project.");
                return;
            }

            confirmLinkBtn.textContent = "Linking...";
            confirmLinkBtn.disabled = true;

            try {
                // ✅ Call the Link API
                const response = await fetch('/integration/api/repos/link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ repo_name: repoName, project_id: projectId })
                });
                const result = await response.json();
                
                if (result.success) {
                    linkModal.classList.add('hidden');
                    loadRepositories(); // Refresh table to show the new Badge
                    alert(result.message);
                } else {
                    alert(result.message);
                }
            } catch (e) {
                console.error(e);
                alert("Error linking project.");
            } finally {
                confirmLinkBtn.textContent = btnOriginalText;
                confirmLinkBtn.disabled = false;
            }
        });
    }

    // --- 5. Modal Close Handlers ---
    // Create Modal
    if (addNewRepoBtn) addNewRepoBtn.addEventListener('click', () => {
        createModal.classList.remove('hidden');
        document.getElementById('new-repo-name').focus();
    });
    if (closeCreateBtn) closeCreateBtn.addEventListener('click', () => createModal.classList.add('hidden'));
    if (cancelCreateBtn) cancelCreateBtn.addEventListener('click', () => createModal.classList.add('hidden'));

    // Link Modal
    if (closeLinkBtn) closeLinkBtn.addEventListener('click', () => linkModal.classList.add('hidden'));
    if (cancelLinkBtn) cancelLinkBtn.addEventListener('click', () => linkModal.classList.add('hidden'));

    // Close on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === createModal) createModal.classList.add('hidden');
        if (e.target === linkModal) linkModal.classList.add('hidden');
    });

    // --- 6. Create Repository Logic ---
    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', async () => {
            const name = document.getElementById('new-repo-name').value;
            const desc = document.getElementById('new-repo-desc').value;
            const isPrivate = document.getElementById('new-repo-private').checked;
            const btnOriginalText = confirmCreateBtn.textContent;

            if (!name) { alert('Repository Name is required'); return; }

            confirmCreateBtn.textContent = 'Creating...';
            confirmCreateBtn.disabled = true;

            try {
                const response = await fetch('/integration/api/repos/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, description: desc, is_private: isPrivate })
                });
                const data = await response.json();
                
                if (data.success) {
                    createModal.classList.add('hidden');
                    // Reset form
                    document.getElementById('new-repo-name').value = '';
                    document.getElementById('new-repo-desc').value = '';
                    alert(data.message);
                    loadRepositories();
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

    // --- 7. UI Status Management ---
    function checkIntegrationStatus(isConnected) {
        if (isConnected) {
            githubStatus.classList.remove('disconnected');
            githubStatus.classList.add('connected');
            githubStatus.querySelector('.status-text').innerHTML = '<i class="fas fa-check-circle"></i> Status: Connected';
            
            connectGithubBtn.textContent = 'Disconnect from GitHub';
            connectGithubBtn.classList.remove('btn-github');
            connectGithubBtn.classList.add('btn-secondary');
            
            githubConfig.classList.remove('hidden');
            if(addNewRepoBtn) addNewRepoBtn.disabled = false;
        } else {
            githubStatus.classList.add('disconnected');
            githubStatus.classList.remove('connected');
            githubStatus.querySelector('.status-text').innerHTML = 'Status: Disconnected';
            
            connectGithubBtn.textContent = 'Connect to GitHub';
            connectGithubBtn.classList.add('btn-github');
            connectGithubBtn.classList.remove('btn-secondary');
            
            githubConfig.classList.add('hidden');
            if(addNewRepoBtn) addNewRepoBtn.disabled = true;
        }
    }

    // --- 8. Connect/Disconnect & Copy Logic ---
    connectGithubBtn.addEventListener('click', () => {
        if (connectGithubBtn.textContent.includes('Disconnect')) {
            if(confirm("Are you sure you want to disconnect GitHub?")) {
                window.location.href = '/integration/github/disconnect';
            }
        } else {
            window.location.href = '/integration/github/connect';
        }
    });

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const webhookInput = document.querySelector('#github-config input[type="text"]');
            webhookInput.select();
            document.execCommand('copy');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
        });
    }

    // --- 9. Save Configuration Settings ---
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
                } catch (err) { console.error('Failed to save settings', err); }
            });
        });
    }

    // Start
    loadRepositories();
});