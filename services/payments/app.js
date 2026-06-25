const express = require("express");

const { createPaymentAuthorization, getOrder } = require("../shared/mock-data");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "payments",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.post("/authorize", (req, res) => {
  const { orderId, amount, currency } = req.body || {};
  const numericAmount = Number(amount);
  const order = getOrder(String(orderId || ""));

  if (!orderId || !Number.isFinite(numericAmount) || !currency) {
    return res.status(400).json({
      error: "orderId, amount, and currency are required",
    });
  }

  if (!order) {
    return res.status(404).json({
      error: "Order not found",
    });
  }

  const payment = createPaymentAuthorization({
    orderId: String(orderId),
    amount: numericAmount,
    currency: String(currency),
  });

  return res.json(payment);
});

module.exports = app;