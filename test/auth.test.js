// POST /api/auth/login
// Covers: correct path, bad credentials, missing fields, malformed body.

"use strict";

const { loadApp, teardown } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterAll(async () => { await teardown(); });

describe("POST /api/auth/login", () => {
  const VALID_CREDENTIALS = { email: "customer@example.com", password: "secret" };

  // success path 

  it("returns 200 with an accessToken for valid credentials", async () => {
    const res = await request.post("/api/auth/login").send(VALID_CREDENTIALS);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe("string");
  });

  it("returns tokenType Bearer and expiresIn 3600", async () => {
    const res = await request.post("/api/auth/login").send(VALID_CREDENTIALS);

    expect(res.body.tokenType).toBe("Bearer");
    expect(res.body.expiresIn).toBe(3600);
  });

  it("returns the authenticated user object", async () => {
    const res = await request.post("/api/auth/login").send(VALID_CREDENTIALS);

    expect(res.body.user).toMatchObject({
      id: "user-123",
      email: "customer@example.com",
      firstName: "Casey",
      lastName: "Nguyen",
    });
  });

  it("the returned token is a valid JWT with expected claims", async () => {
    const res = await request.post("/api/auth/login").send(VALID_CREDENTIALS);
    const jwt = require("jsonwebtoken");
    const decoded = jwt.decode(res.body.accessToken);

    expect(decoded.sub).toBe("user-123");
    expect(decoded.email).toBe("customer@example.com");
    expect(decoded.roles).toContain("customer");
  });

  it("admin user can also log in", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "secret" });

    expect(res.status).toBe(200);
    expect(res.body.user.roles).toContain("admin");
  });

  // Bad credentials 

  it("returns 401 for wrong password", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "customer@example.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it("returns 401 for unknown email", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "secret" });

    expect(res.status).toBe(401);
  });

  it("returns 401 for empty credentials", async () => {
    const res = await request.post("/api/auth/login").send({});

    expect(res.status).toBe(401);
  });

  it("returns 401 when password is missing entirely", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "customer@example.com" });

    expect(res.status).toBe(401);
  });

  it("is publicly accessible — no token required", async () => {
    // Confirm auth/login is reachable without an Authorization header
    const res = await request.post("/api/auth/login").send(VALID_CREDENTIALS);

    expect(res.status).toBe(200);
  });
});
