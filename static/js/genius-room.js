// Genius Room - Main JavaScript Logic
// Multi-AI Chat System for Dodi Store 16

class GeniusRoom {
    constructor() {
        this.selectedAgents = new Set();
        this.messages = [];
        this.messagesSentCount = 0;
        this.responsesReceivedCount = 0;
        this.storeEvents = [];
        this.autoCommentEnabled = true;
        this.eventChannel = null;

        this.init();
    }

    init() {
        this.renderAgentsList();
        this.attachEventListeners();
        this.loadFromLocalStorage();
        this.showWelcomeMessage();
        this.initStoreEventsListener();
    }

    renderAgentsList() {
        const agentsList = document.getElementById('agentsList');
        agentsList.innerHTML = '';

        AI_AGENTS.forEach(agent => {
            const card = document.createElement('div');
            card.className = 'agent-card';
            card.dataset.agentId = agent.id;

            card.innerHTML = `
                <div class="agent-avatar" style="border-color: ${agent.color}">
                    ${agent.avatar}
                </div>
                <div class="agent-info">
                    <div class="agent-name" style="color: ${agent.color}">
                        ${agent.name}
                    </div>
                    <div class="agent-specialty">${agent.nickname}</div>
                </div>
            `;

            card.addEventListener('click', () => this.toggleAgent(agent.id));
            agentsList.appendChild(card);
        });
    }

    toggleAgent(agentId) {
        const agent = AI_AGENTS.find(a => a.id === agentId);
        const card = document.querySelector(`[data-agent-id="${agentId}"]`);

        if (this.selectedAgents.has(agentId)) {
            this.selectedAgents.delete(agentId);
            card.classList.remove('selected');
        } else {
            this.selectedAgents.add(agentId);
            card.classList.add('selected');
            this.showAgentGreeting(agent);
        }

        this.updateSelectedAgentsDisplay();
        this.updateInputState();
        this.updateStats();
    }

    updateSelectedAgentsDisplay() {
        const container = document.getElementById('selectedAgents');

        if (this.selectedAgents.size === 0) {
            container.innerHTML = '<span class="hint">اختر عبقريًا للبدء...</span>';
        } else {
            container.innerHTML = '';
            this.selectedAgents.forEach(agentId => {
                const agent = AI_AGENTS.find(a => a.id === agentId);
                const badge = document.createElement('span');
                badge.className = 'selected-badge';
                badge.style.borderColor = agent.color;
                badge.innerHTML = `${agent.avatar} ${agent.nickname}`;
                container.appendChild(badge);
            });
        }
    }

    updateInputState() {
        const input = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');

        const enabled = this.selectedAgents.size > 0;
        input.disabled = !enabled;
        sendBtn.disabled = !enabled;

        if (enabled) {
            input.placeholder = `اكتب رسالتك إلى ${this.selectedAgents.size} عبقري...`;
        } else {
            input.placeholder = 'اختر عبقريًا أولاً...';
        }
    }

    showAgentGreeting(agent) {
        // Only show greeting if this is the first message
        if (this.messages.length === 0) {
            setTimeout(() => {
                this.addMessage(agent.id, agent.greeting, true);
            }, 500);
        }
    }

