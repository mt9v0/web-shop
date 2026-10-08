const products = [
  { id: 1, title: 'Футболка MONEY TALKS',      price: 6700, img: 'images/1.jpeg' },
  { id: 2, title: 'Футболка МАСТУР БАТЫР',     price: 1600, img: 'images/2.jpeg' },
  { id: 3, title: 'Футболка Baddie',   price: 5200, img: 'images/3.jpeg' },
  { id: 4, title: 'Футболка HELLO KITTY',              price: 2800, img: 'images/4.png' },
  { id: 5, title: 'Футболка DEUTCH BRAT',          price: 4900, img: 'images/5.jpeg' },
  { id: 6, title: 'Футболка GOLDEN RULES',              price: 2200, img: 'images/6.jpeg' },
  { id: 7, title: 'Футболка БОЛЬШИЕ ДИСКИ',          price: 2420, img: 'images/7.png' },
  { id: 8, title: 'Пикми Джерси',   price: 6900, img: 'images/8.png' },
  { id: 9, title: 'Футболка CHECHNYA',   price: 5000, img: 'images/9.jpeg' }
];

const STORAGE_KEY = 'cart';
let cart = loadCart();

const productListEl = document.getElementById('product-list');
const cartItemsEl   = document.getElementById('cart-items');
const cartTotalEl   = document.getElementById('cart-total');
const cartCountEl   = document.getElementById('cart-count');
const cartSectionEl = document.getElementById('cart-section');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const checkoutBtn   = document.getElementById('checkout-btn');
const modalOverlay  = document.getElementById('modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const orderForm     = document.getElementById('order-form');
const successMsg    = document.getElementById('order-success-msg');

const formatPrice = (n) => n.toLocaleString('ru-RU');
const findProduct = (id) => products.find((p) => p.id === id);

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item) => findProduct(item.id) && Number.isInteger(item.count) && item.count > 0
    );
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function init() {
  renderProducts();
  renderCart();
  setupEventListeners();
}

function renderProducts() {
  productListEl.innerHTML = products.map((product) => `
    <article class="product-card">
      <div class="product-card__media">
        <img class="product-card__img" src="${product.img}" alt="${product.title}" loading="lazy">
      </div>
      <div class="product-card__info">
        <h3 class="product-card__title">${product.title}</h3>
        <p class="product-card__price">${formatPrice(product.price)} ₽</p>
      </div>
      <button class="btn" type="button" data-add="${product.id}">Добавить в корзину</button>
    </article>
  `).join('');
}

function updateProductActions(productId) {
    const card = productListEl.querySelector(`[data-add="${productId}"], [data-inc="${productId}"]`);
  if (!card) return;
  const cardEl = card.closest('.product-card');
  if (!cardEl) return;

  const product = findProduct(productId);
  const inCart = getCartItem(productId);
  const actionsEl = cardEl.querySelector('.product-card__actions');
  actionsEl.innerHTML = renderProductActions(product, inCart);
}
function addToCart(productId) {
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.count += 1;
  } else {
    cart.push({ id: productId, count: 1 });
  }

  saveCart();
  renderCart();
}

function changeCount(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  item.count += delta;

  if (item.count <= 0) {
    cart = cart.filter((i) => i.id !== productId);
  }

  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  renderCart();
}

function renderCart() {
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="empty-msg">Корзина пуста</p>';
    checkoutBtn.disabled = true;
    cartTotalEl.textContent = '0';
    cartCountEl.textContent = '0';
    return;
  }

  checkoutBtn.disabled = false;

  let totalSum = 0;
  let totalCount = 0;

  cartItemsEl.innerHTML = cart.map((item) => {
    const product = findProduct(item.id);
    const itemTotal = product.price * item.count;
    totalSum += itemTotal;
    totalCount += item.count;

    return `
      <div class="cart-item">
        <div class="cart-item__info">
          <div class="cart-item__name">${product.title}</div>
          <div class="cart-item__price">${formatPrice(itemTotal)} ₽</div>
        </div>
        <div class="cart-item__controls">
          <button class="cart-item__btn" type="button" data-dec="${item.id}" aria-label="Уменьшить количество">−</button>
          <span class="cart-item__qty">${item.count}</span>
          <button class="cart-item__btn" type="button" data-inc="${item.id}" aria-label="Увеличить количество">+</button>
          <button class="cart-item__btn cart-item__remove" type="button" data-remove="${item.id}" aria-label="Удалить товар из корзины">×</button>
        </div>
      </div>
    `;
  }).join('');

  cartTotalEl.textContent = formatPrice(totalSum);
  cartCountEl.textContent = totalCount;
}

function openModal() {
  modalOverlay.classList.remove('hidden');
  successMsg.classList.add('hidden');
  orderForm.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

function setupEventListeners() {
  document.addEventListener('click', (e) => {
    const addBtn    = e.target.closest('[data-add]');
    const incBtn    = e.target.closest('[data-inc]');
    const decBtn    = e.target.closest('[data-dec]');
    const removeBtn = e.target.closest('[data-remove]');

    if (addBtn)    addToCart(Number(addBtn.dataset.add));
    if (incBtn)    changeCount(Number(incBtn.dataset.inc), 1);
    if (decBtn)    changeCount(Number(decBtn.dataset.dec), -1);
    if (removeBtn) removeFromCart(Number(removeBtn.dataset.remove));
  });

  cartToggleBtn.addEventListener('click', () => {
    cartSectionEl.scrollIntoView({ behavior: 'smooth' });
  });

  checkoutBtn.addEventListener('click', openModal);
  modalCloseBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    orderForm.reset();
    orderForm.classList.add('hidden');
    successMsg.classList.remove('hidden');

    cart = [];
    saveCart();
    renderCart();
  });
}

document.addEventListener('DOMContentLoaded', init);