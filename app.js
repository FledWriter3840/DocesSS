/* ============================================================
   DocesSS — Application Logic
   Scalable SPA with product catalog, cart, and order system
   ============================================================ */

// ==================== PRODUCT DATA (EASILY SCALABLE) ====================
// To add new products, simply add an object to the appropriate category array.
// The system automatically renders cards and handles cart logic.

const PRODUCTS = {
    mousses: [
        {
            id: 'mousse-abacaxi',
            name: 'Mousse de Abacaxi',
            description: 'Mousse cremoso com o frescor tropical do abacaxi, feito com ingredientes selecionados.',
            price: 12.00,
            image: 'images/mousse_abacaxi.jpg',
            badge: 'Popular',
            unit: 'unidade'
        },
        {
            id: 'mousse-limao',
            name: 'Mousse de Limão',
            description: 'Mousse suave e refrescante de limão com toque cítrico irresistível.',
            price: 12.00,
            image: 'images/mousse_limao.jpg',
            badge: null,
            unit: 'unidade'
        },
        {
            id: 'mousse-maracuja',
            name: 'Mousse de Maracujá',
            description: 'Mousse aveludado de maracujá com a intensidade da fruta da paixão.',
            price: 12.00,
            image: 'images/mousse_maracuja.jpg',
            badge: 'Favorito',
            unit: 'unidade'
        }
    ],
    bombons: [
        {
            id: 'bombom-oreo',
            name: 'Bombom de Oreo',
            description: 'Bombom artesanal com recheio cremoso de Oreo coberto com chocolate belga.',
            price: 5.00,
            image: 'images/bombom_oreo.jpg',
            badge: 'Novo',
            unit: 'unidade'
        }
    ]
    // ────────────────────────────────────────
    // PARA ADICIONAR NOVA CATEGORIA:
    // novaCategoria: [
    //     { id: 'id-unico', name: 'Nome', description: '...', price: 10, image: 'images/xxx.jpg', badge: null, unit: 'unidade' }
    // ]
    // E adicione no HTML um novo bloco <div class="menu-category"> com id correspondente
    // ────────────────────────────────────────
};

// ==================== EMAIL CONFIG ====================
// Uses EmailJS for sending orders. Replace with your EmailJS credentials.
const EMAIL_CONFIG = {
    serviceId: 'YOUR_SERVICE_ID',      // Replace with your EmailJS Service ID
    templateId: 'YOUR_TEMPLATE_ID',    // Replace with your EmailJS Template ID
    publicKey: 'YOUR_PUBLIC_KEY',       // Replace with your EmailJS Public Key
    recipientEmail: 'your@email.com'   // Replace with your email
};

// ==================== STATE ====================
const cart = {};  // { productId: quantity }

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    createParticles();
    setupPhoneMask();
});

// ==================== PRODUCT RENDERING ====================
function renderProducts() {
    Object.entries(PRODUCTS).forEach(([category, products]) => {
        const grid = document.getElementById(`grid-${category}`);
        if (!grid) return;

        products.forEach((product, index) => {
            const card = createProductCard(product, index);
            grid.appendChild(card);
        });
    });
}

