import products from './data.js';

// Emit store loaded event
if (window.storeBridge) {
    window.storeBridge.emit('store_loaded', {
        timestamp: new Date().toISOString(),
        productsCount: products.length
    });
}

const dashboard = document.getElementById('dashboard');
const loadingState = document.getElementById('loading-state');
const productsContainer = document.getElementById('products-container');
const cartCount = document.getElementById('cart-count');
window.cart = [];

// Safety Fallback: Hide loading state if script fails or stays too long
setTimeout(() => {
    if (loadingState && loadingState.style.display !== 'none') {
        console.warn('⚠️ Loading taking too long, forcing display...');
        loadingState.style.display = 'none';
        if (productsContainer) productsContainer.classList.remove('hidden');
    }
}, 5000);


// Gigi Agent Logic: Simulate AI Initialization
function initGigiAgent() {
    try {
        setTimeout(() => {
            // Hide loading state
            if (loadingState) loadingState.style.display = 'none';

            // Show welcome message from Gigi
            if (dashboard) {
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'text-center mb-8 animate-fade-in';
                welcomeMsg.innerHTML = `
                    <div class="inline-block p-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
                        <img src="images/finalAvatar.webp" onerror="this.src='https://placehold.co/100/0a192f/00ccff?text=Gigi'" class="w-20 h-20 rounded-full border-4 border-gray-900" alt="Gigi">
                    </div>
                    <h3 class="text-3xl font-bold text-white mb-2">مرحباً، أنا <span class="text-cyan-400">جيجي</span></h3>
                    <p class="text-cyan-200">وكيلتك الذكية لإدارة الأصول الرقمية. إليك أحدث الحلول المختارة لك:</p>
                `;
                dashboard.prepend(welcomeMsg);
            }

            // Show products
            if (productsContainer) {
                productsContainer.classList.remove('hidden');
                renderProducts();
            }
        }, 2000);
    } catch (error) {
        console.error('❌ Failed to initialize Gigi:', error);
        if (window.storeBridge) window.storeBridge.emit('error', { context: 'initGigiAgent', message: error.message });
    }
}


function renderProducts() {
    productsContainer.innerHTML = products.map(product => `
        <div class="glass-panel rounded-xl p-5 hover:border-cyan-400 transition duration-300 group flex flex-col items-center text-center relative overflow-hidden">
            <div class="absolute inset-0 bg-cyan-900 opacity-0 group-hover:opacity-10 transition duration-500"></div>
            <img src="${product.image}" alt="${product.name}" class="w-full h-40 object-cover rounded-lg mb-4 opacity-80 group-hover:opacity-100 transition">
            <h4 class="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition">${product.name}</h4>
            <p class="text-gray-400 text-sm mb-4 h-12 overflow-hidden">${product.description}</p>
            <div class="flex justify-between items-center w-full mt-auto">
                <span class="text-2xl font-bold text-cyan-400 neon-green-text">${product.price} د.إ</span>
                <button onclick="window.addToCart(${product.id})" class="bg-transparent border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black px-4 py-2 rounded-full transition font-bold text-sm">

                    + إضافـة
                </button>
            </div>
        </div>
    `).join('');
}

window.addToCart = function (id) {
    const item = products.find(p => p.id === id);
    if (item) {
        window.cart.push(item);
        updateCartCount();
        showNotification(`تم إضافة "${item.name}" بنجاح`);


        // Emit event to Genius Room
        if (window.storeBridge) {
            window.storeBridge.emit('product_add', {
                productId: item.id,
                productName: item.name,
                price: item.price,
                cartTotal: window.cart.length,
                cartValue: window.cart.reduce((sum, p) => sum + parseFloat(p.price), 0)

            });
        }
    }
}

function updateCartCount() {
    cartCount.innerText = window.cart.length;
    cartCount.classList.add('animate-bounce');
    setTimeout(() => cartCount.classList.remove('animate-bounce'), 1000);
}


