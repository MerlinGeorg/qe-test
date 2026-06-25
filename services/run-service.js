const dotenv = require("dotenv");

const { resolveHostFromUrl, resolvePortFromUrl } = require("./shared/resolve-service-binding");

dotenv.config();

const serviceName = process.argv[2];

const serviceConfig = {
  auth: { defaultPort: 3001, envPrefix: "AUTH", urlEnvVar: "AUTH_SERVICE_URL" },
  customers: { defaultPort: 3002, envPrefix: "CUSTOMER", urlEnvVar: "CUSTOMER_SERVICE_URL" },
  catalog: { defaultPort: 3003, envPrefix: "CATALOG", urlEnvVar: "CATALOG_SERVICE_URL" },
  inventory: { defaultPort: 3004, envPrefix: "INVENTORY", urlEnvVar: "INVENTORY_SERVICE_URL" },
  cart: { defaultPort: 3005, envPrefix: "CART", urlEnvVar: "CART_SERVICE_URL" },
  orders: { defaultPort: 3006, envPrefix: "ORDER", urlEnvVar: "ORDER_SERVICE_URL" },
  payments: { defaultPort: 3007, envPrefix: "PAYMENT", urlEnvVar: "PAYMENT_SERVICE_URL" },
};

if (!serviceName || !serviceConfig[serviceName]) {
  console.error("Usage: node services/run-service.js <auth|customers|catalog|inventory|cart|orders|payments>");
  process.exit(1);
}

const config = serviceConfig[serviceName];
const app = require(`./${serviceName}/app`);
const serviceUrl = process.env[config.urlEnvVar];
const host =
  process.env[`${config.envPrefix}_SERVICE_HOST`] || resolveHostFromUrl(serviceUrl, "0.0.0.0");
const port = Number(
  process.env[`${config.envPrefix}_SERVICE_PORT`] || resolvePortFromUrl(serviceUrl, config.defaultPort)
);

app.listen(port, host, () => {
  console.log(`${serviceName} service listening on http://${host}:${port}`);
});