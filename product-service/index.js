const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

// Seeded catalog with fixed names and prices (centavos) so every E2E run sees the same data.
const PRODUCTS = require("./data/products.json");

app.get("/products", (req, res) => {
  res.json({ data: PRODUCTS });
});

app.get("/products/:id", (req, res) => {
  const product = PRODUCTS.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ data: product });
});

app.get("/health", (req, res) => res.json({ status: "ok", service: "product-service" }));

app.listen(PORT, () => {
  console.log(`Product Service listening on http://localhost:${PORT}`);
});
