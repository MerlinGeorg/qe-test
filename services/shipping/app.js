const express = require("express");

const app = express();

const supportedCountries = new Set(["CA", "US"]);

function buildRates(postalCode, country, weightGrams) {
  const normalizedCountry = country.toUpperCase();
  const baseCurrency = normalizedCountry === "CA" ? "CAD" : "USD";
  const weightSurcharge = Math.max(0, Math.ceil((weightGrams - 500) / 500)) * 1.75;

  return [
    {
      serviceLevel: "standard",
      carrier: "Northwind Ground",
      estimatedDeliveryDays: 5,
      amount: Number((7.99 + weightSurcharge).toFixed(2)),
      currency: baseCurrency,
    },
    {
      serviceLevel: "express",
      carrier: "Northwind Air",
      estimatedDeliveryDays: 2,
      amount: Number((15.49 + weightSurcharge).toFixed(2)),
      currency: baseCurrency,
    },
    {
      serviceLevel: "priority",
      carrier: "Northwind Priority",
      estimatedDeliveryDays: 1,
      amount: Number((24.99 + weightSurcharge).toFixed(2)),
      currency: baseCurrency,
    },
  ].map((rate) => ({
    ...rate,
    destination: {
      postalCode,
      country: normalizedCountry,
    },
  }));
}

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    service: "shipping",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/rates", (req, res) => {
  const postalCode = String(req.query.postalCode || "").trim();
  const country = String(req.query.country || "CA").trim();
  const requestedWeight = Number(req.query.weightGrams || 500);

  if (!postalCode) {
    return res.status(400).json({
      error: "postalCode query parameter is required",
    });
  }

  if (!country || !supportedCountries.has(country.toUpperCase())) {
    return res.status(400).json({
      error: "country must be one of CA or US",
    });
  }

  if (!Number.isFinite(requestedWeight) || requestedWeight <= 0) {
    return res.status(400).json({
      error: "weightGrams must be a positive number",
    });
  }

  return res.json({
    postalCode,
    country: country.toUpperCase(),
    weightGrams: requestedWeight,
    rates: buildRates(postalCode, country, requestedWeight),
  });
});

app.post("/shipments", (req, res) => {
  const { orderId, shippingRate, address } = req.body || {};

  if (!orderId || !shippingRate || !address) {
    return res.status(400).json({
      error: "orderId, shippingRate, and address are required",
    });
  }

  return res.status(201).json({
    shipmentId: `shp_${Math.random().toString(36).slice(2, 10)}`,
    orderId,
    status: "created",
    shippingRate,
    address,
    trackingNumber: `NW${Date.now()}`,
  });
});

module.exports = app;