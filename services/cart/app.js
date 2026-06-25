const express = require("express");

const { addCartItem, getCart } = require("../shared/mock-data");
const { resolveUserId } = require("../shared/resolve-user-id");

const app = express();

function summarizeCart(items) {
  return {
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    subtotal: Number(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)),
    currency: items[0]?.currency || "CAD",
  };
}

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "cart",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/items", (req, res) => {
  const userId = resolveUserId(req);
  const items = getCart(userId);

  return res.json({
    userId,
    items,
    summary: summarizeCart(items),
  });
});

app.post("/items", (req, res) => {
  const userId = resolveUserId(req);
  const productId = String(req.body?.productId || "").trim();
  const quantity = Number(req.body?.quantity || 0);

  if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({
      error: "productId and a positive integer quantity are required",
    });
  }

  const items = addCartItem(userId, productId, quantity);

  if (!items) {
    return res.status(404).json({
      error: "Product not found",
    });
  }

  return res.status(201).json({
    userId,
    items,
    summary: summarizeCart(items),
  });
});

module.exports = app;