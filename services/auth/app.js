const express = require("express");
const jwt = require("jsonwebtoken");

const { findCustomerByEmail } = require("../shared/mock-data");

const app = express();

function buildJwtOptions() {
  const options = { expiresIn: "1h" };

  if (process.env.JWT_ISSUER) {
    options.issuer = process.env.JWT_ISSUER;
  }

  if (process.env.JWT_AUDIENCE) {
    options.audience = process.env.JWT_AUDIENCE;
  }

  return options;
}

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "auth",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const customer = findCustomerByEmail(String(email || "").trim());

  if (!customer || password !== "secret") {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  const accessToken = jwt.sign(
    {
      sub: customer.id,
      roles: customer.roles,
      email: customer.email,
    },
    process.env.JWT_SECRET || "change-me",
    buildJwtOptions()
  );

  return res.json({
    accessToken,
    tokenType: "Bearer",
    expiresIn: 3600,
    user: customer,
  });
});

module.exports = app;