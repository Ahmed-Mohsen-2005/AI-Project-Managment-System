// --- MOCK Data Source (Using and adapting existing task structure) ---
const MOCK_BACKLOG_ITEMS = [
    { id: 201, title: 'Refactor Core AI Service Endpoint', type: 'TechDebt', manual_priority: 'P1', assignee: 'DevOps', ai_score: 98, projectId: '1' },
    { id: 202, title: 'Implement new user onboarding flow', type: 'Feature', manual_priority: 'P2', assignee: 'Alice J.', ai_score: 85, projectId: '1' },
    { id: 203, title: 'Migrate to MySQL Database (Deferred)', type: 'Epic', manual_priority: 'P3', assignee: 'Bob S.', ai_score: 42, projectId: '1' },
    { id: 204, title: 'Bug: Reports sometimes timeout under load', type: 'Bug', manual_priority: 'P1', assignee: 'Charlie W.', ai_score: 92, projectId: '2' },
    { id: 205, title: 'Add dark mode toggle', type: 'Feature', manual_priority: 'P3', assignee: 'You', ai_score: 15, projectId: '2' },
];

document.addEventListener('DOMContentLoaded', () => {
    const backlogList = document.getElementById('backlog-item-list');
    const quickAddBtn = document.getElementById('quick-add-item-btn');
    const modal = document.getElementById('quick-add-modal');
    const closeBtn = document.querySelector('.close-btn');
    const quickAddForm = document.getElementById('quick-add-form');
    const projectFilter = document.getElementById('project-filter');
    const sortBySelect = document.getElementById('sort-by');
    const sprintTarget = document.getElementById('sprint-planning-target');
    
    // --- INITIALIZATION ---
    loadBacklogItems();
    attachDragDropListeners();
    
    // --- EVENT LISTENERS ---
    projectFilter.addEventListener('change', loadBacklogItems);
    sortBySelect.addEventListener('change', loadBacklogItems);
    quickAddBtn.addEventListener('click', openQuickAddModal);
    closeBtn.addEventListener('click', closeQuickAddModal);
    window.addEventListener('click', (event) => { if (event.target === modal) closeQuickAddModal(); });
    quickAddForm.addEventListener('submit', handleQuickAddSubmit);

    // --- DRAG TARGET LISTENERS ---
    sprintTarget.addEventListener('dragover', handleDragOverTarget);
    sprintTarget.addEventListener('dragleave', handleDragLeaveTarget);
    sprintTarget.addEventListener('drop', handleDropToSprint);

    // --- MODAL CONTROL LOGIC ---
    function openQuickAddModal() { modal.style.display = 'block'; }
    function closeQuickAddModal() { modal.style.display = 'none'; quickAddForm.reset(); }

    // --- SORTING AND FILTERING LOGIC ---
    function sortItems(items, criteria) {
        if (criteria === 'ai_score') {
            return items.sort((a, b) => b.ai_score - a.ai_score);
        }
        if (criteria === 'priority') {
            const priorityOrder = { 'P1': 3, 'P2': 2, 'P3': 1 };
            return items.sort((a, b) => priorityOrder[b.manual_priority] - priorityOrder[a.manual_priority]);
        }
        return items; // Default sorting (e.g., creation date is simulated)
    }

    function filterAndSortItems() {
        const selectedProject = projectFilter.value;
        const sortBy = sortBySelect.value;
        
        let filtered = MOCK_BACKLOG_ITEMS.filter(item => 
            selectedProject === 'all' || item.projectId === selectedProject
        );
        
        return sortItems(filtered, sortBy);
    }
    
    // --- DATA LOADING ---
    function loadBacklogItems() {
        backlogList.innerHTML = ''; // Clear existing list
        const items = filterAndSortItems();

        setTimeout(() => { // Simulate API latency
            if (items.length === 0) {
                backlogList.innerHTML = '<li class="loading-message">No backlog items matching filters.</li>';
                return;
            }
            
            items.forEach(item => {
                const itemHtml = createBacklogItemRow(item);
                backlogList.insertAdjacentHTML('beforeend', itemHtml);
            });
            attachDragDropListeners(); // Re-attach drag listeners to new items
        }, 300);
    }

    // --- ROW RENDERING ---
    function getScoreClass(score) {
        if (score >= 90) return 'score-90-100';
        if (score >= 70) return 'score-70-89';
        if (score >= 40) return 'score-40-69';
        return 'score-0-39';
    }

    function createBacklogItemRow(item) {
        const scoreClass = getScoreClass(item.ai_score);
        const typeClass = `type-${item.type}`;
        
        return `
            <li class="backlog-item" draggable="true" data-item-id="${item.id}">
                <span class="col-id">#${item.id}</span>
                <span class="col-title">
                    <span class="item-type-badge ${typeClass}">${item.type}</span>
                    ${item.title}
                </span>
                <span class="col-priority">${item.manual_priority}</span>
                <span class="col-assignee">${item.assignee || 'Unassigned'}</span>
                <span class="col-score">
                    <div class="priority-score-box ${scoreClass}">${item.ai_score}</div>
                </span>
                <span class="col-actions">
                    <button class="btn-icon" title="View Details"><i class="fas fa-eye"></i></button>
                </span>
            </li>
        `;
    }

    // --- TASK SUBMISSION LOGIC ---
    function handleQuickAddSubmit(e) {
        e.preventDefault();
        // Simple form validation and submission simulation
        const title = document.getElementById('item-title-input').value.trim();
        const type = document.getElementById('item-type').value;
        const priority = document.getElementById('item-priority').value;
        
        const newItem = {
            id: Date.now(),
            title: title,
            type: type,
            manual_priority: priority,
            assignee: null,
            ai_score: Math.floor(Math.random() * 50) + 1, // Simulate low initial AI score
            projectId: projectFilter.value,
        };
        
        // --- API ACTION: Submit Task Data ---
        submitNewBacklogItem(newItem);
        closeQuickAddModal();
    }
    
    function submitNewBacklogItem(itemData) {
        console.log(`[ACTION] Submitting new backlog item:`, itemData.title);
        
        // --- REAL API CALL Placeholder ---
        // fetch('/api/v1/backlog', { method: 'POST', body: JSON.stringify(itemData) })
        
        // --- Simulation Success ---
        MOCK_BACKLOG_ITEMS.push(itemData); // Add to mock array
        loadBacklogItems(); // Reload the list to show the new item
    }
    
    // --- DRAG AND DROP LOGIC (Backlog Items to Sprint) ---
    
    let draggedItem = null;

    function attachDragDropListeners() {
        document.querySelectorAll('.backlog-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = e.currentTarget;
                e.dataTransfer.setData('text/plain', draggedItem.dataset.itemId);
                setTimeout(() => draggedItem.classList.add('dragging'), 0);
            });
            item.addEventListener('dragend', () => {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
            });
        });
    }

    function handleDragOverTarget(e) {
        e.preventDefault(); // Allows element to be dropped
        e.currentTarget.classList.add('drop-hover');
    }

    function handleDragLeaveTarget(e) {
        e.currentTarget.classList.remove('drop-hover');
    }

    function handleDropToSprint(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-hover');
        
        if (draggedItem) {
            const itemId = draggedItem.dataset.itemId;
            
            console.log(`[SPRINT ACTION] Item #${itemId} dragged into Sprint Planning Target.`);
            // In a real application, this triggers an API call to Task Service:
            // PUT /api/v1/sprints/current/add_item/{itemId}
            
            // --- UI Simulation ---
            draggedItem.remove(); // Remove item from backlog list
            loadBacklogItems(); // Reload/re-sort the remaining list
            
            alert(`Item #${itemId} ready for next sprint! (Simulated API call)`);
        }
    }
});
