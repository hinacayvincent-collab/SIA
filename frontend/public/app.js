// ---- Service endpoints (edit if you run services on different ports/hosts) ----
const PRODUCT_SERVICE_URL = "http://localhost:3001";
const ORDER_SERVICE_URL = "http://localhost:3002";

// ---- State ----
let products = [];
const cartQuantities = {}; // productId -> quantity selected in the stepper (not yet added)
const cart = new Map();     // productId -> { product, quantity } already added to the ticket
let currentOrder = null;    // the order returned by Order Service, once placed

// ---- DOM ----
const productGrid = document.getElementById("product-grid");
const catalogStatus = document.getElementById("catalog-status");
const ticketHeading = document.getElementById("ticket-heading");
const ticketItemsEl = document.getElementById("ticket-items");
const ticketEmptyEl = document.getElementById("ticket-empty");
const ticketTotalEl = document.getElementById("ticket-total");
const placeOrderBtn = document.getElementById("place-order-btn");
const payBtn = document.getElementById("pay-btn");
const ticketMessageEl = document.getElementById("ticket-message");

function formatPeso(centavos) {
  return `₱${(centavos / 100).toFixed(2)}`;
}

function setMessage(text, kind) {
  ticketMessageEl.textContent = text || "";
  ticketMessageEl.className = `ticket-message${kind ? " " + kind : ""}`;
}

// ---- Load catalog from Product Service ----
async function loadProducts() {
  try {
    const res = await fetch(`${PRODUCT_SERVICE_URL}/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    products = data;
    products.forEach((p) => (cartQuantities[p.id] = 1));
    renderProducts();
    catalogStatus.textContent = `${products.length} item${products.length === 1 ? "" : "s"} available`;
    catalogStatus.className = "status-text";
  } catch (err) {
    console.error(err);
    catalogStatus.textContent = "Couldn't reach the Product Service (is it running on :3001?)";
    catalogStatus.className = "status-text error";
  }
}

function renderProducts() {
  productGrid.innerHTML = "";
  for (const product of products) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <div class="product-price">${formatPeso(product.price)}</div>
      <div class="qty-row">
        <button class="qty-btn" data-action="dec" aria-label="Decrease quantity">−</button>
        <span class="qty-value">${cartQuantities[product.id]}</span>
        <button class="qty-btn" data-action="inc" aria-label="Increase quantity">+</button>
      </div>
      <button class="add-btn" data-action="add">Add to order</button>
    `;

    const qtyValueEl = card.querySelector(".qty-value");

    card.querySelector('[data-action="dec"]').addEventListener("click", () => {
      cartQuantities[product.id] = Math.max(1, cartQuantities[product.id] - 1);
      qtyValueEl.textContent = cartQuantities[product.id];
    });

    card.querySelector('[data-action="inc"]').addEventListener("click", () => {
      cartQuantities[product.id] = Math.min(99, cartQuantities[product.id] + 1);
      qtyValueEl.textContent = cartQuantities[product.id];
    });

    card.querySelector('[data-action="add"]').addEventListener("click", () => {
      const qty = cartQuantities[product.id];
      const existing = cart.get(product.id);
      cart.set(product.id, {
        product,
        quantity: existing ? existing.quantity + qty : qty,
      });
      renderTicket();
      setMessage("");
    });

    productGrid.appendChild(card);
  }
}

// ---- Ticket (cart) rendering ----
function renderTicket() {
  ticketItemsEl.innerHTML = "";

  if (cart.size === 0) {
    ticketEmptyEl.hidden = false;
    ticketHeading.textContent = "No items yet";
    ticketTotalEl.textContent = formatPeso(0);
    placeOrderBtn.disabled = true;
    return;
  }

  ticketEmptyEl.hidden = true;
  ticketHeading.textContent = "Ready to order";
  placeOrderBtn.disabled = false;

  let total = 0;
  for (const { product, quantity } of cart.values()) {
    const lineTotal = product.price * quantity;
    total += lineTotal;

    const li = document.createElement("li");
    li.className = "ticket-item";
    li.innerHTML = `
      <span class="name">${product.name} <span class="qty">×${quantity}</span></span>
      <span class="amount">${formatPeso(lineTotal)}</span>
    `;
    ticketItemsEl.appendChild(li);
  }

  ticketTotalEl.textContent = formatPeso(total);
}

// ---- Place order with the Order Service ----
placeOrderBtn.addEventListener("click", async () => {
  if (cart.size === 0) return;

  placeOrderBtn.disabled = true;
  setMessage("Placing your order…");

  const items = Array.from(cart.values()).map(({ product, quantity }) => ({
    productId: product.id,
    quantity,
  }));

  try {
    const res = await fetch(`${ORDER_SERVICE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    const { data: order } = await res.json();
    currentOrder = order;

    ticketHeading.textContent = `Order ${order.id}`;
    placeOrderBtn.hidden = true;
    payBtn.hidden = false;
    setMessage("Order created. Continue to pay.", "success");
  } catch (err) {
    console.error(err);
    placeOrderBtn.disabled = false;
    setMessage(`Couldn't place the order: ${err.message}`, "error");
  }
});

// ---- Start checkout with the Payment Service (via Order Service) ----
payBtn.addEventListener("click", async () => {
  if (!currentOrder) return;

  payBtn.disabled = true;
  setMessage("Opening PayMongo checkout…");

  try {
    const res = await fetch(`${ORDER_SERVICE_URL}/orders/${currentOrder.id}/checkout`, {
      method: "POST",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    const { data } = await res.json();
    window.location.href = data.checkoutUrl;
  } catch (err) {
    console.error(err);
    payBtn.disabled = false;
    setMessage(`Couldn't start checkout: ${err.message}`, "error");
  }
});

loadProducts();
renderTicket();
