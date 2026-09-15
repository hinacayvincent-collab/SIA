const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:3003";
// Base URL that PayMongo will redirect the customer's BROWSER back to.
// In sandbox testing this can stay as localhost.
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;

// In-memory order store: { id: order }
const orders = new Map();

// Create a new order from a list of { productId, quantity }
app.post("/orders", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items[] is required" });
    }

    // Order Service asks Product Service for authoritative price/name data.
    // Never trust price data sent from the client.
    const lineItems = [];
    for (const { productId, quantity } of items) {
      const productRes = await fetch(`${PRODUCT_SERVICE_URL}/products/${productId}`);
      if (!productRes.ok) {
        return res.status(400).json({ error: `Unknown product: ${productId}` });
      }
      const { data: product } = await productRes.json();
      lineItems.push({
        productId: product.id,
        name: product.name,
        description: product.description,
        amount: product.price, // centavos
        quantity: quantity || 1,
      });
    }

    const total = lineItems.reduce((sum, li) => sum + li.amount * li.quantity, 0);

    const order = {
      id: `ORD-${randomUUID().slice(0, 8).toUpperCase()}`,
      lineItems,
      total, // centavos
      status: "pending", // pending -> paid | cancelled
      checkoutUrl: null,
      createdAt: new Date().toISOString(),
    };

    orders.set(order.id, order);
    res.status(201).json({ data: order });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to create order (Product Service unreachable?)" });
  }
});

app.get("/orders/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ data: order });
});

// Kick off payment: Order Service asks Payment Service to open a PayMongo
// Checkout Session. This is the ONLY place PayMongo is involved, and even
// here, Order Service never sees the secret key - that lives only in
// Payment Service.
app.post("/orders/:id/checkout", async (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "pending") {
    return res.status(400).json({ error: `Order is already ${order.status}` });
  }

  try {
    const paymentRes = await fetch(`${PAYMENT_SERVICE_URL}/checkout-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        description: `Order #${order.id}`,
        lineItems: order.lineItems.map((li) => ({
          name: li.name,
          description: li.description,
          amount: li.amount,
          quantity: li.quantity,
          currency: "PHP",
        })),
        successUrl: `${APP_BASE_URL}/orders/${order.id}/success`,
        cancelUrl: `${APP_BASE_URL}/orders/${order.id}/cancel`,
      }),
    });

    if (!paymentRes.ok) {
      const errBody = await paymentRes.text();
      console.error("Payment Service error:", errBody);
      return res.status(502).json({ error: "Failed to create checkout session" });
    }

    const { checkoutUrl, checkoutSessionId } = await paymentRes.json();
    order.checkoutUrl = checkoutUrl;
    order.checkoutSessionId = checkoutSessionId;

    res.json({ data: { orderId: order.id, checkoutUrl } });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Payment Service unreachable" });
  }
});

// PayMongo redirects the customer's browser here after a successful payment.
// NOTE: this activity intentionally trusts the redirect instead of a webhook
// (see instructor notes) - that's a real limitation worth mentioning in your
// written reflection.
app.get("/orders/:id/success", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).send("Order not found");
  order.status = "paid";
  res.send(`
    <h1>Payment received</h1>
    <p>Order <strong>${order.id}</strong> is now marked as <strong>paid</strong>.</p>
  `);
});

// PayMongo redirects here if the customer cancels/backs out.
app.get("/orders/:id/cancel", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).send("Order not found");
  order.status = "cancelled";
  res.send(`
    <h1>Payment cancelled</h1>
    <p>Order <strong>${order.id}</strong> was not completed.</p>
  `);
});

app.get("/health", (req, res) => res.json({ status: "ok", service: "order-service" }));

app.listen(PORT, () => {
  console.log(`Order Service listening on http://localhost:${PORT}`);
});