function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${index * 0.1}s`;
    card.id = `card-${product.id}`;

    const badgeHtml = product.badge
        ? `<span class="product-card__badge">${product.badge}</span>`
        : '';

    card.innerHTML = `
        <div class="product-card__image-wrap">
            <img src="${product.image}" alt="${product.name}" class="product-card__image" loading="lazy">
            ${badgeHtml}
        </div>
        <div class="product-card__body">
            <h3 class="product-card__name">${product.name}</h3>
            <p class="product-card__desc">${product.description}</p>
            <div class="product-card__footer">
                <div class="product-card__price">
                    R$ ${formatPrice(product.price)}
                    <small>por ${product.unit}</small>
                </div>
                <div id="action-${product.id}">
                    <button class="btn-add-cart" onclick="addToCart('${product.id}')">
                        <span>+</span> Adicionar
                    </button>
                </div>
            </div>
        </div>
    `;

    return card;
}

// ==================== CART MANAGEMENT ====================
function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    updateProductAction(productId);
    updateCartSummary();
    showToast(`Adicionado ao pedido! 🎉`);
}

function removeFromCart(productId) {
    if (cart[productId] > 1) {
        cart[productId]--;
    } else {
        delete cart[productId];
    }
    updateProductAction(productId);
    updateCartSummary();
}

function updateProductAction(productId) {
    const actionContainer = document.getElementById(`action-${productId}`);
    if (!actionContainer) return;

    const qty = cart[productId] || 0;

    if (qty === 0) {
        actionContainer.innerHTML = `
            <button class="btn-add-cart" onclick="addToCart('${productId}')">
                <span>+</span> Adicionar
            </button>
        `;
    } else {
        actionContainer.innerHTML = `
            <div class="qty-control">
                <button class="qty-control__btn" onclick="removeFromCart('${productId}')">−</button>
                <span class="qty-control__value">${qty}</span>
                <button class="qty-control__btn" onclick="addToCart('${productId}')">+</button>
            </div>
        `;
    }
}

function updateCartSummary() {
    const summaryEl = document.getElementById('cart-summary');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');

    const { totalItems, totalPrice } = getCartTotals();

    if (totalItems === 0) {
        summaryEl.style.display = 'none';
    } else {
        summaryEl.style.display = 'block';
        countEl.textContent = totalItems;
        totalEl.textContent = formatPrice(totalPrice);
    }
}

function getCartTotals() {
    let totalItems = 0;
    let totalPrice = 0;

    Object.entries(cart).forEach(([productId, qty]) => {
        const product = findProduct(productId);
        if (product) {
            totalItems += qty;
            totalPrice += product.price * qty;
        }
    });

    return { totalItems, totalPrice };
}

function findProduct(productId) {
    for (const category of Object.values(PRODUCTS)) {
        const found = category.find(p => p.id === productId);
        if (found) return found;
    }
    return null;
}

// ==================== ORDER REVIEW ====================
function renderOrderReview() {
    const container = document.getElementById('order-review-items');
    const totalEl = document.getElementById('review-total');
    container.innerHTML = '';

    let total = 0;

    Object.entries(cart).forEach(([productId, qty]) => {
        const product = findProduct(productId);
        if (!product) return;

        const subtotal = product.price * qty;
        total += subtotal;

        const item = document.createElement('div');
        item.className = 'order-review__item';
        item.innerHTML = `
            <div>
                <span class="order-review__item-name">${product.name}</span>
                <span class="order-review__item-qty"> × ${qty}</span>
            </div>
            <span class="order-review__item-price">R$ ${formatPrice(subtotal)}</span>
        `;
        container.appendChild(item);
    });

    totalEl.textContent = formatPrice(total);
}

// ==================== ORDER SUBMISSION ====================
async function submitOrder(event) {
    event.preventDefault();

    const name = document.getElementById('input-name').value.trim();
    const phone = document.getElementById('input-phone').value.trim();
    const obs = document.getElementById('input-obs').value.trim();
    const btn = document.getElementById('btn-submit-order');

    if (!name || !phone) {
        showToast('Preencha todos os campos obrigatórios! ⚠️');
        return;
    }

    // Build order details
    const orderId = generateOrderId();
    const { totalItems, totalPrice } = getCartTotals();
    const orderLines = [];

    Object.entries(cart).forEach(([productId, qty]) => {
        const product = findProduct(productId);
        if (product) {
            orderLines.push(`• ${product.name} × ${qty} = R$ ${formatPrice(product.price * qty)}`);
        }
    });

    const orderText = orderLines.join('\n');
    const fullMessage = `
═══════════════════════════
   NOVO PEDIDO - DocesSS
   Pedido #${orderId}
═══════════════════════════

📋 ITENS:
${orderText}

💰 TOTAL: R$ ${formatPrice(totalPrice)}
📦 Quantidade: ${totalItems} itens

👤 CLIENTE: ${name}
📱 TELEFONE: ${phone}
${obs ? `📝 OBS: ${obs}` : ''}

