// Consumer contract: api-gateway → catalog-service
// Verifies the shape of responses the gateway expects from the catalog service.

"use strict";

const { PactV3, MatchersV3 } = require("@pact-foundation/pact");
const { like } = MatchersV3;
const path = require("path");

const provider = new PactV3({
  consumer: "api-gateway",
  provider: "catalog-service",
  dir: path.resolve(process.cwd(), "pacts"),
});

describe("Gateway → Catalog Service contract", () => {
  it("expects a product response when requesting by ID", async () => {
    await provider
      .given("product sku-123 exists")
      .uponReceiving("a request for product sku-123")
      .withRequest({
        method: "GET",
        path: "/products/sku-123",
      })
      .willRespondWith({
        status: 200,
        body: like({
          id: "sku-123",
          name: "Wireless Keyboard",
          price: 79.99,
          currency: "CAD",
          category: "accessories",
        }),
      })
      .executeTest(async (mockServer) => {
        const { fetchJson, buildUrl } = require("../../src/lib/http");
        const result = await fetchJson(
          buildUrl(mockServer.url, "/products/sku-123")
        );

        expect(result.ok).toBe(true);
        expect(result.body.id).toBe("sku-123");
        expect(result.body.price).toBeDefined();
        expect(result.body.currency).toBeDefined();
      });
  });

  it("expects a 404 when product does not exist", async () => {
    await provider
      .given("product nonexistent does not exist")
      .uponReceiving("a request for a nonexistent product")
      .withRequest({
        method: "GET",
        path: "/products/nonexistent",
      })
      .willRespondWith({
        status: 404,
        body: like({
          error: "Product not found",
        }),
      })
      .executeTest(async (mockServer) => {
        const { fetchJson, buildUrl } = require("../../src/lib/http");
        const result = await fetchJson(
          buildUrl(mockServer.url, "/products/nonexistent")
        );

        expect(result.ok).toBe(false);
        expect(result.status).toBe(404);
        expect(result.body.error).toBeDefined();
      });
  });
});