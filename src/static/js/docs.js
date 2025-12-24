// Documentation Page - Google Drive Integration
const DOCS_API_URL = '/docs/api/documents';
const PROJECTS_API_URL = '/api/v1/projects';

// Global state
let currentProjectFilter = null;
let currentFolderId = null;
let currentView = 'grid';
let allDocuments = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DOCS] Page loaded, initializing...');
    
    // Get elements
    const uploadBtn = document.getElementById('upload-btn');
    const createFolderBtn = document.getElementById('create-folder-btn');
    const uploadModal = document.getElementById('upload-modal');
    const folderModal = document.getElementById('folder-modal');
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const projectFilter = document.getElementById('project-filter');
    const searchInput = document.getElementById('page-search');
    const viewBtns = document.querySelectorAll('.view-btn');
    
    // Initialize
    loadProjects();
    loadDocuments();
    
    // Event listeners
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => openModal('upload-modal'));
    }
    
    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', () => openModal('folder-modal'));
    }
    
    if (projectFilter) {
        projectFilter.addEventListener('change', handleProjectFilterChange);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 500));
    }
    
    // Upload zone drag & drop
    if (uploadZone) {
        uploadZone.addEventListener('click', () => fileInput.click());
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            handleFilesUpload(files);
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleFilesUpload(files);
        });
    }
    
    // View toggle
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchView(view);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            closeModal(modalId);
        });
    });
    
    // Close modals on overlay click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Folder creation form
    const folderForm = document.getElementById('create-folder-form');
    if (folderForm) {
        folderForm.addEventListener('submit', handleCreateFolder);
    }
    
    // ===== PROJECT FILTER =====
    
    async function loadProjects() {
        console.log('[PROJECTS] Loading projects...');
        
        try {
            const response = await fetch(PROJECTS_API_URL, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const projects = await response.json();
            console.log('[PROJECTS] Received', projects.length, 'projects');
            
            populateProjectFilters(projects);
            
        } catch (err) {
            console.error('[PROJECTS] Error:', err);
            showNotification('Error loading projects', 'error');
        }
    }
    
    function populateProjectFilters(projects) {
        const filters = [
            document.getElementById('project-filter'),
            document.getElementById('folder-project')
        ];
        
        filters.forEach(filter => {
            if (!filter) return;
            
            const currentValue = filter.value;
            const isMainFilter = filter.id === 'project-filter';
            
            filter.innerHTML = isMainFilter 
                ? '<option value="">All Projects</option>'
                : '<option value="">None</option>';
            
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.project_id;
                option.textContent = project.name || `Project ${project.project_id}`;
                filter.appendChild(option);
            });
            
            // Restore previous selection
            if (currentValue) {
                filter.value = currentValue;
            }
        });
        
        console.log('[PROJECTS] Filters populated with', projects.length, 'projects');
    }
    
    function handleProjectFilterChange() {
        const projectId = projectFilter.value;
        currentProjectFilter = projectId ? parseInt(projectId) : null;
        
        console.log('[FILTER] Changed to project:', currentProjectFilter || 'All');
        
        loadDocuments();
    }
    
    // ===== LOAD DOCUMENTS =====
    
    async function loadDocuments(folderId = null) {
        console.log('[DOCS] Loading documents...');
        
        const filesContainer = document.getElementById('files-container');
        const emptyState = document.querySelector('.empty-state');
        
        // Show loading
        filesContainer.innerHTML = `
            <div class="loading-skeleton"></div>
            <div class="loading-skeleton"></div>
            <div class="loading-skeleton"></div>
            <div class="loading-skeleton"></div>
        `;
        emptyState.style.display = 'none';
        
        try {
            // Build query params
            const params = new URLSearchParams({
                limit: 50,
                sort_by: 'recent'
            });
            
            // Add folder filter if needed
            // Note: You may need to modify your backend to support folder filtering
            
            const response = await fetch(`${DOCS_API_URL}?${params}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to load documents');
            }
            
            allDocuments = result.documents || [];
            console.log('[DOCS] Loaded', allDocuments.length, 'documents');
            
            // Apply project filter if active
            let filteredDocs = allDocuments;
            if (currentProjectFilter) {
                // Filter by project - you may need to add project_id to your docs
                // For now, showing all docs
                filteredDocs = allDocuments;
            }
            
            renderDocuments(filteredDocs);
            updateStorageInfo(result);
            
        } catch (err) {
            console.error('[DOCS] Error:', err);
            filesContainer.innerHTML = '';
            emptyState.style.display = 'flex';
            emptyState.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Documents</h3>
                <p>${err.message}</p>
            `;
        }
    }
    
    function renderDocuments(documents) {
        const filesContainer = document.getElementById('files-container');
        const emptyState = document.querySelector('.empty-state');
        
        filesContainer.innerHTML = '';
        
        if (!documents || documents.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }
        
        emptyState.style.display = 'none';
        
        documents.forEach(doc => {
            const card = createDocumentCard(doc);
            filesContainer.appendChild(card);
        });
    }
    
    function createDocumentCard(doc) {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.dataset.fileId = doc.id;
        
        const isFolder = doc.type === 'Folder';
        const iconClass = isFolder ? 'fa-folder' : getFileIcon(doc.type);
        const iconColor = isFolder ? 'folder' : '';
        
        card.innerHTML = `
            <i class="fas ${iconClass} fa-3x file-icon ${iconColor}"></i>
            <div class="file-info">
                <h3 class="file-name">${escapeHtml(doc.name)}</h3>
                <div class="file-meta">
                    <span title="${doc.modified_at}">${doc.modified_relative || 'Unknown'}</span>
                    ${doc.size_formatted ? `<span>${doc.size_formatted}</span>` : ''}
                </div>
            </div>
            <div class="file-actions">
                ${doc.web_link ? `<a href="${doc.web_link}" target="_blank" class="file-action-btn" title="Open in Drive">
                    <i class="fas fa-external-link-alt"></i>
                </a>` : ''}
                <button class="file-action-btn download-btn" data-id="${doc.id}" title="Download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="file-action-btn rename-btn" data-id="${doc.id}" title="Rename">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="file-action-btn delete-btn" data-id="${doc.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        const downloadBtn = card.querySelector('.download-btn');
        const renameBtn = card.querySelector('.rename-btn');
        const deleteBtn = card.querySelector('.delete-btn');
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadDocument(doc.id, doc.name);
            });
        }
        
        if (renameBtn) {
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                renameDocument(doc.id, doc.name);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteDocument(doc.id, doc.name);
            });
        }
        
        // Click to open folder or preview
        if (isFolder) {
            card.addEventListener('click', () => {
                openFolder(doc.id, doc.name);
            });
        }
        
        return card;
    }
    
    function getFileIcon(fileType) {
        const iconMap = {
            'PDF': 'fa-file-pdf',
            'Word': 'fa-file-word',
            'Excel': 'fa-file-excel',
            'Text': 'fa-file-alt',
            'Image': 'fa-file-image',
            'Google Doc': 'fa-file-alt',
            'Google Sheet': 'fa-table',
        };
        return iconMap[fileType] || 'fa-file';
    }
    
    function updateStorageInfo(result) {
        // This is placeholder - implement based on your API response
        const usedEl = document.getElementById('storage-used');
        const totalEl = document.getElementById('storage-total');
        const progressEl = document.getElementById('storage-progress');
        
        if (usedEl) usedEl.textContent = '2.5 GB';
        if (totalEl) totalEl.textContent = '15 GB';
        if (progressEl) progressEl.style.width = '17%';
    }
    
    // ===== UPLOAD DOCUMENTS =====
    
    async function handleFilesUpload(files) {
        if (!files || files.length === 0) return;
        
        console.log('[UPLOAD] Starting upload for', files.length, 'file(s)');
        
        const uploadList = document.getElementById('upload-list');
        uploadList.innerHTML = '';
        
        for (const file of files) {
            const uploadItem = createUploadItem(file);
            uploadList.appendChild(uploadItem);
            
            try {
                await uploadFile(file, uploadItem);
            } catch (err) {
                console.error('[UPLOAD] Error:', err);
                updateUploadItemError(uploadItem, err.message);
            }
        }
        
        // Reload documents after all uploads
        setTimeout(() => {
            loadDocuments();
            closeModal('upload-modal');
        }, 1000);
    }
    
    function createUploadItem(file) {
        const item = document.createElement('div');
        item.className = 'upload-item';
        item.innerHTML = `
            <i class="fas fa-file"></i>
            <div class="file-name">${escapeHtml(file.name)}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
            <div class="upload-progress">
                <div class="progress-bar" style="width: 0%"></div>
            </div>
        `;
        return item;
    }
    
    async function uploadFile(file, uploadItem) {
        const progressBar = uploadItem.querySelector('.progress-bar');
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        if (currentFolderId) {
            formData.append('folder_id', currentFolderId);
        }
        
        // Simulate progress (since we can't track XMLHttpRequest progress easily with fetch)
        const progressInterval = setInterval(() => {
            const currentWidth = parseInt(progressBar.style.width) || 0;
            if (currentWidth < 90) {
                progressBar.style.width = (currentWidth + 10) + '%';
            }
        }, 200);
        
        try {
            const response = await fetch(`${DOCS_API_URL}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            clearInterval(progressInterval);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Upload failed');
            }
            
            // Complete progress
            progressBar.style.width = '100%';
            progressBar.style.background = '#27ae60';
            
            showNotification(`✓ ${file.name} uploaded successfully`, 'success');
            
        } catch (err) {
            clearInterval(progressInterval);
            throw err;
        }
    }
    
    function updateUploadItemError(uploadItem, errorMsg) {
        const progressBar = uploadItem.querySelector('.progress-bar');
        progressBar.style.width = '100%';
        progressBar.style.background = '#e74c3c';
        
        const fileName = uploadItem.querySelector('.file-name');
        fileName.style.color = '#e74c3c';
        fileName.textContent += ' - Error: ' + errorMsg;
    }
    
    // ===== CREATE FOLDER =====
    
    async function handleCreateFolder(e) {
        e.preventDefault();
        
        const folderName = document.getElementById('folder-name').value.trim();
        const projectId = document.getElementById('folder-project').value;
        
        if (!folderName) {
            showNotification('Folder name is required', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        try {
            const response = await fetch(`${DOCS_API_URL.replace('/documents', '/folders')}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: folderName,
                    parent_id: currentFolderId || null
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to create folder');
            }
            
            showNotification(`✓ Folder "${folderName}" created successfully`, 'success');
            closeModal('folder-modal');
            document.getElementById('create-folder-form').reset();
            loadDocuments();
            
        } catch (err) {
            console.error('[FOLDER] Error:', err);
            showNotification(`Error: ${err.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-folder-plus"></i> Create Folder';
        }
    }
    
    // ===== DOCUMENT ACTIONS =====
    
    async function downloadDocument(fileId, fileName) {
        console.log('[DOWNLOAD] Starting download:', fileId);
        
        try {
            const response = await fetch(`${DOCS_API_URL}/${fileId}/download`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Download failed');
            }
            
            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification(`✓ ${fileName} downloaded`, 'success');
            
        } catch (err) {
            console.error('[DOWNLOAD] Error:', err);
            showNotification(`Error downloading file: ${err.message}`, 'error');
        }
    }
    
    async function renameDocument(fileId, currentName) {
        const newName = prompt('Enter new name:', currentName);
        
        if (!newName || newName === currentName) {
            return;
        }
        
        try {
            const response = await fetch(`${DOCS_API_URL}/${fileId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name: newName })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Rename failed');
            }
            
            showNotification(`✓ Renamed to "${newName}"`, 'success');
            loadDocuments();
            
        } catch (err) {
            console.error('[RENAME] Error:', err);
            showNotification(`Error: ${err.message}`, 'error');
        }
    }
    
    async function deleteDocument(fileId, fileName) {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${DOCS_API_URL}/${fileId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Delete failed');
            }
            
            showNotification(`✓ "${fileName}" deleted successfully`, 'success');
            loadDocuments();
            
        } catch (err) {
            console.error('[DELETE] Error:', err);
            showNotification(`Error: ${err.message}`, 'error');
        }
    }
    
    // ===== SEARCH =====
    
    async function handleSearch(e) {
        const query = e.target.value.trim();
        
        if (!query) {
            loadDocuments();
            return;
        }
        
        console.log('[SEARCH] Searching for:', query);
        
        try {
            const response = await fetch(`${DOCS_API_URL}/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Search failed');
            }
            
            renderDocuments(result.documents || []);
            
        } catch (err) {
            console.error('[SEARCH] Error:', err);
            showNotification(`Search error: ${err.message}`, 'error');
        }
    }
    
    // ===== VIEW SWITCHING =====
    
    function switchView(view) {
        currentView = view;
        
        const filesContainer = document.getElementById('files-container');
        
        // Update buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === view) {
                btn.classList.add('active');
            }
        });
        
        // Update container class
        if (view === 'list') {
            filesContainer.classList.remove('files-grid');
            filesContainer.classList.add('files-list');
        } else {
            filesContainer.classList.remove('files-list');
            filesContainer.classList.add('files-grid');
        }
    }
    
    // ===== BREADCRUMB NAVIGATION =====
    
    function openFolder(folderId, folderName) {
        currentFolderId = folderId;
        
        // Update breadcrumb
        const breadcrumb = document.querySelector('.breadcrumb');
        const newItem = document.createElement('a');
        newItem.href = '#';
        newItem.className = 'breadcrumb-item active';
        newItem.dataset.folder = folderId;
        newItem.innerHTML = `<i class="fas fa-chevron-right"></i> ${escapeHtml(folderName)}`;
        
        // Remove active from previous items
        breadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.classList.remove('active');
        });
        
        breadcrumb.appendChild(newItem);
        
        // Add click handler
        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToFolder(folderId);
        });
        
        loadDocuments(folderId);
    }
    
    function navigateToFolder(folderId) {
        currentFolderId = folderId;
        loadDocuments(folderId);
    }
    
    // ===== UTILITY FUNCTIONS =====
    
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-size: 14px;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function formatFileSize(bytes) {
        if (!bytes) return 'Unknown';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('[DOCS] Initialization complete');
});