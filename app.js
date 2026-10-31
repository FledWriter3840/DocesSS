/* ============================================================
   DocesSS — Application Logic
   Single Page Application with category filtering, instant search,
   product details modal, cart management, and order submission.
   ============================================================ */

// ==================== PRODUCT CATALOG ====================
const PRODUCTS = [
    {
        id: 'mousse-abacaxi',
        name: 'Mousse de Abacaxi',
        category: 'mousses',
        description: 'Mousse cremoso com o frescor tropical do abacaxi em pedaços e raspas delicadas.',
        price: 5.00,
        sizes: [
            { volume: 140, price: 5.00 },
            { volume: 250, price: 10.00 }
        ],
        image: 'images/mousse_abacaxi.jpg',
        badge: 'Popular',
        unit: 'unidade'
    },
    {
        id: 'mousse-limao',
        name: 'Mousse de Limão',
        category: 'mousses',
        description: 'Mousse suave e refrescante de limão siciliano com toque cítrico equilibrado.',
        price: 5.00,
        sizes: [
            { volume: 140, price: 5.00 },
            { volume: 250, price: 10.00 }
        ],
        image: 'images/mousse_limao.jpg',
        badge: null,
        unit: 'unidade'
    },
    {
        id: 'mousse-maracuja',
        name: 'Mousse de Maracujá',
        category: 'mousses',
        description: 'Mousse aveludado de maracujá com calda artesanal da fruta e sementes crocantes.',
        price: 5.00,
        sizes: [
            { volume: 140, price: 5.00 },
            { volume: 250, price: 10.00 }
        ],
        image: 'images/mousse_maracuja.jpg',
        badge: 'Favorito',
        unit: 'unidade'
    },
    {
        id: 'bombom-oreo',
        name: 'Bombom de Oreo',
        category: 'bombons',
        description: 'Bombom artesanal recheado com creme de Oreo triturado e coberto com chocolate nobre.',
        price: 5.00,
        image: 'images/bombom_oreo.jpg',
        badge: 'Novo',
        unit: 'unidade'
    }
];

// ==================== EMAIL & WHATSAPP CONFIG ====================
// Preencha os IDs do EmailJS; configure o destinatário fixo no modelo do serviço.
const CONFIG = {
    whatsappNumber: '551195530849', // Substitua pelo seu WhatsApp (com DDI e DDD)
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID',
    publicKey: 'YOUR_PUBLIC_KEY'
};

// ==================== STATE ====================
const cart = {}; // { product key: quantity }
const selectedMousseSizes = {};
let currentCategory = 'todos';
let searchQuery = '';

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    setupPhoneMask();
    updateCartDisplay();
});

