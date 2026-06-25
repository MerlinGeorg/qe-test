"use strict";

const { loadApp, teardown } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterAll(async () => { await teardown(); });

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request.get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("returns the gateway name", async () => {
    const res = await request.get("/health");

    expect(res.body.name).toBe("ecommerce-api-gateway");
  });

  it("includes a timestamp", async () => {
    const res = await request.get("/health");

    expect(res.body.timestamp).toBeDefined();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  it("includes a requestId in both body and response header", async () => {
    const res = await request.get("/health");

    expect(res.body.requestId).toBeDefined();
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });

  it("echoes a caller-supplied x-request-id", async () => {
    const myId = "my-trace-id-001";
    const res = await request.get("/health").set("x-request-id", myId);

    expect(res.headers["x-request-id"]).toBe(myId);
    expect(res.body.requestId).toBe(myId);
  });

  it("lists all downstream service targets", async () => {
    const res = await request.get("/health");
    const serviceKeys = Object.keys(res.body.services);

    expect(serviceKeys).toEqual(
      expect.arrayContaining(["auth", "catalog", "inventory", "cart", "orders", "payments", "shipping", "customers"])
    );
  });

  it("responds with JSON content-type", async () => {
    const res = await request.get("/health");

    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});
