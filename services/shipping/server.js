const dotenv = require("dotenv");

const app = require("./app");
const { resolveHostFromUrl, resolvePortFromUrl } = require("../shared/resolve-service-binding");

dotenv.config();

const host =
  process.env.SHIPPING_SERVICE_HOST || resolveHostFromUrl(process.env.SHIPPING_SERVICE_URL, "0.0.0.0");
const port = Number(
  process.env.SHIPPING_SERVICE_PORT || resolvePortFromUrl(process.env.SHIPPING_SERVICE_URL, 3008)
);

app.listen(port, host, () => {
  console.log(`shipping service listening on http://${host}:${port}`);
});