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
    let activeChannelId = null; // Will be set after loading channels

    // --- INITIALIZATION ---
    loadSlackChannels().then(() => {
        if (activeChannelId) {
            loadMessages(activeChannelId);
            updateContextPanel(activeChannelId);
        } else {
            // If no channels loaded, show a helpful message
            renderMessage({
                user: 'System',
                text: '⚠️ Unable to load channels. Please check that the server is running and Slack is properly configured.',
                timestamp: new Date().toLocaleTimeString(),
                sent: false
            });
        }
    }).catch(() => {
        // Handle initialization errors
        renderMessage({
            user: 'System',
            text: '❌ Failed to initialize chat. Please refresh the page or contact support.',
            timestamp: new Date().toLocaleTimeString(),
            sent: false
        });
    });

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const chatSidebar = document.querySelector('.chat-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    sidebarToggle.addEventListener('click', () => {
        chatSidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    });

    // Close sidebar when clicking overlay or outside on mobile
    sidebarOverlay.addEventListener('click', () => {
        chatSidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !chatSidebar.contains(e.target) && 
            e.target !== sidebarToggle && 
            !sidebarToggle.contains(e.target)) {
            chatSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        }
    });

    // --- EVENT LISTENERS ---
    channelList.addEventListener('click', handleChannelChange);
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    messageInput.addEventListener('input', () => {
        // Show typing indicator when user is typing
        const typingIndicator = document.getElementById('typing-indicator');
        if (messageInput.value.length > 0) {
            typingIndicator.style.display = 'flex';
        } else {
            typingIndicator.style.display = 'none';
        }
    });

    messageInput.addEventListener('blur', () => {
        // Hide typing indicator when input loses focus
        document.getElementById('typing-indicator').style.display = 'none';
    });


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
    
    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        messageInput.value = '';

        // Hide typing indicator
        document.getElementById('typing-indicator').style.display = 'none';

        renderMessage({
            user: CURRENT_USER.name,
            text,
            timestamp: new Date().toLocaleTimeString(),
            sent: true
        });

        scrollToBottom();

        // Add sending animation to button
        const sendBtn = document.getElementById('send-btn');
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        sendBtn.disabled = true;

        try {
            const response = await fetch('/api/v1/slack/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: activeChannelId,
                    text
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send message');
            }

            // Success - button will be re-enabled
        } catch (error) {
            console.error('Error sending message:', error);
            // Show error message to user
            renderMessage({
                user: 'System',
                text: `❌ Failed to send message: ${error.message}`,
                timestamp: new Date().toLocaleTimeString(),
                sent: false
            });
            scrollToBottom();
        } finally {
            // Reset button
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            sendBtn.disabled = false;
        }
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
    
    async function loadMessages(channelId) {
        messageContainer.innerHTML = '';

        try {
            const res = await fetch(`/api/v1/slack/messages/${channelId}`);
            if (!res.ok) {
                throw new Error(`Failed to load messages: ${res.status}`);
            }
            const messages = await res.json();

            messages.reverse().forEach(msg => {
                renderMessage({
                    user: msg.user,
                    text: msg.text,
                    timestamp: msg.time,
                    sent: msg.user === CURRENT_USER.name
                });
            });

            scrollToBottom();
        } catch (error) {
            console.error('Error loading messages:', error);
            renderMessage({
                user: 'System',
                text: `❌ Failed to load messages: ${error.message}`,
                timestamp: new Date().toLocaleTimeString(),
                sent: false
            });
        }
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


    async function loadSlackChannels() {
        try {
            const res = await fetch('/api/v1/slack/channels');
            if (!res.ok) {
                throw new Error(`Failed to load channels: ${res.status}`);
            }
            const channels = await res.json();

            channelList.innerHTML = '';
            let defaultChannelFound = false;

            channels.forEach((ch, index) => {
                const li = document.createElement('li');
                li.className = 'channel-item';
                li.dataset.channelId = ch.id;
                li.textContent = `# ${ch.name}`;
                channelList.appendChild(li);

                // Check if this is the default channel
                if (ch.id === 'C07ABC1234') { // You should replace this with actual default channel ID
                    activeChannelId = ch.id;
                    li.classList.add('active');
                    currentChannelName.textContent = `# ${ch.name}`;
                    defaultChannelFound = true;
                }
                // If no default channel found, use the first one
                else if (!defaultChannelFound && index === 0 && !activeChannelId) {
                    activeChannelId = ch.id;
                    li.classList.add('active');
                    currentChannelName.textContent = `# ${ch.name}`;
                }
            });

            // If no channels were loaded, show an error
            if (channels.length === 0) {
                channelList.innerHTML = '<li class="error">❌ No channels available<br><small>Check Slack app permissions and channel access</small></li>';
                // Disable send functionality
                messageInput.disabled = true;
                sendBtn.disabled = true;
                messageInput.placeholder = "No channels available";
            } else {
                // Enable send functionality
                messageInput.disabled = false;
                sendBtn.disabled = false;
                messageInput.placeholder = "Type your message...";
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            channelList.innerHTML = '<li class="error">❌ Failed to load channels</li>';
        }
    }
    loadSlackChannels();
});