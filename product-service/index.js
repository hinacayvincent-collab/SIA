const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;

// In-memory product catalog. Prices are in CENTAVOS (PHP x 100).
const PRODUCTS = [
  {
    id: "prod_001",
    name: "SIA1 T-Shirt",
    price: 35000, // PHP 350.00
    description: "Official SIA1 class shirt",
  },
  {
    id: "prod_002",
    name: "SIA1 Tote Bag",
    price: 15000, // PHP 150.00
    description: "Canvas tote with class logo",
  },
  {
    id: "prod_003",
    name: "SIA1 Sticker Pack",
    price: 5000, // PHP 50.00
    description: "Set of 5 vinyl stickers",
  },
];

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