// ==================== PRODUCT RENDERING ====================
function getFilteredProducts() {
    return PRODUCTS.filter(product => {
        const matchesCategory = currentCategory === 'todos' || product.category === currentCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    const emptyMsg = document.getElementById('products-empty');
    if (!grid) return;

    grid.innerHTML = '';
    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    filtered.forEach((product) => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.id = `card-${product.id}`;

    const badgeHtml = product.badge
        ? `<span class="product-card__badge">${product.badge}</span>`
        : '';

    const mousseSize = getSelectedMousseSize(product.id);
    const price = getProductPrice(product, mousseSize);
    const qty = cart[getCartItemKey(product.id, mousseSize)] || 0;

    let actionButtonsHtml = '';
    if (qty === 0) {
        actionButtonsHtml = `
            <button class="btn btn--add" onclick="addToCart('${product.id}')">
                Adicionar
            </button>
            <button class="btn btn--details" onclick="openModal('${product.id}')">
                Ver Detalhes
            </button>
        `;
    } else {
        actionButtonsHtml = `
            <div class="qty-row">
                <button class="qty-btn" onclick="removeFromCart('${product.id}')" aria-label="Diminuir">−</button>
                <span class="qty-value">${qty}</span>
                <button class="qty-btn" onclick="addToCart('${product.id}')" aria-label="Aumentar">+</button>
            </div>
            <button class="btn btn--details" onclick="openModal('${product.id}')">
                Ver Detalhes
            </button>
        `;
    }

    card.innerHTML = `
        <div class="product-card__image-wrap">
            <img src="${product.image}" alt="${product.name}" class="product-card__image" loading="lazy">
            ${badgeHtml}
        </div>
        <div class="product-card__body">
            <h3 class="product-card__name">${product.name}</h3>
            ${product.sizes ? `
                <label class="product-card__size-label" for="size-${product.id}">Tamanho do pote</label>
                <select class="product-card__size-select" id="size-${product.id}" onchange="selectMousseSize('${product.id}', this.value)">
                    ${product.sizes.map(size => `<option value="${size.volume}" ${size.volume === Number(mousseSize) ? 'selected' : ''}>Pote ${size.volume} ml</option>`).join('')}
                </select>
            ` : ''}
            <div class="product-card__price-tag" id="price-tag-${product.id}">${product.sizes ? `R$ ${formatPrice(price)} / pote` : `R$ ${formatPrice(product.price)}/${product.unit === 'unidade' ? 'un' : product.unit}`}</div>
            <p class="product-card__desc">${product.description}</p>
            <div class="product-card__price-big" id="price-${product.id}">R$ ${formatPrice(price)}</div>
            <div class="product-card__actions" id="actions-${product.id}">
                ${actionButtonsHtml}
            </div>
        </div>
    `;

    return card;
}

function updateProductCardAction(productId) {
    const container = document.getElementById(`actions-${productId}`);
    if (!container) return;

    const product = findProduct(productId);
    if (!product) return;

    const qty = cart[getCartItemKey(productId)] || 0;
    if (qty === 0) {
        container.innerHTML = `
            <button class="btn btn--add" onclick="addToCart('${productId}')">
                Adicionar
            </button>
            <button class="btn btn--details" onclick="openModal('${productId}')">
                Ver Detalhes
            </button>
        `;
    } else {
        container.innerHTML = `
            <div class="qty-row">
                <button class="qty-btn" onclick="removeFromCart('${productId}')" aria-label="Diminuir">−</button>
                <span class="qty-value">${qty}</span>
                <button class="qty-btn" onclick="addToCart('${productId}')" aria-label="Aumentar">+</button>
            </div>
            <button class="btn btn--details" onclick="openModal('${productId}')">
                Ver Detalhes
            </button>
        `;
    }
}

function getSelectedMousseSize(productId) {
    return selectedMousseSizes[productId] || '140';
}

function getCartItemKey(productId, size = getSelectedMousseSize(productId)) {
    const product = findProduct(productId);
    return product && product.sizes ? `${productId}:${size}` : productId;
}

function getProductPrice(product, size) {
    if (!product.sizes) return product.price;
    const selectedSize = product.sizes.find(option => option.volume === Number(size));
    return selectedSize ? selectedSize.price : product.sizes[0].price;
}

function selectMousseSize(productId, size) {
    selectedMousseSizes[productId] = size;

    const product = findProduct(productId);
    if (!product || !product.sizes) return;

    const price = getProductPrice(product, size);
    const priceTag = document.getElementById(`price-tag-${productId}`);
    const priceElement = document.getElementById(`price-${productId}`);
    if (priceTag) priceTag.textContent = `R$ ${formatPrice(price)} / pote`;
    if (priceElement) priceElement.textContent = `R$ ${formatPrice(price)}`;
    updateProductCardAction(productId);
}

// ==================== FILTER & SEARCH ====================
function filterCategory(category, buttonEl) {
    currentCategory = category;

    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('category-tab--active');
    });
    if (buttonEl) {
        buttonEl.classList.add('category-tab--active');
    }

    renderProducts();
}

function searchProducts(value) {
    searchQuery = value.trim();
    renderProducts();
}

// ==================== MODAL DE DETALHES ====================
function openModal(productId) {
    const product = findProduct(productId);
    if (!product) return;

    const overlay = document.getElementById('modal-overlay');
    const img = document.getElementById('modal-image');
    const name = document.getElementById('modal-name');
    const desc = document.getElementById('modal-desc');
    const price = document.getElementById('modal-price');
    const addBtn = document.getElementById('modal-add-btn');

    img.src = product.image;
    img.alt = product.name;
    name.textContent = product.name;
    desc.textContent = product.description;
    const size = getSelectedMousseSize(product.id);
    const productPrice = getProductPrice(product, size);
    price.textContent = product.sizes
        ? `Pote ${size} ml — R$ ${formatPrice(productPrice)}`
        : `R$ ${formatPrice(productPrice)} por ${product.unit}`;

    addBtn.onclick = () => {
        addToCart(product.id);
        closeModal();
    };

    overlay.classList.add('modal-overlay--open');
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('modal-overlay--open');
    }
}

