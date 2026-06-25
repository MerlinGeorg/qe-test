// Shared helpers used across all test suites.

"use strict";

// Point env at test values before any require() loads config
process.env.NODE_ENV = "test";
process.env.PORT = "9090";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_ISSUER = "ecommerce-auth";
process.env.JWT_AUDIENCE = "ecommerce-clients";
process.env.REQUIRE_AUTH = "false";

const http = require("http");
const jwt = require("jsonwebtoken");
const supertest = require("supertest");


const authApp = require("../../services/auth/app");
const catalogApp = require("../../services/catalog/app");
const cartApp = require("../../services/cart/app");
const customersApp = require("../../services/customers/app");
const inventoryApp = require("../../services/inventory/app");
const ordersApp = require("../../services/orders/app");
const paymentsApp = require("../../services/payments/app");
const shippingApp = require("../../services/shipping/app");
const { resetState } = require("../../services/shared/mock-data");


const SERVICE_PORTS = {
  auth:      9091,
  customers: 9092,
  catalog:   9093,
  inventory: 9094,
  cart:      9095,
  orders:    9096,
  payments:  9097,
  shipping:  9098,
};

const SERVICE_APPS = {
  auth:      authApp,
  customers: customersApp,
  catalog:   catalogApp,
  inventory: inventoryApp,
  cart:      cartApp,
  orders:    ordersApp,
  payments:  paymentsApp,
  shipping:  shippingApp,
};

let gatewayAgent = null;
let servers = [];


async function loadApp() {
  if (gatewayAgent) return gatewayAgent;

  // Set env URLs so gateway config picks them up
  process.env.AUTH_SERVICE_URL      = `http://127.0.0.1:${SERVICE_PORTS.auth}`;
  process.env.CUSTOMER_SERVICE_URL  = `http://127.0.0.1:${SERVICE_PORTS.customers}`;
  process.env.CATALOG_SERVICE_URL   = `http://127.0.0.1:${SERVICE_PORTS.catalog}`;
  process.env.INVENTORY_SERVICE_URL = `http://127.0.0.1:${SERVICE_PORTS.inventory}`;
  process.env.CART_SERVICE_URL      = `http://127.0.0.1:${SERVICE_PORTS.cart}`;
  process.env.ORDER_SERVICE_URL     = `http://127.0.0.1:${SERVICE_PORTS.orders}`;
  process.env.PAYMENT_SERVICE_URL   = `http://127.0.0.1:${SERVICE_PORTS.payments}`;
  process.env.SHIPPING_SERVICE_URL  = `http://127.0.0.1:${SERVICE_PORTS.shipping}`;

  await Promise.all(
    Object.entries(SERVICE_APPS).map(([name, app]) =>
      new Promise((resolve, reject) => {
        const server = http.createServer(app);
        server.listen(SERVICE_PORTS[name], "127.0.0.1", (err) => {
          if (err) return reject(err);
          servers.push(server);
          resolve();
        });
      })
    )
  );


  Object.keys(require.cache).forEach((key) => {
    if (key.includes("/src/")) delete require.cache[key];
  });
  const gatewayApp = require("../../src/app");
  gatewayAgent = supertest(gatewayApp);
  return gatewayAgent;
}

// Shut down all downstream servers.
async function teardown() {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
  servers = [];
  gatewayAgent = null;
}

// Mint a signed JWT that the gateway will accept.

function makeToken(overrides = {}, signOpts = {}) {
  const payload = {
    sub: "user-123",
    roles: ["customer"],
    email: "customer@example.com",
    ...overrides,
  };
  return jwt.sign(payload, "test-secret", {
    expiresIn: "1h",
    issuer: "ecommerce-auth",
    audience: "ecommerce-clients",
    ...signOpts,
  });
}

// Reset mutable mock-data state (cart, orders, payments) between tests.
function resetMockData() {
  resetState();
}

module.exports = { loadApp, teardown, makeToken, resetMockData };
