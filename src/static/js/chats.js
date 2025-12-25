// Complete Working Chats JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Chats page loaded');

    // DOM Elements
    const channelList = document.getElementById('channel-list');
    const messageContainer = document.getElementById('message-container');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const currentChannelName = document.getElementById('current-channel-name');
    const aiSummaryBtn = document.getElementById('ai-summary-btn');
    const emojiBtn = document.getElementById('emoji-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const chatSidebar = document.querySelector('.chat-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    const CURRENT_USER = { name: 'You', avatar: 'https://placehold.co/35x35/4a90e2/ffffff?text=Y' };
    let activeChannelId = null;

    // Common Emojis
    const commonEmojis = [
        '😀', '😂', '😊', '😍', '🥰', '😘', '😉', '😎', '🤔', '😮',
        '😢', '😭', '😤', '😅', '🙄', '😴', '🤗', '🤭', '🤫', '🤥',
        '👍', '👎', '👌', '✌️', '🤞', '👏', '🙌', '🤝', '🙏', '💪',
        '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️',
        '🔥', '⭐', '✨', '💫', '🌟', '🎉', '🎊', '🎈', '🎂', '🍰'
    ];

    // Initialize
    init();

    function init() {
        console.log('📡 Initializing chat...');
        loadChannels();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Channel selection
        if (channelList) {
            channelList.addEventListener('click', handleChannelChange);
        }

        // Send message
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        // AI Summary
        if (aiSummaryBtn) {
            aiSummaryBtn.addEventListener('click', summarizeChat);
            console.log('✅ AI Summary button ready');
        }

        // Emoji Button - inline picker
        if (emojiBtn) {
            emojiBtn.addEventListener('click', toggleEmojiPicker);
        }

        // Mobile sidebar toggle
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                chatSidebar?.classList.toggle('open');
                sidebarOverlay?.classList.toggle('active');
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                chatSidebar?.classList.remove('open');
                sidebarOverlay?.classList.remove('active');
            });
        }

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const emojiPicker = document.getElementById('emoji-picker-inline');
            if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.remove();
            }
        });
    }

    function toggleEmojiPicker(e) {
        e.stopPropagation();
        
        // Remove existing picker
        const existingPicker = document.getElementById('emoji-picker-inline');
        if (existingPicker) {
            existingPicker.remove();
            return;
        }

        // Create inline emoji picker
        const picker = document.createElement('div');
        picker.id = 'emoji-picker-inline';
        picker.className = 'emoji-picker-inline';
        picker.innerHTML = `
            <div class="emoji-picker-header">Select Emoji</div>
            <div class="emoji-picker-grid">
                ${commonEmojis.map(emoji => `<span class="emoji-item">${emoji}</span>`).join('')}
            </div>
        `;

        // Position near emoji button
        picker.style.position = 'absolute';
        picker.style.bottom = '70px';
        picker.style.left = '24px';
        picker.style.zIndex = '1000';

        // Add to input area
        const inputArea = document.querySelector('.chat-input-area');
        inputArea.style.position = 'relative';
        inputArea.appendChild(picker);

        // Add click handlers
        picker.querySelectorAll('.emoji-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                insertEmoji(item.textContent);
                picker.remove();
            });
        });
    }

    function insertEmoji(emoji) {
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;
        messageInput.value = text.slice(0, start) + emoji + text.slice(end);
        messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
        messageInput.focus();
    }

    async function loadChannels() {
        console.log('📋 Loading channels...');
        
        try {
            const res = await fetch('/api/v1/slack/channels');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const channels = await res.json();
            console.log(`✅ Loaded ${channels.length} channels`);

            if (channels.length === 0) {
                channelList.innerHTML = '<li class="error">❌ No channels available</li>';
                return;
            }

            channelList.innerHTML = '';
            channels.forEach((ch, index) => {
                const li = document.createElement('li');
                li.className = 'channel-item';
                li.dataset.channelId = ch.id;
                li.textContent = `# ${ch.name}`;
                channelList.appendChild(li);

                if (index === 0) {
                    activeChannelId = ch.id;
                    li.classList.add('active');
                    currentChannelName.textContent = `# ${ch.name}`;
                    loadMessages(ch.id);
                }
            });
        } catch (error) {
            console.error('❌ Load channels failed:', error);
            channelList.innerHTML = '<li class="error">❌ Failed to load channels</li>';
        }
    }

    function handleChannelChange(e) {
        const target = e.target.closest('.channel-item');
        if (!target || target.classList.contains('active')) return;

        document.querySelector('.channel-item.active')?.classList.remove('active');
        target.classList.add('active');

        activeChannelId = target.dataset.channelId;
        currentChannelName.textContent = target.textContent.trim();

        loadMessages(activeChannelId);
    }

    async function loadMessages(channelId) {
        console.log(`📬 Loading messages for channel: ${channelId}`);
        messageContainer.innerHTML = '<div class="loading">Loading messages...</div>';

        try {
            const res = await fetch(`/api/v1/slack/messages/${channelId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const messages = await res.json();
            console.log(`✅ Loaded ${messages.length} messages`);

            messageContainer.innerHTML = '';

            if (messages.length === 0) {
                messageContainer.innerHTML = '<div class="loading">No messages yet. Start the conversation!</div>';
                return;
            }

            messages.reverse().forEach(msg => {
                renderMessage({
                    user: msg.user,
                    text: msg.text,
                    timestamp: msg.time,
                    sent: false
                });
            });

            scrollToBottom();
        } catch (error) {
            console.error('❌ Load messages failed:', error);
            messageContainer.innerHTML = '<div class="error">Failed to load messages</div>';
        }
    }

    function renderMessage(msg) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.sent ? 'sent' : 'received'}`;
        
        const avatarUrl = msg.sent 
            ? CURRENT_USER.avatar 
            : `https://placehold.co/35x35/00bcd4/ffffff?text=${msg.user[0]}`;

        messageEl.innerHTML = `
            <img src="${avatarUrl}" alt="${msg.user}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">
                    <strong>${msg.user}</strong> <span>${msg.timestamp}</span>
                </div>
                <p class="message-text">${msg.user === 'AI Assistant' ? simpleMarkdown(msg.text) : escapeHtml(msg.text)}</p>
            </div>
        `;
        messageContainer.appendChild(messageEl);
    }

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || !activeChannelId) return;

        messageInput.value = '';

        renderMessage({
            user: CURRENT_USER.name,
            text: text,
            timestamp: new Date().toLocaleTimeString(),
            sent: true
        });

        scrollToBottom();

        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const res = await fetch('/api/v1/slack/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: activeChannelId,
                    text: text,
                    user_name: CURRENT_USER.name
                })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            console.log('✅ Message sent');
        } catch (error) {
            console.error('❌ Send failed:', error);
            renderMessage({
                user: 'System',
                text: `❌ Failed to send: ${error.message}`,
                timestamp: new Date().toLocaleTimeString(),
                sent: false
            });
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }

    async function summarizeChat() {
        console.log('🤖 Generating AI summary...');
        
        if (!activeChannelId) {
            alert('Please select a channel first');
            return;
        }

        aiSummaryBtn.disabled = true;
        aiSummaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        try {
            // Collect messages from the page
            const messageElements = messageContainer.querySelectorAll('.message');
            const messages = [];

            messageElements.forEach(msgEl => {
                const userEl = msgEl.querySelector('.message-header strong');
                const textEl = msgEl.querySelector('.message-text');

                if (userEl && textEl) {
                    messages.push({
                        user: userEl.textContent.trim(),
                        text: textEl.textContent.trim()
                    });
                }
            });

            if (messages.length === 0) {
                throw new Error('No messages to summarize');
            }

            // Call the AI summary endpoint
            const res = await fetch('/api/v1/slack/summarize-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel_id: activeChannelId,
                    messages: messages
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || `HTTP ${res.status}`);
            }

            const result = await res.json();
            console.log('✅ AI Summary generated');

            // Display summary in the AI context panel
            const summaryResults = document.getElementById('ai-summary-results');
            const summaryContent = document.getElementById('ai-summary-content');
            
            if (summaryResults && summaryContent) {
                summaryContent.innerHTML = simpleMarkdown(result.summary);
                summaryResults.style.display = 'block';
                
                // Scroll to the summary results
                summaryResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } catch (error) {
            console.error('❌ AI Summary failed:', error);
            
            // Display error in the AI context panel
            const summaryResults = document.getElementById('ai-summary-results');
            const summaryContent = document.getElementById('ai-summary-content');
            
            if (summaryResults && summaryContent) {
                summaryContent.innerHTML = `<p style="color: #ef4444;">❌ AI Summary failed: ${error.message}</p>`;
                summaryResults.style.display = 'block';
            }
        } finally {
            aiSummaryBtn.disabled = false;
            aiSummaryBtn.innerHTML = '<i class="fas fa-robot"></i> Summarize Recent Chat';
        }
    }

    function scrollToBottom() {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function simpleMarkdown(text) {
        let lines = text.split('\n');
        let html = '';
        let inList = false;
        let inTable = false;
        let tableRows = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Check for table
            if (line.includes('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line);
                continue;
            } else if (inTable) {
                // End of table
                html += parseTable(tableRows);
                inTable = false;
                tableRows = [];
                // Fall through to process current line
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
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return html;
    }

    function parseTable(rows) {
        if (rows.length < 2) return '';
        
        let html = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        
        // First row is header
        let headerCells = rows[0].split('|').slice(1, -1).map(cell => cell.trim());
        html += '<thead><tr>';
        headerCells.forEach(cell => {
            html += '<th style="padding: 8px; text-align: left; background-color: #f2f2f2;">' + cell + '</th>';
        });
        html += '</tr></thead>';
        
        // Check if second row is separator
        if (rows.length > 1 && rows[1].includes('---')) {
            // Data rows start from index 2
            html += '<tbody>';
            for (let i = 2; i < rows.length; i++) {
                let cells = rows[i].split('|').slice(1, -1).map(cell => cell.trim());
                html += '<tr>';
                cells.forEach(cell => {
                    html += '<td style="padding: 8px;">' + cell + '</td>';
                });
                html += '</tr>';
            }
            html += '</tbody>';
        } else {
            // No separator, treat all as data
            html += '<tbody>';
            for (let i = 1; i < rows.length; i++) {
                let cells = rows[i].split('|').slice(1, -1).map(cell => cell.trim());
                html += '<tr>';
                cells.forEach(cell => {
                    html += '<td style="padding: 8px;">' + cell + '</td>';
                });
                html += '</tr>';
            }
            html += '</tbody>';
        }
        
        html += '</table>';
        return html;
    }

    console.log('✅ Chats initialization complete');
});