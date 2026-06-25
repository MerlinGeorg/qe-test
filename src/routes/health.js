const express = require("express");

const { gateway, services } = require("../config");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    name: gateway.name,
    status: "ok",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    services: Object.fromEntries(
      Object.entries(services).map(([serviceName, service]) => [serviceName, service.target])
    ),
  });
});

module.exports = router;