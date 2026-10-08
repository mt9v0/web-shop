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
const getCartItem = (id) => cart.find((i) => i.id === id);

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
  setupValidation();
}

function renderProducts() {
  productListEl.replaceChildren();

  products.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const media = document.createElement('div');
    media.className = 'product-card__media';

    const img = document.createElement('img');
    img.className = 'product-card__img';
    img.src = product.img;
    img.alt = product.title;
    img.loading = 'lazy';

    media.append(img);

    const info = document.createElement('div');
    info.className = 'product-card__info';

    const title = document.createElement('h3');
    title.className = 'product-card__title';
    title.textContent = product.title;

    const price = document.createElement('p');
    price.className = 'product-card__price';
    price.textContent = `${formatPrice(product.price)} ₽`;

    info.append(title, price);

    const actions = document.createElement('div');
    actions.className = 'product-card__actions';

    card.append(media, info, actions);
    productListEl.append(card);

    const inCart = getCartItem(product.id);
    renderProductActionsInto(actions, product, inCart);
  });
}

function renderProductActionsInto(container, product, inCart) {
  container.replaceChildren();

  if (!inCart) {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.dataset.add = product.id;
    btn.textContent = 'Добавить в корзину';
    container.append(btn);
    return;
  }

  const controls = document.createElement('div');
  controls.className = 'qty-controls';

  const dec = document.createElement('button');
  dec.className = 'qty-controls__btn';
  dec.type = 'button';
  dec.dataset.dec = product.id;
  dec.setAttribute('aria-label', 'Уменьшить количество');
  dec.textContent = '−';

  const value = document.createElement('span');
  value.className = 'qty-controls__value';
  value.textContent = inCart.count;

  const inc = document.createElement('button');
  inc.className = 'qty-controls__btn';
  inc.type = 'button';
  inc.dataset.inc = product.id;
  inc.setAttribute('aria-label', 'Увеличить количество');
  inc.textContent = '+';

  controls.append(dec, value, inc);
  container.append(controls);
}

function updateProductActions(productId) {
  const trigger = productListEl.querySelector(
    `[data-add="${productId}"], [data-inc="${productId}"], [data-dec="${productId}"]`
  );
  if (!trigger) return;

  const cardEl = trigger.closest('.product-card');
  if (!cardEl) return;

  const product = findProduct(productId);
  const actionsEl = cardEl.querySelector('.product-card__actions');

  renderProductActionsInto(actionsEl, product, getCartItem(productId));
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
  updateProductActions(productId);
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
  updateProductActions(productId);
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  renderCart();
}

function renderCart() {
  cartItemsEl.replaceChildren();

  if (cart.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-msg';
    empty.textContent = 'Корзина пуста';
    cartItemsEl.append(empty);

    checkoutBtn.disabled = true;
    cartTotalEl.textContent = '0';
    cartCountEl.textContent = '0';
    return;
  }

  checkoutBtn.disabled = false;

  let totalSum = 0;
  let totalCount = 0;

  cart.forEach((item) => {
    const product = findProduct(item.id);
    const itemTotal = product.price * item.count;
    totalSum += itemTotal;
    totalCount += item.count;

    const row = document.createElement('div');
    row.className = 'cart-item';

    const info = document.createElement('div');
    info.className = 'cart-item__info';

    const name = document.createElement('div');
    name.className = 'cart-item__name';
    name.textContent = product.title;

    const price = document.createElement('div');
    price.className = 'cart-item__price';
    price.textContent = `${formatPrice(itemTotal)} ₽`;

    info.append(name, price);

    const controls = document.createElement('div');
    controls.className = 'cart-item__controls';

    controls.append(
      createCartBtn('−', 'Уменьшить количество', 'dec', item.id),
      createCartQty(item.count),
      createCartBtn('+', 'Увеличить количество', 'inc', item.id),
      createCartBtn('×', 'Удалить товар', 'remove', item.id, 'cart-item__remove')
    );

    row.append(info, controls);
    cartItemsEl.append(row);
  });

  cartTotalEl.textContent = formatPrice(totalSum);
  cartCountEl.textContent = totalCount;
}

function createCartBtn(text, ariaLabel, dataKey, dataValue, extraClass = '') {
  const btn = document.createElement('button');
  btn.className = 'cart-item__btn' + (extraClass ? ' ' + extraClass : '');
  btn.type = 'button';
  btn.setAttribute('aria-label', ariaLabel);
  btn.textContent = text;
  btn.dataset[dataKey] = dataValue;
  return btn;
}

function createCartQty(count) {
  const qty = document.createElement('span');
  qty.className = 'cart-item__qty';
  qty.textContent = count;
  return qty;
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
    renderProducts();
  });
}

const rules = {
  'first-name': {
    test: (v) => /^[A-Za-zА-Яа-яЁё\s-]{2,}$/.test(v),
    message: 'Только буквы, минимум 2 символа'
  },
  'last-name': {
    test: (v) => /^[A-Za-zА-Яа-яЁё\s-]{2,}$/.test(v),
    message: 'Только буквы, минимум 2 символа'
  },
  address: {
    test: (v) => v.trim().length >= 5,
    message: 'Укажите адрес (минимум 5 символов)'
  },
  phone: {
    test: (v) => /^[+]?[\d\s()-]{10,18}$/.test(v.trim()),
    message: 'Только цифры и символы + ( ) -, минимум 10 цифр'
  }
};

function setError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorEl = orderForm.querySelector(`[data-error-for="${inputId}"]`);
  if (!input || !errorEl) return;

  if (message) {
    input.classList.add('is-invalid');
    errorEl.textContent = message;
  } else {
    input.classList.remove('is-invalid');
    errorEl.textContent = '';
  }
}

function clearAllErrors() {
  Object.keys(rules).forEach((id) => setError(id, ''));
}

function validateField(inputId) {
  const input = document.getElementById(inputId);
  const rule = rules[inputId];
  if (!input || !rule) return true;

  const value = input.value.trim();

  if (value === '') {
    setError(inputId, 'Поле обязательно для заполнения');
    return false;
  }
  if (!rule.test(value)) {
    setError(inputId, rule.message);
    return false;
  }
  setError(inputId, '');
  return true;
}

function validateForm() {
  let ok = true;
  Object.keys(rules).forEach((id) => {
    if (!validateField(id)) ok = false;
  });
  return ok;
}

function setupValidation() {
  Object.keys(rules).forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener('blur', () => validateField(id));

    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) {
        validateField(id);
      }
    });
  });

  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('beforeinput', (e) => {
      if (e.data && /[^\d\s()+-]/.test(e.data)) {
        e.preventDefault();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);