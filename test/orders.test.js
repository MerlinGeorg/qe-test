// Uses x-mock-user-id so the orders service resolves the right cart for user-123.


"use strict";

const { loadApp, teardown, resetMockData } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterEach(() => resetMockData());
afterAll(async () => { await teardown(); });

const USER_HEADER = { "x-mock-user-id": "user-123" };

describe("GET /api/orders/:orderId", () => {
  it("returns the seeded order by id", async () => {
    const res = await request.get("/api/orders/12345").set(USER_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe("12345");
  });

  it("returns all expected order fields", async () => {
    const res = await request.get("/api/orders/12345").set(USER_HEADER);

    expect(res.body).toMatchObject({
      orderId: "12345",
      customerId: "user-123",
      status: expect.any(String),
      currency: "CAD",
      subtotal: expect.any(Number),
      items: expect.any(Array),
      shippingAddressId: expect.any(String),
      paymentMethodId: expect.any(String),
    });
  });

  it("returns 404 for an unknown orderId", async () => {
    const res = await request.get("/api/orders/nonexistent").set(USER_HEADER);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe("GET /api/orders (list)", () => {
  it("returns an items array containing at least the seeded order", async () => {
    const res = await request.get("/api/orders/").set(USER_HEADER);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("each order in the list has an orderId", async () => {
    const res = await request.get("/api/orders/").set(USER_HEADER);

    for (const order of res.body.items) {
      expect(order.orderId).toBeDefined();
    }
  });
});

describe("POST /api/orders", () => {
  const VALID_BODY = {
    cartId: "cart-123",
    shippingAddressId: "addr-001",
    paymentMethodId: "pm-001",
  };

  it("creates an order from the user's cart and returns 201", async () => {
    const res = await request.post("/api/orders").set(USER_HEADER).send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.customerId).toBe("user-123");
  });

  it("the created order includes the cartId", async () => {
    const res = await request.post("/api/orders").set(USER_HEADER).send(VALID_BODY);

    expect(res.body.cartId).toBe("cart-123");
  });

  it("the created order status is 'created'", async () => {
    const res = await request.post("/api/orders").set(USER_HEADER).send(VALID_BODY);

    expect(res.body.status).toBe("created");
  });

  it("the created order subtotal matches the cart items", async () => {
    const res = await request.post("/api/orders").set(USER_HEADER).send(VALID_BODY);

    // Seeded cart has sku-123 x1 @ 79.99
    expect(res.body.subtotal).toBe(79.99);
  });

  it("created order is retrievable by orderId", async () => {
    const createRes = await request.post("/api/orders").set(USER_HEADER).send(VALID_BODY);
    const { orderId } = createRes.body;

    const getRes = await request.get(`/api/orders/${orderId}`).set(USER_HEADER);

    expect(getRes.status).toBe(200);
    expect(getRes.body.orderId).toBe(orderId);
  });

  it("returns 400 when cartId is missing", async () => {
    const res = await request
      .post("/api/orders")
      .set(USER_HEADER)
      .send({ shippingAddressId: "addr-001", paymentMethodId: "pm-001" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when shippingAddressId is missing", async () => {
    const res = await request
      .post("/api/orders")
      .set(USER_HEADER)
      .send({ cartId: "cart-123", paymentMethodId: "pm-001" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when paymentMethodId is missing", async () => {
    const res = await request
      .post("/api/orders")
      .set(USER_HEADER)
      .send({ cartId: "cart-123", shippingAddressId: "addr-001" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when the user's cart is empty", async () => {
    // Use a userId who has no seeded cart
    const res = await request
      .post("/api/orders")
      .set({ "x-mock-user-id": "user-empty" })
      .send(VALID_BODY);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty cart/i);
  });
});
