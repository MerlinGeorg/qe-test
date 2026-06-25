const express = require("express");

const { getCustomer } = require("../shared/mock-data");
const { resolveUserId } = require("../shared/resolve-user-id");

const app = express();

app.get("/health", (req, res) => {
  res.json({
    service: "customers",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/me", (req, res) => {
  const customer = getCustomer(resolveUserId(req));

  if (!customer) {
    return res.status(404).json({
      error: "Customer not found",
    });
  }

  return res.json(customer);
});

app.get("/:customerId", (req, res) => {
  const customer = getCustomer(req.params.customerId);

  if (!customer) {
    return res.status(404).json({
      error: "Customer not found",
    });
  }

  return res.json(customer);
});

module.exports = app;