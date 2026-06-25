// Consumer contract: api-gateway → inventory-service
// Verifies the shape of responses the gateway expects from the inventory service.

"use strict";

const { PactV3, MatchersV3 } = require("@pact-foundation/pact");
const { like } = MatchersV3;
const path = require("path");

const provider = new PactV3({
  consumer: "api-gateway",
  provider: "inventory-service",
  dir: path.resolve(process.cwd(), "pacts"),
});

describe("Gateway → Inventory Service contract", () => {
  it("expects availability data for a product that is in stock", async () => {
    await provider
      .given("sku-123 is in stock")
      .uponReceiving("a request for sku-123 availability")
      .withRequest({
        method: "GET",
        path: "/products/sku-123/availability",
      })
      .willRespondWith({
        status: 200,
        body: like({
          productId: "sku-123",
          available: true,
          quantity: 42,
          reserved: 3,
          warehouse: "TOR-01",
        }),
      })
      .executeTest(async (mockServer) => {
        const { fetchJson, buildUrl } = require("../../src/lib/http");
        const result = await fetchJson(
          buildUrl(mockServer.url, "/products/sku-123/availability")
        );

        expect(result.ok).toBe(true);
        expect(result.body.productId).toBe("sku-123");
        expect(result.body.available).toBeDefined();
        expect(result.body.quantity).toBeDefined();
        expect(result.body.warehouse).toBeDefined();
      });
  });

  it("expects a 404 when inventory record does not exist", async () => {
    await provider
      .given("no inventory record for sku-nonexistent")
      .uponReceiving("a request for availability of a nonexistent product")
      .withRequest({
        method: "GET",
        path: "/products/sku-nonexistent/availability",
      })
      .willRespondWith({
        status: 404,
        body: like({
          error: "Inventory record not found",
        }),
      })
      .executeTest(async (mockServer) => {
        const { fetchJson, buildUrl } = require("../../src/lib/http");
        const result = await fetchJson(
          buildUrl(mockServer.url, "/products/sku-nonexistent/availability")
        );

        expect(result.ok).toBe(false);
        expect(result.status).toBe(404);
        expect(result.body.error).toBeDefined();
      });
  });
});