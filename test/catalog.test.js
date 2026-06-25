"use strict";

const { loadApp, teardown } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterAll(async () => { await teardown(); });

describe("GET /api/catalog/products", () => {
  it("returns 200 with a list of products", async () => {
    const res = await request.get("/api/catalog/products");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it("count matches the length of items array", async () => {
    const res = await request.get("/api/catalog/products");

    expect(res.body.count).toBe(res.body.items.length);
  });

  it("each product has required fields", async () => {
    const res = await request.get("/api/catalog/products");

    for (const product of res.body.items) {
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("price");
      expect(product).toHaveProperty("currency");
      expect(product).toHaveProperty("category");
    }
  });

  it("filters by category", async () => {
    const res = await request.get("/api/catalog/products?category=accessories");

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    for (const product of res.body.items) {
      expect(product.category).toBe("accessories");
    }
  });

  it("filters by search query (q)", async () => {
    const res = await request.get("/api/catalog/products?q=keyboard");

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].name.toLowerCase()).toContain("keyboard");
  });

  it("returns empty items for a non-matching category", async () => {
    const res = await request.get("/api/catalog/products?category=nonexistent");

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.count).toBe(0);
  });

  it("is accessible without authentication", async () => {
    const res = await request.get("/api/catalog/products");

    expect(res.status).toBe(200);
  });
});

describe("GET /api/catalog/products/:productId", () => {
  it("returns a product by id", async () => {
    const res = await request.get("/api/catalog/products/sku-123");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("sku-123");
    expect(res.body.name).toBe("Wireless Keyboard");
  });

  it("returns all expected product fields", async () => {
    const res = await request.get("/api/catalog/products/sku-123");

    expect(res.body).toMatchObject({
      id: "sku-123",
      name: expect.any(String),
      description: expect.any(String),
      category: expect.any(String),
      price: expect.any(Number),
      currency: expect.any(String),
    });
  });

  it("returns 404 for an unknown productId", async () => {
    const res = await request.get("/api/catalog/products/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it("is accessible without authentication", async () => {
    const res = await request.get("/api/catalog/products/sku-456");

    expect(res.status).toBe(200);
  });
});
