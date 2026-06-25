"use strict";

const { loadApp, teardown } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterAll(async () => { await teardown(); });

const USER_HEADER = { "x-mock-user-id": "user-123" };

describe("GET /api/customers/me", () => {
  it("returns the customer profile for the resolved user", async () => {
    const res = await request.get("/api/customers/me").set(USER_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("user-123");
  });

  it("returns all expected customer fields", async () => {
    const res = await request.get("/api/customers/me").set(USER_HEADER);

    expect(res.body).toMatchObject({
      id: "user-123",
      email: "customer@example.com",
      firstName: "Casey",
      lastName: "Nguyen",
      roles: expect.arrayContaining(["customer"]),
    });
  });

  it("returns 404 for a userId with no customer record", async () => {
    const res = await request
      .get("/api/customers/me")
      .set({ "x-mock-user-id": "user-nonexistent" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe("GET /api/customers/:customerId", () => {
  it("returns customer data for a known customerId", async () => {
    const res = await request.get("/api/customers/user-123").set(USER_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("user-123");
  });

  it("returns the admin customer when requested by id", async () => {
    const res = await request.get("/api/customers/user-admin").set(USER_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("user-admin");
    expect(res.body.roles).toContain("admin");
  });

  it("returns 404 for a customerId that does not exist", async () => {
    const res = await request.get("/api/customers/user-ghost").set(USER_HEADER);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
