document.addEventListener('DOMContentLoaded', () => {
    const channelList = document.getElementById('channel-list');
    const messageContainer = document.getElementById('message-container');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const currentChannelName = document.getElementById('current-channel-name');
    const contextPanel = document.querySelector('.chat-context-panel');
    const aiSummaryBtn = document.getElementById('ai-summary-btn');
    
    // MOCK USER and CHANNEL DATA
    const CURRENT_USER = { name: 'You (Project Lead)', avatar: 'https://placehold.co/35x35/4a90e2/ffffff?text=Y' };
    let activeChannelId = 'general';

    // --- INITIALIZATION ---
    loadMessages(activeChannelId);
    updateContextPanel(activeChannelId);

    // --- EVENT LISTENERS ---
    channelList.addEventListener('click', handleChannelChange);
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    aiSummaryBtn.addEventListener('click', summarizeChat);


    // --- CHAT LOGIC ---

    function handleChannelChange(e) {
        const target = e.target.closest('.channel-item');
        if (!target || target.classList.contains('active')) return;

        // Update UI state
        document.querySelector('.channel-item.active')?.classList.remove('active');
        target.classList.add('active');
        target.querySelector('.unread-count')?.remove();

        activeChannelId = target.dataset.channelId;
        currentChannelName.textContent = target.textContent.trim();

        loadMessages(activeChannelId);
        updateContextPanel(activeChannelId);
    }
    
    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // 1. Clear input and render message locally
        messageInput.value = '';
        renderMessage({ 
            user: CURRENT_USER.name, 
            text: text, 
            timestamp: new Date().toLocaleTimeString(), 
            sent: true 
        });

        // 2. Scroll to bottom
        scrollToBottom();

        // 3. --- API ACTION: Send Message (WebSocket Simulation) ---
        console.log(`[WS] Sending message to ${activeChannelId}: ${text}`);
        
        // In production, this uses the WebSocket connection provided by the Notification Service:
        // WebSocket.send(JSON.stringify({ channel: activeChannelId, content: text }));
    }

    function renderMessage(msg) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.sent ? 'sent' : 'received'}`;
        
        const avatarUrl = msg.user === CURRENT_USER.name 
            ? CURRENT_USER.avatar 
            : `https://placehold.co/35x35/00bcd4/ffffff?text=${msg.user[0]}`;

        messageEl.innerHTML = `
            <img src="${avatarUrl}" alt="${msg.user}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">
                    <strong>${msg.user}</strong> <span>${msg.timestamp}</span>
                </div>
                <p class="message-text">${msg.text}</p>
            </div>
        `;
        messageContainer.appendChild(messageEl);
    }
    
    function loadMessages(channelId) {
        messageContainer.innerHTML = ''; // Clear previous messages
        
        // --- SIMULATION of API fetch('/api/v1/chats/' + channelId) ---
        const MOCK_MESSAGES = [
            { user: 'System', text: `You joined #${channelId}. Welcome!`, timestamp: '10:00 AM', sent: false },
            { user: 'Alice J.', text: 'Good morning! Did anyone check the risk score for WI-103 yet?', timestamp: '10:05 AM', sent: false },
            { user: CURRENT_USER.name, text: 'I saw the AI score is 45% (medium risk). I will finish the integration by EOD.', timestamp: '10:10 AM', sent: true },
            { user: 'Bob S.', text: 'Great work! We need that endpoint for the UI team today.', timestamp: '10:11 AM', sent: false },
        ];
        
        MOCK_MESSAGES.forEach(renderMessage);
        scrollToBottom();
    }

    function scrollToBottom() {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    // --- AI CONTEXT LOGIC ---
    function updateContextPanel(channelId) {
        // --- SIMULATION of AI Sentiment Service (FR-503) ---
        const mockSentiment = {
            general: { score: 0.45, status: 'Neutral/Low Stress', color: 'medium' },
            backend: { score: 0.88, status: 'High Stress/Blocker Detected', color: 'high' },
            frontend: { score: 0.10, status: 'Very Calm', color: 'low' }
        };
        
        const sentimentData = mockSentiment[channelId] || mockSentiment['general'];
        const scoreEl = document.getElementById('sentiment-score');
        const statusEl = document.getElementById('sentiment-status');
        const widgetEl = document.querySelector('.stress-widget');
        
        scoreEl.textContent = sentimentData.score.toFixed(2);
        statusEl.textContent = sentimentData.status;
        
        // Update visual risk class
        widgetEl.classList.remove('low', 'medium', 'high');
        widgetEl.classList.add(sentimentData.color);
        
        // Update Linked Tasks (Mock)
        const taskList = document.getElementById('linked-task-list');
        if (channelId === 'backend') {
            taskList.innerHTML = '<li>WI-101: Auth API Fix <span class="task-status status-danger">P1</span></li><li>WI-103: Webhook Integr. <span class="task-status status-warning">P1</span></li>';
        } else {
            taskList.innerHTML = '<li>No critical tasks linked.</li>';
        }
    }
    
    async function summarizeChat() {
        aiSummaryBtn.disabled = true;
        aiSummaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate AI processing
        
        const summary = `**AI Summary (${activeChannelId}):** The primary conclusion is that integration for WI-103 is blocking the UI team. Alice J. confirmed the risk but noted the solution is expected today. No critical conflicts were detected, but the overall mood is urgent.`;
        
        // Render AI message in the chat thread
        renderMessage({
            user: 'AI Assistant',
            text: summary,
            timestamp: new Date().toLocaleTimeString(),
            sent: false // Received from system
        });
        
        scrollToBottom();
        
        aiSummaryBtn.disabled = false;
        aiSummaryBtn.innerHTML = '<i class="fas fa-robot"></i> Summarize Recent Chat';
    }
});