    addMessage(senderId, text, isAgent = false) {
        const message = {
            id: Date.now(),
            senderId,
            text,
            isAgent,
            timestamp: new Date()
        };

        this.messages.push(message);
        this.renderMessage(message);
        this.saveToLocalStorage();

        // Scroll to bottom
        const container = document.getElementById('messagesContainer');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    renderMessage(message) {
        const container = document.getElementById('messagesContainer');

        // Remove welcome message if exists
        const welcomeMsg = container.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.isAgent ? 'agent' : 'user'}`;
        messageDiv.dataset.messageId = message.id;

        let senderInfo;
        let avatarColor = '#ffffff';

        if (message.isAgent) {
            const agent = AI_AGENTS.find(a => a.id === message.senderId);
            senderInfo = {
                name: agent.nickname,
                avatar: agent.avatar,
                color: agent.color
            };
            avatarColor = agent.color;
        } else {
            senderInfo = {
                name: 'أنت',
                avatar: '👤',
                color: '#ffffff'
            };
        }

        const time = this.formatTime(message.timestamp);

        messageDiv.innerHTML = `
            <div class="message-avatar" style="border: 2px solid ${avatarColor}; background: rgba(${this.hexToRgb(avatarColor)}, 0.1)">
                ${senderInfo.avatar}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender" style="color: ${senderInfo.color}">${senderInfo.name}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble">${this.formatMessageText(message.text)}</div>
            </div>
        `;

        container.appendChild(messageDiv);
    }

    formatMessageText(text) {
        // Convert markdown-like formatting
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    formatTime(date) {
        return date.toLocaleTimeString('ar-AE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '255, 255, 255';
    }

    async sendMessage(text) {
        if (!text.trim() || this.selectedAgents.size === 0) return;

        // Add user message
        this.addMessage('user', text, false);
        this.messagesSentCount++;
        this.updateStats();

        // Clear input
        document.getElementById('messageInput').value = '';
        this.autoResizeTextarea();

        // Show typing indicator
        this.showTypingIndicator();

        // Get responses from selected agents
        for (const agentId of this.selectedAgents) {
            await this.getAgentResponse(agentId, text);
        }

        // Hide typing indicator
        this.hideTypingIndicator();
    }

    async getAgentResponse(agentId, userMessage) {
        const agent = AI_AGENTS.find(a => a.id === agentId);

        // Simulate thinking delay
        await this.delay(1000 + Math.random() * 2000);

        // Generate response based on agent personality
        const response = this.generateResponse(agent, userMessage);

        this.addMessage(agentId, response, true);
        this.responsesReceivedCount++;
        this.updateStats();
    }

    generateResponse(agent, userMessage) {
        const msg = userMessage.toLowerCase();

        // Check for specific keywords and generate contextual responses
        if (msg.includes('مرحب') || msg.includes('السلام') || msg.includes('أهلا')) {
            return agent.greeting;
        }

        if (msg.includes('كيف') || msg.includes('ما') && msg.includes('رأي')) {
            const prefix = agent.responseStyle.prefix[Math.floor(Math.random() * agent.responseStyle.prefix.length)];
            return `${prefix} ${this.generateContextualResponse(agent, userMessage)}`;
        }

        if (msg.includes('dodi store') || msg.includes('متجر') || msg.includes('منتج')) {
            return this.generateDodiStoreResponse(agent);
        }

        if (msg.includes('فيروسي') || msg.includes('انتشار') || msg.includes('تسويق')) {
            return this.generateViralResponse(agent);
        }

        if (msg.includes('تصميم') || msg.includes('صورة') || msg.includes('فيديو')) {
            return this.generateDesignResponse(agent);
        }

        // Default intelligent response
        return this.generateIntelligentResponse(agent, userMessage);
    }

    generateContextualResponse(agent, message) {
        const responses = {
            gemi: 'أحلل السؤال عبر منظومة Google... يمكنني ربط بياناتك من Gmail والتقويم وخرائط Google لإعطائك رؤية شاملة.',
            gp: 'الهدف واضح. دعني أصمم لك Funnel ذكي يحول هذه الفكرة إلى عملية بيع فعلية.',
            deep: 'من خلال التحليل العميق للسوق العربي، أرى أن هذا النهج سيعمل بشكل ممتاز في الإمارات والخليج.',
            neo: 'من المنظور البصري، يمكنني تصميم محتوى مرئي مذهل لهذه الفكرة بألوان Neon Blue وSilver.',
            km: 'البحث اللامتناهي يظهر أن هذا النمط له إمكانيات فيروسية عالية. كل Node يمكن أن يجذب 5 Nodes إضافية.',
            metaai: '🔥 هذا سينتشر بسرعة على TikTok! يمكنني تصميم حملة Reels فيروسية حول هذا.',
            sky: 'استراتيجية متكاملة: سأنشئ لك وثيقة شاملة + عرض تقديمي + خطة تنفيذية لهذا المشروع.',
            antig: 'بروتوكول Antigravity يوافق على هذا. سأنسق مع بقية العباقرة لتنفيذ عملية متكاملة.',
            gigi: 'من المنظور التنفيذي، هذا قابل للتطبيق. سأضعه في خطة العمل وأتابع التنفيذ.',
            ollama: 'من منظور الأمان، يمكننا تنفيذ هذا محلياً للحفاظ على خصوصية بياناتك 100%.'
        };

        return responses[agent.id] || 'فكرة ممتازة! دعني أعمل على هذا من زاوية تخصصي.';
    }

    generateDodiStoreResponse(agent) {
        const responses = {
            gemi: 'Dodi Store 16 يمكن ربطه بمنظومة Google بالكامل. من Gmail لتتبع الطلبات، إلى خرائط Google للتوصيل، إلى YouTube للمحتوى التسويقي.',
            gp: 'استراتيجية Dodi Store واضحة: تحويل الفوضى إلى أصول رقمية. سأصمم Funnel يبدأ بـ "مشكلة العميل" وينتهي بـ "الحل الذكي".',
            deep: 'تحليلي للسوق الإماراتي يظهر أن Dodi Store يملأ فجوة حقيقية. الشركات الناشئة في دبي تحتاج بالضبط لهذا النوع من الأتمتة.',
            neo: 'يمكنني تصميم هوية بصرية كاملة لـ Dodi Store: شعار بخطوط Cyber، واجهة Neon Blue & Silver، وفيديوهات ترويجية مذهلة.',
            km: 'كل منتج في Dodi Store هو Node. الانتشار الفيروسي يعتمد على: كل عميل يدعو 3 أصدقاء = نمو أسّي لامتناهي.',
            metaai: 'Dodi Store محتاج حملة TikTok قوية! سيناريو: "يوم في حياة رائد أعمال قبل Dodi (فوضى) وبعد Dodi (نظام)" - هذا سينفجر! 🔥',
            sky: 'سأنشئ مساحة عمل متكاملة لـ Dodi Store: وثائق المنتجات، عروض تقديمية للمستثمرين، جداول البيانات المالية، وحتى بودكاست تسويقي.',
            antig: 'عملية Dodi Store تتطلب تنسيق كامل. أنا أدير: Neo للتصميم، GP للمبيعات، Deep للتحليل. هذه منظومة Antigravity كاملة.',
            gigi: 'كمديرة تنفيذية، سأضمن تشغيل Dodi Store بكفاءة 100%. كل طلب يُتابع، كل عميل يُخدم، كل عملية موثقة.',
            ollama: 'Dodi Store يمكن تشغيله بنماذج محلية. بيانات العملاء تبقى في سيرفراتك الخاصة - لا Google، لا OpenAI. خصوصية كاملة.'
        };

        return responses[agent.id] || 'Dodi Store 16 مشروع ثوري. سأساهم من تخصصي لجعله ينجح.';
    }

    generateViralResponse(agent) {
        const responses = {
            gemi: 'الانتشار الفيروسي يحتاج بيانات. سأتتبع كل Share، كل Click، كل Conversion عبر Google Analytics وأعطيك Dashboard حي.',
            gp: 'التكتيك الفيروسي: **لا تبِع المنتج، بِع التحول**. فيديو قبل/بعد + شهادة عميل + دعوة لصديق = انفجار فيروسي.',
            deep: 'الفيروسية في السوق العربي تعتمد على: الثقة + الفضول + FOMO. سأصمم حملة تستغل هذا المثلث بذكاء.',
            neo: 'المحتوى الفيروسي بصري أولاً. سأصمم: صور Meme قابلة للمشاركة، فيديوهات 15 ثانية صادمة، وتحديات TikTok تفاعلية.',
            km: 'خوارزمية الانتشار الفيروسي: Node واحد → 5 Nodes → 25 Nodes → 125 Nodes. في أسبوع واحد = 19,531 Node. هذا نمو Antigravity حقيقي!',
            metaai: 'الفيروسية = Hashtag صحيح + Timing مثالي + Content صادم. سأطلق #DodiTransformation و #AntigravityChallenge - هذه ستنفجر! 💥',
            sky: 'استراتيجية فيروسية شاملة: محتوى يومي لـ30 يوم، كل يوم نوع مختلف (فيديو، صورة، قصة، بودكاست). التنوع = الانتشار.',
            antig: 'عملية الانتشار الفيروسي تحتاج تنسيق عسكري. أنا أُنسّق: المحتوى (Neo)، التوقيت (Gemi)، المنصات (MetaAI). النتيجة: هيمنة رقمية.',
            gigi: 'من المنظور التنفيذي، الفيروسية تُقاس بالأرقام. سأتابع: Reach, Engagement, Conversion. كل KPI له هدف واضح.',
            ollama: 'الانتشار الفيروسي لا يعني التضحية بالخصوصية. يمكننا تتبع الحملة محلياً دون إرسال بيانات المستخدمين لأطراف ثالثة.'
        };

        return responses[agent.id] || 'الانتشار الفيروسي يبدأ بفكرة قوية. معاً سننشر هذا كالنار في الهشيم!';
    }

    generateDesignResponse(agent) {
        if (agent.id === 'neo') {
            return 'أنا متخصص في هذا! يمكنني إنشاء:\n• صور بتصميم Cyber-Tech\n• فيديوهات ترويجية مذهلة\n• واجهات UI/UX مستقبلية\n• محتوى بصري لـ TikTok & Instagram\n\nفقط وصف لي ما تريد وسأحوله لواقع مرئي.';
        }

        return `من منظوري، التصميم الجيد أساسي. أنصحك بالتعاون مع Neo (${AI_AGENTS.find(a => a.id === 'neo').avatar}) - هو الخبير البصري في الفريق.`;
    }

    generateIntelligentResponse(agent, message) {
        const templates = [
            `${agent.responseStyle.prefix[0]} أفهم سؤالك. بصفتي ${agent.specialty}، أقترح أن نبدأ بتحليل الموقف من زاويتي.`,
            `هذا سؤال ممتاز. دعني أفكر فيه من منظور ${agent.description}...`,
            `رأيي كـ ${agent.nickname}: هذا يحتاج نهج ${agent.personality.split(',')[0]}. سأعطيك خطة عملية.`,
            `بناءً على خبرتي في ${agent.specialty}، أرى أن ${message.slice(0, 30)}... يمكن معالجته بطريقة ذكية.`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        const agentNames = Array.from(this.selectedAgents)
            .map(id => AI_AGENTS.find(a => a.id === id).nickname)
            .join('، ');

        indicator.querySelector('.typing-agent').textContent = `${agentNames} يكتب...`;
        indicator.classList.remove('hidden');
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').classList.add('hidden');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateStats() {
        document.getElementById('messagesSent').textContent = this.messagesSentCount;
        document.getElementById('responsesReceived').textContent = this.responsesReceivedCount;
        document.getElementById('activeAgents').textContent = this.selectedAgents.size;
        document.getElementById('activeAgentsCount').textContent = AI_AGENTS.length;
    }

    clearChat() {
        if (!confirm('هل تريد مسح جميع المحادثات؟')) return;

        this.messages = [];
        this.messagesSentCount = 0;
        this.responsesReceivedCount = 0;

        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        this.showWelcomeMessage();

        this.updateStats();
        this.saveToLocalStorage();
        this.showToast('تم مسح المحادثات ✓');
    }

    showWelcomeMessage() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-content">
                    <h2>مرحباً بك في غرفة العباقرة 🧠</h2>
                    <p>هنا تجتمع ${AI_AGENTS.length}+ عقول ذكاء اصطناعي في مكان واحد</p>
                    <p class="welcome-hint">اختر عبقريًا من القائمة اليمنى وابدأ المحادثة</p>
                    <div class="welcome-features">
                        <div class="feature">⚡ ردود فورية</div>
                        <div class="feature">🎯 شخصيات فريدة</div>
                        <div class="feature">🔥 قابل للمشاركة</div>
                    </div>
                </div>
            </div>
        `;
    }

