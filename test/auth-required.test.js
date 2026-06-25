// Tests the gateway with REQUIRE_AUTH=true.
// Uses its own isolated setup — does NOT use helpers/setup.js because that singleton hardcodes REQUIRE_AUTH=false.

"use strict";

// Must be set BEFORE any require() loads gateway config
process.env.REQUIRE_AUTH = "true";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_ISSUER = "ecommerce-auth";
process.env.JWT_AUDIENCE = "ecommerce-clients";
process.env.AUTH_SERVICE_URL      = "http://127.0.0.1:9091";
process.env.CUSTOMER_SERVICE_URL  = "http://127.0.0.1:9092";
process.env.CATALOG_SERVICE_URL   = "http://127.0.0.1:9093";
process.env.INVENTORY_SERVICE_URL = "http://127.0.0.1:9094";
process.env.CART_SERVICE_URL      = "http://127.0.0.1:9095";
process.env.ORDER_SERVICE_URL     = "http://127.0.0.1:9096";
process.env.PAYMENT_SERVICE_URL   = "http://127.0.0.1:9097";
process.env.SHIPPING_SERVICE_URL  = "http://127.0.0.1:9098";

const http = require("http");
const jwt = require("jsonwebtoken");
const supertest = require("supertest");

// Import service apps directly — not through setup.js
const authApp      = require("../services/auth/app");
const catalogApp   = require("../services/catalog/app");
const cartApp      = require("../services/cart/app");
const customersApp = require("../services/customers/app");
const inventoryApp = require("../services/inventory/app");
const ordersApp    = require("../services/orders/app");
const paymentsApp  = require("../services/payments/app");
const shippingApp  = require("../services/shipping/app");

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

let request;
let servers = [];

function makeToken(overrides = {}, signOpts = {}) {
  return jwt.sign(
    { sub: "user-123", roles: ["customer"], email: "customer@example.com", ...overrides },
    "test-secret",
    { expiresIn: "1h", issuer: "ecommerce-auth", audience: "ecommerce-clients", ...signOpts }
  );
}

beforeAll(async () => {
  // Start all downstream services on real ports
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

  // Load gateway FRESH — REQUIRE_AUTH=true is already set above
  const gatewayApp = require("../src/app");
  request = supertest(gatewayApp);
});

afterAll(async () => {
  await Promise.all(servers.map((s) => new Promise((resolve) => s.close(resolve))));
});

describe("Protected routes with REQUIRE_AUTH=true", () => {
  it("GET /api/cart/items returns 401 with no token", async () => {
    const res = await request.get("/api/cart/items");
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it("GET /api/cart/items returns 401 with wrong secret", async () => {
    const badToken = jwt.sign(
      { sub: "user-123", roles: ["customer"] },
      "wrong-secret",
      { expiresIn: "1h", issuer: "ecommerce-auth", audience: "ecommerce-clients" }
    );
    const res = await request
      .get("/api/cart/items")
      .set("Authorization", `Bearer ${badToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token validation failed/i);
  });

  it("GET /api/cart/items returns 401 with expired token", async () => {
    const expiredToken = makeToken({}, { expiresIn: "0s" });
    await new Promise((r) => setTimeout(r, 100));
    const res = await request
      .get("/api/cart/items")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it("GET /api/cart/items returns 401 with malformed header", async () => {
    const res = await request
      .get("/api/cart/items")
      .set("Authorization", "NotBearer abc");
    expect(res.status).toBe(401);
  });

  it("GET /api/cart/items succeeds with valid token", async () => {
    const token = makeToken();
    const res = await request
      .get("/api/cart/items")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("gateway forwards x-user-id from JWT sub to downstream", async () => {
    const token = makeToken({ sub: "user-123" });
    const res = await request
      .get("/api/customers/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("user-123");
  });

  // Public routes still accessible without token
  it("GET /health is accessible without token", async () => {
    const res = await request.get("/health");
    expect(res.status).toBe(200);
  });

  it("POST /api/auth/login is accessible without token", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "customer@example.com", password: "secret" });
    expect(res.status).toBe(200);
  });

  it("GET /api/catalog/products is accessible without token", async () => {
    const res = await request.get("/api/catalog/products");
    expect(res.status).toBe(200);
  });

  it("GET /api/inventory is accessible without token", async () => {
    const res = await request
      .get("/api/inventory/products/sku-123/availability");
    expect(res.status).toBe(200);
  });

  it("GET /api/storefront is accessible without token", async () => {
    const res = await request
      .get("/api/storefront/products/sku-123");
    expect(res.status).toBe(200);
  });
});