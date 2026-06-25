// Consumer contract: api-gateway → cart-service
// Verifies the shape of responses the gateway expects from the cart service.

"use strict";

const { PactV3, MatchersV3 } = require("@pact-foundation/pact");
const { like, eachLike } = MatchersV3;
const path = require("path");

const provider = new PactV3({
  consumer: "api-gateway",
  provider: "cart-service",
  dir: path.resolve(process.cwd(), "pacts"),
});

describe("Gateway → Cart Service contract", () => {
  it("expects a cart response with items and summary", async () => {
    await provider
      .given("user-123 has items in their cart")
      .uponReceiving("a request to get cart items for user-123")
      .withRequest({
        method: "GET",
        path: "/items",
        headers: { "x-user-id": "user-123" },
      })
      .willRespondWith({
        status: 200,
        body: like({
          userId: "user-123",
          items: eachLike({
            productId: "sku-123",
            quantity: 1,
            unitPrice: 79.99,
            currency: "CAD",
            name: "Wireless Keyboard",
          }),
          summary: like({
            itemCount: 1,
            subtotal: 79.99,
            currency: "CAD",
          }),
        }),
      })
      .executeTest(async (mockServer) => {
        const { fetchJson, buildUrl } = require("../../src/lib/http");
        const result = await fetchJson(buildUrl(mockServer.url, "/items"), {
          headers: { "x-user-id": "user-123" },
        });

        expect(result.ok).toBe(true);
        expect(result.body.userId).toBeDefined();
        expect(Array.isArray(result.body.items)).toBe(true);
        expect(result.body.summary).toBeDefined();
        expect(result.body.summary.itemCount).toBeDefined();
        expect(result.body.summary.subtotal).toBeDefined();
      });
  });

  it("expects a 201 response when adding an item to the cart", async () => {
    await provider
      .given("product sku-456 exists in catalog")
      .uponReceiving("a request to add sku-456 to user-123 cart")
      .withRequest({
        method: "POST",
        path: "/items",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-123",
        },
        body: {
          productId: "sku-456",
          quantity: 2,
        },
      })
      .willRespondWith({
        status: 201,
        body: like({
          userId: "user-123",
          items: eachLike({
            productId: "sku-456",
            quantity: 2,
            unitPrice: 149.99,
            currency: "CAD",
          }),
          summary: like({
            itemCount: 2,
            subtotal: 299.98,
            currency: "CAD",
          }),
        }),
      })
      .executeTest(async (mockServer) => {
        const { fetchJson, buildUrl } = require("../../src/lib/http");
        const result = await fetchJson(buildUrl(mockServer.url, "/items"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "user-123",
          },
          body: JSON.stringify({ productId: "sku-456", quantity: 2 }),
        });

        expect(result.status).toBe(201);
        expect(result.body.items).toBeDefined();
        expect(result.body.summary).toBeDefined();
      });
  });
});