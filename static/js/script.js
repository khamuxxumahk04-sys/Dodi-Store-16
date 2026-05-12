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
                        <img src="/static/images/finalAvatar.webp" onerror="this.src='https://placehold.co/100/0a192f/00ccff?text=Gigi'" class="w-20 h-20 rounded-full border-4 border-gray-900" alt="Gigi">
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
        }, 500);
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
    const itemsList = window.cart.map((item, index) => `${index + 1}. ${item.name} (${item.price} د.إ)`).join('\n');

    // 2. Format Message
    const message = encodeURIComponent(`*مرحباً Dodi Store، أريد إتمام الطلب التالي:* \n\n` +
        `🛒 *المنتجات:* \n${itemsList} \n\n` +
        `💰 *الإجمالي:* ${total} د.إ \n\n` +
        `يرجى تزويدي برابط الدفع أو طريقة التحويل. شكراً!`);

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

// Start the agent
initGigiAgent();

