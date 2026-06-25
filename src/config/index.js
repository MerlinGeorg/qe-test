const dotenv = require("dotenv");

dotenv.config();

const gateway = {
  name: "ecommerce-api-gateway",
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 8080),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 200),
};

const security = {
  requireAuth: String(process.env.REQUIRE_AUTH || "false").toLowerCase() === "true",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtIssuer: process.env.JWT_ISSUER || undefined,
  jwtAudience: process.env.JWT_AUDIENCE || undefined,
};

if (security.requireAuth && !security.jwtSecret) {
  throw new Error("JWT_SECRET must be configured when REQUIRE_AUTH=true");
}

const services = {
  auth: {
    name: "auth",
    route: "/api/auth",
    target: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  },
  customers: {
    name: "customers",
    route: "/api/customers",
    target: process.env.CUSTOMER_SERVICE_URL || "http://localhost:3002",
  },
  catalog: {
    name: "catalog",
    route: "/api/catalog",
    target: process.env.CATALOG_SERVICE_URL || "http://localhost:3003",
  },
  inventory: {
    name: "inventory",
    route: "/api/inventory",
    target: process.env.INVENTORY_SERVICE_URL || "http://localhost:3004",
  },
  cart: {
    name: "cart",
    route: "/api/cart",
    target: process.env.CART_SERVICE_URL || "http://localhost:3005",
  },
  orders: {
    name: "orders",
    route: "/api/orders",
    target: process.env.ORDER_SERVICE_URL || "http://localhost:3006",
  },
  payments: {
    name: "payments",
    route: "/api/payments",
    target: process.env.PAYMENT_SERVICE_URL || "http://localhost:3007",
  },
  shipping: {
    name: "shipping",
    route: "/api/shipping",
    target: process.env.SHIPPING_SERVICE_URL || "http://localhost:3008",
  },
};

const publicRouteRules = [
  { method: null, pattern: /^\/health$/ },
  { method: null, pattern: /^\/api\/auth(?:\/|$)/ },
  { method: "GET", pattern: /^\/api\/catalog(?:\/|$)/ },
  { method: "GET", pattern: /^\/api\/inventory(?:\/|$)/ },
  { method: "GET", pattern: /^\/api\/storefront(?:\/|$)/ },
];

module.exports = {
  gateway,
  publicRouteRules,
  security,
  services,
};