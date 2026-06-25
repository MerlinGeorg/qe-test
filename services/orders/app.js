const express = require("express");

const { createOrder, getCart, getOrder, listOrders } = require("../shared/mock-data");
const { resolveUserId } = require("../shared/resolve-user-id");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "orders",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    items: listOrders(),
  });
});

app.get("/:orderId", (req, res) => {
  const order = getOrder(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      error: "Order not found",
    });
  }

  return res.json(order);
});

app.post("/", (req, res) => {
  const { cartId, shippingAddressId, paymentMethodId } = req.body || {};
  const customerId = resolveUserId(req);
  const items = getCart(customerId);

  if (!cartId || !shippingAddressId || !paymentMethodId) {
    return res.status(400).json({
      error: "cartId, shippingAddressId, and paymentMethodId are required",
    });
  }

  if (!items.length) {
    return res.status(400).json({
      error: "Cannot create an order from an empty cart",
    });
  }

  const order = createOrder({
    customerId,
    shippingAddressId,
    paymentMethodId,
    items,
  });

  return res.status(201).json({
    ...order,
    cartId,
  });
});

module.exports = app;