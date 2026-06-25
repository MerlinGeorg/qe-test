const app = require("./app");
const { gateway } = require("./config");

const server = app.listen(gateway.port, gateway.host, () => {
  console.log(`${gateway.name} listening on http://${gateway.host}:${gateway.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down gateway`);
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));