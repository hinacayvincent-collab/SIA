require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

if (!PAYMONGO_SECRET_KEY) {
  console.warn(
    "WARNING: PAYMONGO_SECRET_KEY is not set. Set it in your environment " +
      "(e.g. `export PAYMONGO_SECRET_KEY=sk_test_xxx`) before creating checkout sessions.",
  );
}

if (PAYMONGO_SECRET_KEY && !PAYMONGO_SECRET_KEY.startsWith("sk_test_")) {
  console.warn(
    "WARNING: This key does not look like a TEST key (sk_test_...). " +
      "Live keys (sk_live_...) must never be used in this classroom activity.",
  );
}

app.post("/checkout-sessions", async (req, res) => {
  try {
    const { orderId, description, lineItems, successUrl, cancelUrl } = req.body;

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: "lineItems[] is required" });
    }
    if (!successUrl || !cancelUrl) {
      return res
        .status(400)
        .json({ error: "successUrl and cancelUrl are required" });
    }

    const basicAuth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString("base64");

    const paymongoRes = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              line_items: lineItems,
              payment_method_types: ["card", "gcash", "paymaya"],
              description: description || `Order #${orderId}`,
              send_email_receipt: false,
              show_line_items: true,
              success_url: successUrl,
              cancel_url: cancelUrl,
            },
          },
        }),
      },
    );

    const body = await paymongoRes.json();

    if (!paymongoRes.ok) {
      console.error("PayMongo error:", JSON.stringify(body));
      return res
        .status(502)
        .json({ error: "PayMongo request failed", details: body });
    }

    const session = body.data;
    res.json({
      checkoutSessionId: session.id,
      checkoutUrl: session.attributes.checkout_url,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Unexpected error creating checkout session" });
  }
});

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "payment-service" }),
);

app.listen(PORT, () => {
  console.log(`Payment Service listening on http://localhost:${PORT}`);
});
