// The cart service resolves userId from x-user-id (set by gateway when REQUIRE_AUTH=true)
// or from x-mock-user-id (convenience header the mock accepts directly).
// In tests REQUIRE_AUTH=false, so we pass x-mock-user-id to identify the user.


"use strict";

const { loadApp, teardown, resetMockData } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterEach(() => resetMockData());
afterAll(async () => { await teardown(); });

const USER_HEADER = { "x-mock-user-id": "user-123" };

describe("GET /api/cart/items", () => {
  it("returns 200 with cart contents for user-123", async () => {
    const res = await request.get("/api/cart/items").set(USER_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("user-123");
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("default cart already contains the seeded item", async () => {
    const res = await request.get("/api/cart/items").set(USER_HEADER);

    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].productId).toBe("sku-123");
  });

  it("response includes a summary with itemCount and subtotal", async () => {
    const res = await request.get("/api/cart/items").set(USER_HEADER);

    expect(res.body.summary).toMatchObject({
      itemCount: expect.any(Number),
      subtotal: expect.any(Number),
      currency: expect.any(String),
    });
  });

  it("returns an empty items array for a user with no cart", async () => {
    const res = await request.get("/api/cart/items").set({ "x-mock-user-id": "user-new" });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.summary.itemCount).toBe(0);
  });
});

describe("POST /api/cart/items", () => {
  it("adds a new product to the cart and returns 201", async () => {
    const res = await request
      .post("/api/cart/items")
      .set(USER_HEADER)
      .send({ productId: "sku-456", quantity: 2 });

    expect(res.status).toBe(201);
    const added = res.body.items.find((i) => i.productId === "sku-456");
    expect(added).toBeDefined();
    expect(added.quantity).toBe(2);
  });

  it("increments quantity when the same product is added again", async () => {
    // First add
    await request.post("/api/cart/items").set(USER_HEADER).send({ productId: "sku-123", quantity: 1 });
    // Second add of the same product
    const res = await request
      .post("/api/cart/items")
      .set(USER_HEADER)
      .send({ productId: "sku-123", quantity: 3 });

    expect(res.status).toBe(201);
    const item = res.body.items.find((i) => i.productId === "sku-123");
    // seeded quantity 1 + first add 1 + second add 3 = 5
    expect(item.quantity).toBe(5);
  });

  it("updates the cart summary after adding an item", async () => {
    const before = await request.get("/api/cart/items").set(USER_HEADER);
    await request.post("/api/cart/items").set(USER_HEADER).send({ productId: "sku-456", quantity: 1 });
    const after = await request.get("/api/cart/items").set(USER_HEADER);

    expect(after.body.summary.itemCount).toBeGreaterThan(before.body.summary.itemCount);
    expect(after.body.summary.subtotal).toBeGreaterThan(before.body.summary.subtotal);
  });

  it("returns 400 when productId is missing", async () => {
    const res = await request
      .post("/api/cart/items")
      .set(USER_HEADER)
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when quantity is zero", async () => {
    const res = await request
      .post("/api/cart/items")
      .set(USER_HEADER)
      .send({ productId: "sku-123", quantity: 0 });

    expect(res.status).toBe(400);
  });

  it("returns 400 when quantity is negative", async () => {
    const res = await request
      .post("/api/cart/items")
      .set(USER_HEADER)
      .send({ productId: "sku-123", quantity: -1 });

    expect(res.status).toBe(400);
  });

  it("returns 400 when quantity is a float", async () => {
    const res = await request
      .post("/api/cart/items")
      .set(USER_HEADER)
      .send({ productId: "sku-123", quantity: 1.5 });

    expect(res.status).toBe(400);
  });

  it("returns 404 for a productId that does not exist in catalog", async () => {
    const res = await request
      .post("/api/cart/items")
      .set(USER_HEADER)
      .send({ productId: "sku-nonexistent", quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
