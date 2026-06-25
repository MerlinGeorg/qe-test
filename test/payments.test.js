"use strict";

const { loadApp, teardown, resetMockData } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterEach(() => resetMockData());
afterAll(async () => { await teardown(); });

const USER_HEADER = { "x-mock-user-id": "user-123" };

describe("POST /api/payments/authorize", () => {
  const VALID_BODY = {
    orderId: "12345",
    amount: 79.99,
    currency: "CAD",
  };

  it("returns 200 with a payment authorization for a valid order", async () => {
    const res = await request
      .post("/api/payments/authorize")
      .set(USER_HEADER)
      .send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.body.paymentId).toBeDefined();
    expect(res.body.status).toBe("authorized");
  });

  it("returns all expected payment fields", async () => {
    const res = await request
      .post("/api/payments/authorize")
      .set(USER_HEADER)
      .send(VALID_BODY);

    expect(res.body).toMatchObject({
      paymentId: expect.any(String),
      orderId: "12345",
      amount: 79.99,
      currency: "CAD",
      status: "authorized",
      authorizedAt: expect.any(String),
    });
  });

  it("authorizedAt is a valid ISO 8601 timestamp", async () => {
    const res = await request
      .post("/api/payments/authorize")
      .set(USER_HEADER)
      .send(VALID_BODY);

    const date = new Date(res.body.authorizedAt);
    expect(date.toString()).not.toBe("Invalid Date");
  });

  it("each authorization receives a unique paymentId", async () => {
    const res1 = await request.post("/api/payments/authorize").set(USER_HEADER).send(VALID_BODY);
    const res2 = await request.post("/api/payments/authorize").set(USER_HEADER).send(VALID_BODY);

    expect(res1.body.paymentId).not.toBe(res2.body.paymentId);
  });

  it("returns 400 when orderId is missing", async () => {
    const res = await request
      .post("/api/payments/authorize")
      .set(USER_HEADER)
      .send({ amount: 79.99, currency: "CAD" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when amount is missing", async () => {
    const res = await request
      .post("/api/payments/authorize")
      .set(USER_HEADER)
      .send({ orderId: "12345", currency: "CAD" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when currency is missing", async () => {
    const res = await request
      .post("/api/payments/authorize")
      .set(USER_HEADER)
      .send({ orderId: "12345", amount: 79.99 });

    expect(res.status).toBe(400);
  });

  it("returns 404 for an orderId that does not exist", async () => {
    const res = await request
      .post("/api/payments/authorize")
      .set(USER_HEADER)
      .send({ orderId: "order-nonexistent", amount: 50.00, currency: "CAD" });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
