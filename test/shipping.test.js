"use strict";

const { loadApp, teardown } = require("./helpers/setup");

let request;

beforeAll(async () => { request = await loadApp(); });
afterAll(async () => { await teardown(); });

const USER_HEADER = { "x-mock-user-id": "user-123" };

describe("GET /api/shipping/rates", () => {
  it("returns rates for a valid Canadian postal code", async () => {
    const res = await request
      .get("/api/shipping/rates?postalCode=M5G2C3&country=CA")
      .set(USER_HEADER);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.rates)).toBe(true);
    expect(res.body.rates.length).toBeGreaterThan(0);
  });

  it("returns standard, express, and priority service levels", async () => {
    const res = await request
      .get("/api/shipping/rates?postalCode=M5G2C3&country=CA")
      .set(USER_HEADER);

    const levels = res.body.rates.map((r) => r.serviceLevel);
    expect(levels).toContain("standard");
    expect(levels).toContain("express");
    expect(levels).toContain("priority");
  });

  it("each rate has carrier, amount, currency, estimatedDeliveryDays, and destination", async () => {
    const res = await request
      .get("/api/shipping/rates?postalCode=M5G2C3&country=CA")
      .set(USER_HEADER);

    for (const rate of res.body.rates) {
      expect(rate).toMatchObject({
        serviceLevel: expect.any(String),
        carrier: expect.any(String),
        estimatedDeliveryDays: expect.any(Number),
        amount: expect.any(Number),
        currency: expect.any(String),
        destination: { postalCode: expect.any(String), country: expect.any(String) },
      });
    }
  });

  it("uses CAD currency for country=CA", async () => {
    const res = await request
      .get("/api/shipping/rates?postalCode=M5G2C3&country=CA")
      .set(USER_HEADER);

    for (const rate of res.body.rates) {
      expect(rate.currency).toBe("CAD");
    }
  });

  it("uses USD currency for country=US", async () => {
    const res = await request
      .get("/api/shipping/rates?postalCode=10001&country=US")
      .set(USER_HEADER);

    expect(res.status).toBe(200);
    for (const rate of res.body.rates) {
      expect(rate.currency).toBe("USD");
    }
  });

  it("applies a weight surcharge for heavy packages", async () => {
    const light = await request
      .get("/api/shipping/rates?postalCode=M5G2C3&country=CA&weightGrams=500")
      .set(USER_HEADER);
    const heavy = await request
      .get("/api/shipping/rates?postalCode=M5G2C3&country=CA&weightGrams=1500")
      .set(USER_HEADER);

    const lightStandard = light.body.rates.find((r) => r.serviceLevel === "standard");
    const heavyStandard = heavy.body.rates.find((r) => r.serviceLevel === "standard");
    expect(heavyStandard.amount).toBeGreaterThan(lightStandard.amount);
  });

  it("returns 400 when postalCode is missing", async () => {
    const res = await request.get("/api/shipping/rates?country=CA").set(USER_HEADER);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/postalCode/i);
  });

  it("returns 400 for an unsupported country", async () => {
    const res = await request
      .get("/api/shipping/rates?postalCode=00000&country=XX")
      .set(USER_HEADER);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/country/i);
  });

  it("returns 400 for a non-positive weightGrams", async () => {
    const res = await request
      .get("/api/shipping/rates?postalCode=M5G2C3&country=CA&weightGrams=0")
      .set(USER_HEADER);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/shipping/shipments", () => {
  const VALID_BODY = {
    orderId: "12345",
    shippingRate: { serviceLevel: "standard", carrier: "Northwind Ground", amount: 7.99 },
    address: { street: "123 King St W", city: "Toronto", country: "CA", postalCode: "M5G2C3" },
  };

  it("creates a shipment and returns 201 with a shipmentId", async () => {
    const res = await request
      .post("/api/shipping/shipments")
      .set(USER_HEADER)
      .send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.shipmentId).toBeDefined();
    expect(res.body.shipmentId).toMatch(/^shp_/);
  });

  it("response echoes orderId and status=created", async () => {
    const res = await request
      .post("/api/shipping/shipments")
      .set(USER_HEADER)
      .send(VALID_BODY);

    expect(res.body.orderId).toBe("12345");
    expect(res.body.status).toBe("created");
  });

  it("response includes a trackingNumber", async () => {
    const res = await request
      .post("/api/shipping/shipments")
      .set(USER_HEADER)
      .send(VALID_BODY);

    expect(res.body.trackingNumber).toBeDefined();
    expect(res.body.trackingNumber).toMatch(/^NW/);
  });

  it("returns 400 when orderId is missing", async () => {
    const { orderId, ...body } = VALID_BODY;
    const res = await request.post("/api/shipping/shipments").set(USER_HEADER).send(body);

    expect(res.status).toBe(400);
  });

  it("returns 400 when shippingRate is missing", async () => {
    const { shippingRate, ...body } = VALID_BODY;
    const res = await request.post("/api/shipping/shipments").set(USER_HEADER).send(body);

    expect(res.status).toBe(400);
  });

  it("returns 400 when address is missing", async () => {
    const { address, ...body } = VALID_BODY;
    const res = await request.post("/api/shipping/shipments").set(USER_HEADER).send(body);

    expect(res.status).toBe(400);
  });
});
