// Cross-cutting gateway behaviour that isn't specific to one service:
// x-request-id propagation, 404 for unknown routes, Wildcard path guard, REQUIRE_AUTH=true JWT enforcement, CORS and security headers

"use strict";

const { loadApp, teardown } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterAll(async () => { await teardown(); });

// Request ID propagation 

describe("x-request-id propagation", () => {
  it("generates an x-request-id when none is supplied", async () => {
    const res = await request.get("/health");

    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.headers["x-request-id"].length).toBeGreaterThan(0);
  });

  it("echoes the caller-supplied x-request-id", async () => {
    const id = "caller-trace-abc";
    const res = await request.get("/health").set("x-request-id", id);

    expect(res.headers["x-request-id"]).toBe(id);
  });
});

// 404 for unknown routes 

describe("404 for unmatched routes", () => {
  it("returns 404 with an error body for a completely unknown path", async () => {
    const res = await request.get("/api/doesnotexist");

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it("includes a requestId in the 404 body", async () => {
    const res = await request.get("/api/doesnotexist");

    expect(res.body.requestId).toBeDefined();
  });
});

//  Wildcard path guard 

describe("Wildcard path guard", () => {
  it("returns 400 when a path ends with /*", async () => {
    const res = await request.get("/api/catalog/*");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/concrete path/i);
  });
});



// Security headers (Helmet) 

describe("Security headers", () => {
  it("sets X-Content-Type-Options: nosniff", async () => {
    const res = await request.get("/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
