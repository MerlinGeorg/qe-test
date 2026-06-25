const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");

const { gateway, services } = require("./config");
const { errorHandler, notFoundHandler } = require("./middleware/error-handler");
const { authenticate } = require("./middleware/authenticate");
const { requestContext } = require("./middleware/request-context");
const { createServiceProxy } = require("./proxy/create-service-proxy");
const healthRouter = require("./routes/health");
const storefrontRouter = require("./routes/storefront");

const app = express();

morgan.token("request-id", (req) => req.requestId);

app.use(requestContext);
app.use(
  morgan(":method :url :status :response-time ms request-id=:request-id")
);
app.use(helmet());
app.use(
  cors({
    origin:
      gateway.corsOrigin === "*"
        ? true
        : gateway.corsOrigin.split(",").map((origin) => origin.trim()),
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(
  rateLimit({
    windowMs: gateway.rateLimitWindowMs,
    max: gateway.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: "Rate limit exceeded",
        requestId: req.requestId,
      });
    },
  })
);

app.use((req, res, next) => {
  if (req.path.endsWith("/*")) {
    return res.status(400).json({
      error: "Route patterns are not callable endpoints. Use a concrete path such as /api/catalog/products/sku-123.",
      requestId: req.requestId,
    });
  }

  return next();
});

app.use(authenticate);

app.use("/health", healthRouter);
app.use("/api/storefront", storefrontRouter);

Object.values(services).forEach((service) => {
  app.use(service.route, createServiceProxy(service));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;