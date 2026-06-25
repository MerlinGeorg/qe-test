"use strict";

const { loadApp, teardown } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterAll(async () => { await teardown(); });

describe("GET /api/inventory/products/:productId/availability", () => {
  it("returns 200 with inventory data for a known product", async () => {
    const res = await request.get("/api/inventory/products/sku-123/availability");

    expect(res.status).toBe(200);
    expect(res.body.productId).toBe("sku-123");
  });

  it("returns required inventory fields", async () => {
    const res = await request.get("/api/inventory/products/sku-123/availability");

    expect(res.body).toMatchObject({
      productId: "sku-123",
      available: expect.any(Boolean),
      quantity: expect.any(Number),
      reserved: expect.any(Number),
      warehouse: expect.any(String),
    });
  });

  it("reflects available=true for sku-123", async () => {
    const res = await request.get("/api/inventory/products/sku-123/availability");

    expect(res.body.available).toBe(true);
    expect(res.body.quantity).toBeGreaterThan(0);
  });

  it("reflects available=false and quantity=0 for sku-789", async () => {
    const res = await request.get("/api/inventory/products/sku-789/availability");

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
    expect(res.body.quantity).toBe(0);
  });

  it("returns 404 for an unknown productId", async () => {
    const res = await request.get("/api/inventory/products/nonexistent/availability");

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it("is accessible without a token", async () => {
    const res = await request.get("/api/inventory/products/sku-456/availability");

    expect(res.status).toBe(200);
  });
});
