const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";
const expected = require("../product-service/data/products.json");

async function seed() {
  const res = await fetch(`${PRODUCT_SERVICE_URL}/products`);
  if (!res.ok) {
    throw new Error(`Product Service returned HTTP ${res.status}. Is it running on :3001?`);
  }

  const { data } = await res.json();
  const missing = expected.filter((product) => {
    const found = data.find((item) => item.id === product.id);
    return !found || found.name !== product.name || found.price !== product.price;
  });

  if (missing.length > 0) {
    throw new Error(
      `Catalog seed mismatch. Missing or changed: ${missing.map((p) => p.name).join(", ")}`,
    );
  }

  console.log(`Seed OK: ${expected.length} products with fixed names and prices.`);
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