📅 Data: ${new Date().toLocaleString('pt-BR')}
═══════════════════════════
    `.trim();

    // Show loading state
    btn.classList.add('btn--loading');
    btn.disabled = true;

    try {
        // Try EmailJS if configured
        if (EMAIL_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY' && typeof emailjs !== 'undefined') {
            await emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, {
                to_email: EMAIL_CONFIG.recipientEmail,
                from_name: name,
                phone: phone,
                order_id: orderId,
                order_details: orderText,
                total: `R$ ${formatPrice(totalPrice)}`,
                observations: obs || 'Nenhuma',
                message: fullMessage
            });
        } else {
            // Fallback: use mailto link and also log order
            console.log('📧 PEDIDO RECEBIDO:');
            console.log(fullMessage);

            // Store order locally
            saveOrderLocally({
                id: orderId,
                name,
                phone,
                obs,
                items: { ...cart },
                total: totalPrice,
                date: new Date().toISOString(),
                message: fullMessage
            });

            // Open mailto as fallback
            const subject = encodeURIComponent(`Novo Pedido #${orderId} - DocesSS`);
            const body = encodeURIComponent(fullMessage);
            const mailtoLink = `mailto:${EMAIL_CONFIG.recipientEmail}?subject=${subject}&body=${body}`;

            // Create a hidden link and click it
            const a = document.createElement('a');
            a.href = mailtoLink;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        // Show confirmation
        document.getElementById('confirm-name').textContent = name;
        document.getElementById('confirm-phone').textContent = phone;
        document.getElementById('confirm-order-id').textContent = orderId;

        navigateTo('page-confirmation');
        showToast('Pedido enviado com sucesso! ✅');

    } catch (error) {
        console.error('Erro ao enviar pedido:', error);
        showToast('Erro ao enviar. Tente novamente! ❌');
    } finally {
        btn.classList.remove('btn--loading');
        btn.disabled = false;
    }
}

// ==================== LOCAL STORAGE ====================
function saveOrderLocally(order) {
    try {
        const orders = JSON.parse(localStorage.getItem('docesss_orders') || '[]');
        orders.push(order);
        localStorage.setItem('docesss_orders', JSON.stringify(orders));
    } catch (e) {
        console.error('Erro ao salvar pedido localmente:', e);
    }
}

function getLocalOrders() {
    try {
        return JSON.parse(localStorage.getItem('docesss_orders') || '[]');
    } catch (e) {
        return [];
    }
}

// ==================== NAVIGATION ====================
function navigateTo(pageId) {
    // Scroll to top of the target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.scrollTop = 0;
    }

    // If going to checkout, render order review
    if (pageId === 'page-checkout') {
        const { totalItems } = getCartTotals();
        if (totalItems === 0) {
            showToast('Adicione itens ao pedido primeiro! 🛒');
            return;
        }
        renderOrderReview();
    }

    // Animate pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('page--active');
    });

    setTimeout(() => {
        if (targetPage) {
            targetPage.classList.add('page--active');
        }
    }, 50);
}

function resetAndGoHome() {
    // Clear cart
    Object.keys(cart).forEach(key => delete cart[key]);

    // Reset all product actions
    Object.values(PRODUCTS).flat().forEach(product => {
        updateProductAction(product.id);
    });

    // Reset form
    document.getElementById('checkout-form').reset();

    // Update cart summary
    updateCartSummary();

    // Navigate home
    navigateTo('page-landing');
}

// ==================== UTILITIES ====================
function formatPrice(value) {
    return value.toFixed(2).replace('.', ',');
}

function generateOrderId() {
    const now = new Date();
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 9000 + 1000);
    return `${datePart}-${randomPart}`;
}

function showToast(message) {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ==================== PHONE MASK ====================
function setupPhoneMask() {
    const phoneInput = document.getElementById('input-phone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 6) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }

        e.target.value = value;
    });
}

// ==================== PARTICLES ====================
function createParticles() {
    const container = document.getElementById('particles-bg');
    if (!container) return;

    const colors = [
        'rgba(248, 59, 108, 0.3)',
        'rgba(212, 160, 18, 0.25)',
        'rgba(255, 160, 184, 0.2)',
        'rgba(249, 197, 58, 0.2)',
    ];

    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 6 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 15;
        const left = Math.random() * 100;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            left: ${left}%;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
            box-shadow: 0 0 ${size * 2}px ${color};
        `;

        container.appendChild(particle);
    }
}