// ==================== CART MANAGEMENT ====================
function addToCart(productId) {
    const cartItemKey = getCartItemKey(productId);
    cart[cartItemKey] = (cart[cartItemKey] || 0) + 1;
    updateProductCardAction(productId);
    updateCartDisplay();
    showToast('Adicionado ao carrinho! 🍰');
}

function removeFromCart(productId) {
    const cartItemKey = getCartItemKey(productId);
    if (!cart[cartItemKey]) return;

    if (cart[cartItemKey] > 1) {
        cart[cartItemKey]--;
    } else {
        delete cart[cartItemKey];
    }

    updateProductCardAction(productId);
    updateCartDisplay();
}

function clearCart() {
    Object.keys(cart).forEach(id => {
        delete cart[id];
    });
    PRODUCTS.forEach(product => updateProductCardAction(product.id));
    updateCartDisplay();
    showToast('Carrinho esvaziado! 🗑️');
}

function getCartTotals() {
    let totalItems = 0;
    let totalPrice = 0;

    Object.entries(cart).forEach(([cartItemKey, qty]) => {
        const [id, size] = cartItemKey.split(':');
        const product = findProduct(id);
        if (product) {
            totalItems += qty;
            totalPrice += getProductPrice(product, size) * qty;
        }
    });

    return { totalItems, totalPrice };
}

function updateCartDisplay() {
    const { totalItems, totalPrice } = getCartTotals();

    // Top navbar count
    const navCount = document.getElementById('navbar-cart-count');
    if (navCount) navCount.textContent = totalItems;

    // Bottom fixed cart bar
    const cartBar = document.getElementById('cart-bar');
    const barCount = document.getElementById('cart-bar-count');
    const barTotal = document.getElementById('cart-bar-total');

    if (cartBar) {
        const menuPage = document.getElementById('page-menu');
        const isMenuActive = menuPage && menuPage.classList.contains('page--active');

        if (totalItems > 0 && isMenuActive) {
            cartBar.style.display = 'block';
            if (barCount) barCount.textContent = totalItems;
            if (barTotal) barTotal.textContent = formatPrice(totalPrice);
        } else {
            cartBar.style.display = 'none';
        }
    }
}

function findProduct(id) {
    return PRODUCTS.find(p => p.id === id);
}

// ==================== CHECKOUT REVIEW ====================
function renderOrderReview() {
    const container = document.getElementById('order-review-items');
    const totalEl = document.getElementById('review-total');
    if (!container || !totalEl) return;

    container.innerHTML = '';
    const { totalPrice } = getCartTotals();

    Object.entries(cart).forEach(([cartItemKey, qty]) => {
        const [id, size] = cartItemKey.split(':');
        const product = findProduct(id);
        if (!product) return;

        const itemPrice = getProductPrice(product, size);
        const subtotal = itemPrice * qty;
        const itemName = product.sizes ? `${product.name} (pote ${size} ml)` : product.name;
        const row = document.createElement('div');
        row.className = 'checkout__item';
        row.innerHTML = `
            <div>
                <span class="checkout__item-name">${itemName}</span>
                <span class="checkout__item-qty"> — R$ ${formatPrice(itemPrice)}</span>
                <span class="checkout__item-qty"> × ${qty}</span>
            </div>
            <span class="checkout__item-price">R$ ${formatPrice(subtotal)}</span>
        `;
        container.appendChild(row);
    });

    totalEl.textContent = formatPrice(totalPrice);
}

