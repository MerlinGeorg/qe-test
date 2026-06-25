const express = require("express");

const { getInventory } = require("../shared/mock-data");

const app = express();

app.get("/health", (req, res) => {
  res.json({
    service: "inventory",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/products/:productId/availability", (req, res) => {
  const inventory = getInventory(req.params.productId);

  if (!inventory) {
    return res.status(404).json({
      error: "Inventory record not found",
    });
  }

  return res.json(inventory);
});

module.exports = app;