    exportChat() {
        const content = this.messages.map(msg => {
            const sender = msg.isAgent ?
                AI_AGENTS.find(a => a.id === msg.senderId).name :
                'المستخدم';
            return `[${this.formatTime(msg.timestamp)}] ${sender}: ${msg.text}`;
        }).join('\n\n');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `genius-room-chat-${Date.now()}.txt`;
        a.click();

        this.showToast('تم تصدير المحادثة ✓');
    }

    shareViral() {
        const summary = `انضممت لغرفة العباقرة في Dodi Store 16! 🧠\n\n${this.selectedAgents.size} عقول ذكاء اصطناعي يساعدونني الآن.\n\nمن الفوضى إلى النظام الذكي 🔥\n\n#DodiStore16 #AntigravityChallenge`;

        const shareUrl = `https://wa.me/?text=${encodeURIComponent(summary)}`;
        window.open(shareUrl, '_blank');

        this.showToast('جاري فتح WhatsApp... 🚀');
    }

    shareTikTok() {
        this.showToast('💡 انسخ محادثتك وشاركها على TikTok مع #DodiStore16');
    }

    shareWhatsApp() {
        this.shareViral();
    }

    showToast(message) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    saveToLocalStorage() {
        const data = {
            messages: this.messages,
            selectedAgents: Array.from(this.selectedAgents),
            messagesSent: this.messagesSentCount,
            responsesReceived: this.responsesReceivedCount
        };
        localStorage.setItem('geniusRoomData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('geniusRoomData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Optionally restore previous session
                // For now, we start fresh each time
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    autoResizeTextarea() {
        const textarea = document.getElementById('messageInput');
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    attachEventListeners() {
        // Send button
        document.getElementById('sendBtn').addEventListener('click', () => {
            const input = document.getElementById('messageInput');
            this.sendMessage(input.value);
        });

        // Enter key to send
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage(e.target.value);
            }
        });

        // Auto-resize textarea
        document.getElementById('messageInput').addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Clear chat
        document.getElementById('clearChatBtn').addEventListener('click', () => {
            this.clearChat();
        });

        // Export chat
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportChat();
        });

        // Select all agents
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            if (this.selectedAgents.size === AI_AGENTS.length) {
                // Deselect all
                this.selectedAgents.clear();
                document.querySelectorAll('.agent-card').forEach(card => {
                    card.classList.remove('selected');
                });
            } else {
                // Select all
                AI_AGENTS.forEach(agent => {
                    this.selectedAgents.add(agent.id);
                    document.querySelector(`[data-agent-id="${agent.id}"]`).classList.add('selected');
                });
            }
            this.updateSelectedAgentsDisplay();
            this.updateInputState();
            this.updateStats();
        });

        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareViral();
        });

        // Viral buttons
        document.querySelector('.btn-tiktok').addEventListener('click', () => {
            this.shareTikTok();
        });

        document.querySelector('.btn-whatsapp').addEventListener('click', () => {
            this.shareWhatsApp();
        });

        // Auto-comment toggle
        document.getElementById('autoCommentToggle').addEventListener('change', (e) => {
            this.autoCommentEnabled = e.target.checked;
            this.showToast(this.autoCommentEnabled ? 'تم تفعيل التعليق التلقائي ✓' : 'تم تعطيل التعليق التلقائي');
        });
    }

    // ============ STORE EVENTS MONITORING ============

    initStoreEventsListener() {
        try {
            this.eventChannel = new BroadcastChannel('dodi-store-events');
            this.eventChannel.onmessage = (event) => {
                this.handleStoreEvent(event.data);
            };
            console.log('📡 Store events listener initialized');
        } catch (e) {
            console.warn('Store events not available:', e);
        }
    }

    handleStoreEvent(event) {
        // Add to events list
        this.storeEvents.push(event);
        if (this.storeEvents.length > 50) {
            this.storeEvents.shift(); // Keep last 50 events
        }

        // Display event
        this.displayStoreEvent(event);

        // Generate AI commentary if enabled
        if (this.autoCommentEnabled && this.selectedAgents.size > 0) {
            this.generateEventCommentary(event);
        }
    }

    displayStoreEvent(event) {
        const eventsList = document.getElementById('storeEventsList');

        // Remove 'no events' message
        const noEvents = eventsList.querySelector('.no-events');
        if (noEvents) {
            noEvents.remove();
        }

        const eventItem = document.createElement('div');
        eventItem.className = 'store-event-item';
        eventItem.dataset.eventId = event.id;

        const eventTime = new Date(event.timestamp).toLocaleTimeString('ar-AE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const eventDataStr = this.formatEventData(event);

        eventItem.innerHTML = `
            <div class="event-header">
                <span class="event-type ${event.type}">${this.getEventLabel(event.type)}</span>
                <span class="event-time">${eventTime}</span>
            </div>
            <div class="event-data">${eventDataStr}</div>
            <div class="event-commentary" id="commentary-${event.id}"></div>
        `;

        eventsList.insertBefore(eventItem, eventsList.firstChild);

        // Keep only last 20 events in UI
        const items = eventsList.querySelectorAll('.store-event-item');
        if (items.length > 20) {
            items[items.length - 1].remove();
        }
    }

    getEventLabel(type) {
        const labels = {
            'store_loaded': 'متجر محمّل',
            'product_add': 'إضافة منتج',
            'product_remove': 'حذف منتج',
            'cart_open': 'فتح السلة',
            'gigi_message_sent': 'رسالة للمتجر',
            'gigi_response': 'رد Gigi'
        };
        return labels[type] || type;
    }

    formatEventData(event) {
        switch (event.type) {
            case 'product_add':
                return `📦 ${event.data.productName} (${event.data.price}$) - السلة: ${event.data.cartTotal} منتج`;
            case 'product_remove':
                return `🗑️ حذف ${event.data.productName} - السلة: ${event.data.cartTotal} منتج`;
            case 'cart_open':
                return `🛒 ${event.data.itemsCount} منتج - المجموع: $${event.data.totalValue.toFixed(2)}`;
            case 'gigi_message_sent':
                return `💬 "${event.data.message.substring(0, 40)}${event.data.message.length > 40 ? '...' : ''}"`;
            case 'gigi_response':
                return `🤖 رد Gigi على: "${event.data.userMessage.substring(0, 30)}..."`;
            case 'store_loaded':
                return `🏪 المتجر جاهز - ${event.data.productsCount} منتج`;
            default:
                return JSON.stringify(event.data);
        }
    }

    async generateEventCommentary(event) {
        // Get 1-2 random selected agents to comment
        const commentingAgents = this.getRandomAgents(1, 2);

        for (const agentId of commentingAgents) {
            await this.delay(300 + Math.random() * 700);
            const agent = AI_AGENTS.find(a => a.id === agentId);
            const comment = this.generateAgentEventComment(agent, event);
            this.displayAgentComment(event.id, agent, comment);
        }
    }

    getRandomAgents(min, max) {
        if (this.selectedAgents.size === 0) return [];

        const agents = Array.from(this.selectedAgents);
        const count = Math.min(Math.floor(Math.random() * (max - min + 1)) + min, agents.length);

        // Shuffle and take first 'count' items
        const shuffled = agents.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    generateAgentEventComment(agent, event) {
        const comments = {
            product_add: {
                gemi: `أرصد إضافة ${event.data.productName}. سأتتبع هذا في Analytics لمعرفة مسار التحويل.`,
                gp: `فرصة Upsell! العميل مهتم بـ ${event.data.productName} - اقترح منتجات مكملة.`,
                deep: `${event.data.productName} بسعر $${event.data.price} يتماشى مع الطلب في السوق الإماراتي.`,
                neo: `المنتج المضاف يحتاج visual showcase أقوى لزيادة رغبة الشراء.`,
                km: `هذا Node جديد! احتمال دعوة 3 أصدقاء = ${event.data.cartTotal * 3} Nodes محتملة.`,
                metaai: `منتج شائع! يمكن تحويله لـ Reel فيروسي بعنوان "كيف ${event.data.productName} حل مشكلتي"`,
                antig: `عملية ناجحة. السلة تحتوي ${event.data.cartTotal} منتج - احتمال Conversion: 67%`
            },
            cart_open: {
                gemi: `العميل فتح السلة بـ${event.data.itemsCount} منتج. هذه لحظة حرجة - نسبة التخلي 68%.`,
                gp: `Checkout funnel activated! طبّق urgency: "عرض لمدة محدودة" لتسريع القرار.`,
                deep: `قيمة السلة $${event.data.totalValue} - فوق المعدل! عميل ذو قيمة عالية.`,
                km: `${event.data.itemsCount} منتجات = فرصة لعرض bundle deal وزيادة AOV`,
                metaai: `اللحظة الذهبية! اعرض شهادة عميل أو review ل${event.data.itemsCount} المنتجات`,
                antig: `سلة بقيمة $${event.data.totalValue} تحتاج حماية: exit-intent popup + خصم 5%`
            },
            gigi_message_sent: {
                gemi: `رسالة للمتجر: "${event.data.message}". سأحللها لمعرفة النية والاهتمام.`,
                gp: `السؤال يكشف حاجة. Gigi يجب أن تقود للمنتج المناسب مباشرة.`,
                deep: `أسلوب السؤال يعكس مستوى الجدية. هذا عميل محتمل بنسبة عالية.`,
                km: `كل سؤال = data point. نبني ملف للعميل لتخصيص العروض المستقبلية.`,
                metaai: `الأسئلة الشائعة = محتوى! حوّلها لـ FAQ فيديو على TikTok`
            },
            store_loaded: {
                gemi: `المتجر محمّل بـ${event.data.productsCount} منتج. كل شيء جاهز للرصد.`,
                gp: `النظام online! جاهز لتحويل الزوار إلى عملاء.`,
                neo: `الواجهة البصرية تحمّلت. الانطباع الأول حاسم - تأكد من السرعة.`,
                km: `البداية. كل session هي فرصة لجمع insights وبناء الـ viral loop.`,
                antig: `منظومة Dodi Store 16 مفعلة. جميع العباقرة في وضع استعداد.`
            }
        };

        const eventComments = comments[event.type];
        if (eventComments && eventComments[agent.id]) {
            return eventComments[agent.id];
        }

        // Fallback generic comment
        return `${agent.responseStyle.prefix[0]} أرصد الحدث وأحلله من منظوري.`;
    }

    displayAgentComment(eventId, agent, comment) {
        const commentaryDiv = document.getElementById(`commentary-${eventId}`);
        if (!commentaryDiv) return;

        const commentEl = document.createElement('div');
        commentEl.className = 'ai-comment';
        commentEl.style.borderLeftColor = agent.color;
        commentEl.innerHTML = `
            <span class="comment-author" style="color: ${agent.color}">${agent.nickname}:</span>
            ${comment}
        `;

        commentaryDiv.appendChild(commentEl);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.geniusRoom = new GeniusRoom();
    console.log('🧠 Genius Room initialized - Dodi Store 16');
});