function showNotification(msg) {
    const notif = document.createElement('div');
    notif.className = 'fixed bottom-4 right-4 bg-cyan-900 text-white border border-cyan-500 px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
    notif.innerText = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

window.toggleCart = function () {
    const modal = document.getElementById('cart-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        updateCartUI();

        // Emit cart open event
        if (window.storeBridge) {
            window.storeBridge.emit('cart_open', {
                itemsCount: window.cart.length,
                totalValue: window.cart.reduce((sum, p) => sum + parseFloat(p.price), 0)
            });
        }

    } else {
        modal.classList.add('hidden');
    }
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (window.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-gray-400 text-center">السلة فارغة حالياً.</p>';
        return;
    }

    cartItemsContainer.innerHTML = window.cart.map((item, index) => `

        <div class="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
            <div class="text-right">
                <h5 class="text-white font-bold text-sm">${item.name}</h5>
                <span class="text-cyan-400 text-xs">${item.price} د.إ</span>
            </div>
            <button onclick="window.removeFromCart(${index})" class="text-red-400 hover:text-red-300 text-sm">حذف</button>
        </div>

    `).join('');
}

window.removeFromCart = function (index) {
    const removedItem = window.cart[index];
    window.cart.splice(index, 1);
    updateCartCount();
    updateCartUI();

    // Emit event to Genius Room
    if (window.storeBridge && removedItem) {
        window.storeBridge.emit('product_remove', {
            productName: removedItem.name,
            price: removedItem.price,
            cartTotal: window.cart.length
        });
    }
}


// Smart WhatsApp Checkout
window.checkout = function () {
    if (window.cart.length === 0) {
        showNotification("السلة فارغة! أضف منتجات أولاً.");
        return;
    }

    // 1. Calculate Totals
    const total = window.cart.reduce((sum, item) => sum + item.price, 0);
    const itemsList = window.cart.map((item, index) => `${index + 1}. ${item.name} (${item.price} د.إ)`).join('%0A');

    // 2. Format Message (URL Encoded)
    const message = `*مرحباً Dodi Store، أريد إتمام الطلب التالي:*%0A%0A` +
        `🛒 *المنتجات:*%0A${itemsList}%0A%0A` +
        `💰 *الإجمالي:* ${total} د.إ%0A%0A` +
        `يرجى تزويدي برابط الدفع أو طريقة التحويل. شكراً!`;

    // 3. Redirect to WhatsApp
    const phoneNumber = "971568986125";
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;

    // Visual Feedback
    showNotification("جاري تحويلك للواتساب لإتمام الطلب...");

    // Delay slightly for effect
    setTimeout(() => {
        window.open(whatsappUrl, '_blank');

        // Optional: Clear cart after successful redirect? 
        // Better to keep it in case they come back.
    }, 1500);
}


// Start the agent
initGigiAgent();

// --- Gigi Chatbot Logic ---

window.toggleChat = function () {
    const chatInterface = document.getElementById('chat-interface');
    chatInterface.classList.toggle('hidden');
    if (!chatInterface.classList.contains('hidden')) {
        document.getElementById('user-input').focus();
    }
}

window.handleEnter = function (event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

window.sendMessage = function () {
    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();
    if (message === "") return;

    // User Message
    addMessage(message, 'user');
    inputField.value = "";

    // Emit user message event
    if (window.storeBridge) {
        window.storeBridge.emit('gigi_message_sent', {
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    // Simulate Thinking
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing';
    typingIndicator.className = 'text-xs text-cyan-400 ml-4 mb-2 animate-pulse';
    typingIndicator.innerText = 'Gigi is thinking...';
    document.getElementById('chat-messages').appendChild(typingIndicator);

    // Auto Scroll
    scrollToBottom();

    // Robot Response
    setTimeout(() => {
        document.getElementById('typing').remove();
        const response = generateResponse(message);
        addMessage(response, 'bot');

        // Emit Gigi response event
        if (window.storeBridge) {
            window.storeBridge.emit('gigi_response', {
                userMessage: message,
                gigiResponse: response,
                timestamp: new Date().toISOString()
            });
        }
    }, 1000); // 1 second delay
}

function addMessage(text, sender) {
    const chatContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');

    if (sender === 'user') {
        msgDiv.className = 'bg-cyan-900 p-3 rounded-tl-lg rounded-bl-lg rounded-br-lg text-sm text-white ml-auto max-w-[80%]';
    } else {
        msgDiv.className = 'bg-gray-800 p-3 rounded-tr-lg rounded-bl-lg rounded-br-lg text-sm text-gray-200 mr-auto max-w-[80%]';
    }

    msgDiv.innerText = text;
    chatContainer.appendChild(msgDiv);
    scrollToBottom();
}

function scrollToBottom() {
    const chatContainer = document.getElementById('chat-messages');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Simple NLP Engine
// Gigi Chatbot Logic (Gulf Dialect Persona)
function generateResponse(input) {
    const lowerInput = input.toLowerCase();

    // 1. Greetings & Identity
    if (lowerInput.includes('مرحبا') || lowerInput.includes('هلا') || lowerInput.includes('السلام')) {
        return "هلا والله! منور المتجر ✨.. أنا جيجي، آمرني وش بخاطرك اليوم؟";
    }

    if (lowerInput.includes('من انت') || lowerInput.includes('who are you') || lowerInput.includes('جيجي') || lowerInput.includes('gigi')) {
        return "أنا جيجي (Gigi)، المساعدة الذكية هنا. أحول لك الطلبات المعقدة لحلول بسيطة بلمسة زر 😉.";
    }

    if (lowerInput.includes('ضحى') || lowerInput.includes('dodi')) {
        return "الغالية ضحى ❤️.. هي العقل المدبر وراء كل هذا الإبداع، ونحن هنا ننفذ رؤيتها.";
    }

    // 2. Pricing & "Expensive" Queries (Sales Handling)
    if (lowerInput.includes('سعر') || lowerInput.includes('بكم') || lowerInput.includes('price')) {
        return "الأسعار عندنا تبدأ من 550 د.إ، وكل شيء بقيمته وزيادة! خبرني وش مشروعك وأعطيك الزبدة.";
    }

    if (lowerInput.includes('غالي') || lowerInput.includes('expensive')) {
        return "الغالي للغالي 😉.. صدقني الاستثمار في الجودة يريحك قدام وتوفر على نفسك كثير.";
    }

    if (lowerInput.includes('بفكر') || lowerInput.includes('thinking')) {
        return "خذ وقتك أكيد، بس الفرص الذكية ما تنتظر كثير 🚀.. إذا عندك استفسار معين أنا موجودة.";
    }

    // 3. Product Specifics
    if (lowerInput.includes('أمن') || lowerInput.includes('security') || lowerInput.includes('هكر') || lowerInput.includes('اختراق')) {
        const product = products.find(p => p.id === 1);
        return `موضوع الحماية ما فيه لعب 🛡️.. أنصحك بـ "${product.name}" وسعره ${product.price} د.إ. يحميك ويحمي شغلك.`;
    }

    if (lowerInput.includes('موقع') || lowerInput.includes('ويب') || lowerInput.includes('web') || lowerInput.includes('برمجة')) {
        const product = products.find(p => p.id === 3);
        return `تبي موقع يواجه؟ مالك إلا "${product.name}" بـ ${product.price} د.إ. شغل احترافي من الآخر.`;
    }

    if (lowerInput.includes('بوت') || lowerInput.includes('bot') || lowerInput.includes('شات') || lowerInput.includes('chat')) {
        return "تبي مثلي؟ 😎 عندنا خدمات تطوير شات بوت ذكية تخدم عملاءك 24 ساعة.";
    }

    // 4. Default / Menu Fallback
    return "سؤال جميل بس يبي له تفصيل 🤔.. وش رأيك تشوف قسم 'الحلول الذكية' فوق؟ أو اضغط على أيقونة الواتساب ونتفاهم هناك أسرع.";
}

