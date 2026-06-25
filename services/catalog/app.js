const express = require("express");

const { getProduct, listProducts } = require("../shared/mock-data");

const app = express();

app.get("/health", (req, res) => {
  res.json({
    service: "catalog",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/products", (req, res) => {
  const category = String(req.query.category || "").trim().toLowerCase();
  const search = String(req.query.q || "").trim().toLowerCase();

  let products = listProducts();

  if (category) {
    products = products.filter((product) => product.category === category);
  }

  if (search) {
    products = products.filter((product) => {
      return product.name.toLowerCase().includes(search) || product.description.toLowerCase().includes(search);
    });
  }

  return res.json({
    items: products,
    count: products.length,
  });
});

app.get("/products/:productId", (req, res) => {
  const product = getProduct(req.params.productId);

  if (!product) {
    return res.status(404).json({
      error: "Product not found",
    });
  }

  return res.json(product);
});

module.exports = app;