// ==================== ORDER SUBMISSION ====================
async function submitOrder(event) {
    event.preventDefault();

    if (typeof emailjs === 'undefined') {
        showToast('Não foi possível carregar o serviço de e-mail. Verifique sua conexão e tente novamente.');
        return;
    }

    if (
        CONFIG.serviceId === 'YOUR_SERVICE_ID' ||
        CONFIG.templateId === 'YOUR_TEMPLATE_ID' ||
        CONFIG.publicKey === 'YOUR_PUBLIC_KEY'
    ) {
        showToast('Configure o EmailJS para habilitar o envio automático.');
        return;
    }

    const name = document.getElementById('input-name').value.trim();
    const phone = document.getElementById('input-phone').value.trim();
    const obs = document.getElementById('input-obs').value.trim();
    const submitBtn = document.getElementById('btn-submit');

    const { totalItems, totalPrice } = getCartTotals();

    if (totalItems === 0) {
        showToast('Seu carrinho está vazio! 🛒');
        return;
    }

    if (!name || !phone) {
        showToast('Preencha os campos obrigatórios! ⚠️');
        return;
    }

    const orderId = generateOrderId();
    const orderLines = [];

    Object.entries(cart).forEach(([cartItemKey, qty]) => {
        const [id, size] = cartItemKey.split(':');
        const p = findProduct(id);
        if (p) {
            const itemPrice = getProductPrice(p, size);
            const itemName = p.sizes ? `${p.name} (pote ${size} ml)` : p.name;
            orderLines.push(`• ${itemName} × ${qty} = R$ ${formatPrice(itemPrice * qty)}`);
        }
    });

    const fullMessage = `
*NOVO PEDIDO - DocesSS*
*Pedido #${orderId}*
-----------------------------
*Itens:*
${orderLines.join('\n')}

*Total:* R$ ${formatPrice(totalPrice)} (${totalItems} itens)
-----------------------------
*Cliente:* ${name}
*Telefone:* ${phone}
${obs ? `*Observações:* ${obs}` : ''}
*Data:* ${new Date().toLocaleString('pt-BR')}
    `.trim();

    submitBtn.classList.add('btn--loading');
    submitBtn.disabled = true;

    try {
        await emailjs.send(CONFIG.serviceId, CONFIG.templateId, {
            from_name: name,
            phone,
            order_id: orderId,
            order_details: orderLines.join('\n'),
            total: `R$ ${formatPrice(totalPrice)}`,
            observations: obs || 'Nenhuma',
            message: fullMessage
        }, {
            publicKey: CONFIG.publicKey
        });

        saveOrderLocally({
            id: orderId,
            name,
            phone,
            obs,
            items: { ...cart },
            total: totalPrice,
            date: new Date().toISOString()
        });

        // Exibe tela de confirmação
        document.getElementById('confirm-name').textContent = name;
        document.getElementById('confirm-phone').textContent = phone;
        document.getElementById('confirm-order-id').textContent = orderId;
        document.getElementById('confirm-title').textContent = 'Pedido enviado!';
        document.getElementById('confirm-status').textContent = 'O serviço de e-mail aceitou o pedido. Confira sua caixa de entrada e a pasta de spam.';

        navigateTo('page-confirmation');
        showToast('Pedido enviado por e-mail! 🎉');

    } catch (err) {
        console.error(err);
        showToast('Não foi possível enviar o pedido. Confira a configuração do EmailJS e tente novamente.');
    } finally {
        submitBtn.classList.remove('btn--loading');
        submitBtn.disabled = false;
    }
}

// ==================== STORAGE & NAVIGATION ====================
function saveOrderLocally(order) {
    try {
        const orders = JSON.parse(localStorage.getItem('docesss_orders') || '[]');
        orders.push(order);
        localStorage.setItem('docesss_orders', JSON.stringify(orders));
    } catch (e) {
        console.error(e);
    }
}

function navigateTo(pageId) {
    const target = document.getElementById(pageId);
    if (!target) return;

    if (pageId === 'page-checkout') {
        const { totalItems } = getCartTotals();
        if (totalItems === 0) {
            showToast('Adicione itens antes de finalizar! 🛒');
            return;
        }
        renderOrderReview();
    }

    target.scrollTop = 0;

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('page--active');
    });

    setTimeout(() => {
        target.classList.add('page--active');
        updateCartDisplay();
    }, 40);
}

function resetAndGoHome() {
    clearCart();
    const form = document.getElementById('checkout-form');
    if (form) form.reset();
    navigateTo('page-landing');
}

function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==================== HELPERS ====================
function formatPrice(val) {
    return Number(val).toFixed(2).replace('.', ',');
}

function generateOrderId() {
    const d = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `${d}-${rand}`;
}

function showToast(msg) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setupPhoneMask() {
    const phone = document.getElementById('input-phone');
    if (!phone) return;

    phone.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 6) {
            v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        } else if (v.length > 2) {
            v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        } else if (v.length > 0) {
            v = `(${v}`;
        }
        e.target.value = v;
    });
}
