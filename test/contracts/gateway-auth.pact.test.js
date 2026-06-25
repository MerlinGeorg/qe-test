// Consumer contract: api-gateway → auth-service
// Verifies the shape of responses the gateway expects from the auth service.

"use strict";

const { PactV3, MatchersV3 } = require("@pact-foundation/pact");
const { like } = MatchersV3;
const path = require("path");

const provider = new PactV3({
  consumer: "api-gateway",
  provider: "auth-service",
  dir: path.resolve(process.cwd(), "pacts"),
});

describe("Gateway → Auth Service contract", () => {
  it("expects a token response for valid credentials", async () => {
    await provider
      .given("customer@example.com exists with password secret")
      .uponReceiving("a login request with valid credentials")
      .withRequest({
        method: "POST",
        path: "/login",
        headers: { "Content-Type": "application/json" },
        body: {
          email: "customer@example.com",
          password: "secret",
        },
      })
      .willRespondWith({
        status: 200,
        body: like({
          accessToken: "some.jwt.token",
          tokenType: "Bearer",
          expiresIn: 3600,
          user: {
            id: "user-123",
            email: "customer@example.com",
            firstName: "Casey",
            lastName: "Nguyen",
          },
        }),
      })
      .executeTest(async (mockServer) => {
        const { fetchJson, buildUrl } = require("../../src/lib/http");
        const result = await fetchJson(buildUrl(mockServer.url, "/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "customer@example.com",
            password: "secret",
          }),
        });

        expect(result.ok).toBe(true);
        expect(result.body.accessToken).toBeDefined();
        expect(result.body.tokenType).toBe("Bearer");
        expect(result.body.expiresIn).toBeDefined();
        expect(result.body.user.id).toBeDefined();
      });
  });

  it("expects a 401 for invalid credentials", async () => {
    await provider
      .given("invalid credentials are provided")
      .uponReceiving("a login request with wrong password")
      .withRequest({
        method: "POST",
        path: "/login",
        headers: { "Content-Type": "application/json" },
        body: {
          email: "customer@example.com",
          password: "wrongpassword",
        },
      })
      .willRespondWith({
        status: 401,
        body: like({
          error: "Invalid email or password",
        }),
      })
      .executeTest(async (mockServer) => {
        const { fetchJson, buildUrl } = require("../../src/lib/http");
        const result = await fetchJson(buildUrl(mockServer.url, "/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "customer@example.com",
            password: "wrongpassword",
          }),
        });

        expect(result.ok).toBe(false);
        expect(result.status).toBe(401);
        expect(result.body.error).toBeDefined();
      });
  });
});