# Ecommerce API Gateway

A Node.js API gateway for an ecommerce platform. It exposes a single entry point for client applications and forwards traffic to downstream microservices: auth, catalog, cart, orders, payments, inventory, shipping, and customers.

## What it does

- Routes requests to downstream ecommerce services via a transparent proxy
- Applies common middleware in one place: CORS, Helmet, request IDs, logging, JSON parsing, and rate limiting
- Supports optional JWT validation at the gateway (`REQUIRE_AUTH=true`)
- Adds a composed storefront endpoint that aggregates product and inventory data (Backend for Frontend pattern)
- Returns consistent error responses and propagates request IDs across all services for distributed tracing

## Routes

| Method | Path      | Visibility |
|--------|-----------|------------|
| GET    | `/health` | Public |
| GET    | `/api/storefront/products/:productId` | Public |
| POST   | `/api/auth/login` | Public |
| GET    | `/api/catalog/products` | Public |
| GET    | `/api/catalog/products/:productId` | Public |
| GET    | `/api/inventory/products/:productId/availability` | Public |
| GET    | `/api/customers/me` | Protected |
| GET    | `/api/customers/:customerId` | Protected |
| GET    | `/api/cart/items` | Protected |
| POST   | `/api/cart/items` | Protected |
| GET    | `/api/orders/` | Protected |
| GET    | `/api/orders/:orderId` | Protected |
| POST   | `/api/orders` | Protected |
| POST   | `/api/payments/authorize` | Protected |
| GET    | `/api/shipping/rates` | Protected |
| POST   | `/api/shipping/shipments` | Protected |

Protected routes require a Bearer token when `REQUIRE_AUTH=true`.

---

## Quick start

```bash
npm install
copy .env.example .env 
npm run dev
```

```bash
curl http://localhost:9090/health
```

---

## Tests

### Test approach

The goal of this test suite is to validate the API gateway's behaviour **as an API consumer would observe it** - through HTTP request and response - without testing Node.js implementation details.
The test suite is organized into three layers:

**1. Integration tests (primary)**
Most tests send real HTTP requests through the gateway, which proxies to in-process mock services (auth, catalog, inventory, etc.). The full flow is exercised:

`Test → Gateway → Proxy → Downstream → Response`

All services run via `http.createServer`, while the gateway is tested using Supertest (no real port needed).

**2. Auth enforcement tests**
Since config is loaded once, testing `REQUIRE_AUTH=true` requires a separate isolated setup. This test file sets env variables before loading modules and runs sequentially to avoid conflicts, ensuring real JWT enforcement behavior.

**3. Contract tests**
Using Pact.js, these tests define expected request/response interactions with downstream services. They generate contract files (`pacts/`) to ensure compatibility and catch breaking changes early.


### Assumptions

- Tests run against the mock downstream services included in the `services/` folder — not real external services
- Mock data is seeded with fixed products (`sku-123`, `sku-456`, `sku-789`), one customer (`user-123`), and one order (`12345`) on startup
- Mutable state (cart, orders, payments) is reset between tests using `resetState()` so tests do not bleed into each other
- `REQUIRE_AUTH=false` by default — the integration test suite runs without tokens. `auth-required.test.js` explicitly tests the `REQUIRE_AUTH=true` path in isolation
- Test credentials (`JWT_SECRET=test-secret` etc.) are intentionally hardcoded in test setup files — they are not real secrets and carry no production risk

---

### Test files

| File | Type | What it covers |
|---   |---   |---             |
| `tests/health.test.js` | Integration | Status, gateway name, timestamp, requestId echo and header, service listing, content-type |
| `tests/auth.test.js` | Integration | Login happy path, JWT claims, both user roles, bad password, unknown email, missing fields, public access |
| `tests/catalog.test.js` | Integration | List products, category filter, search filter, empty results, single product by ID, 404 |
| `tests/inventory.test.js` | Integration | Available product, out-of-stock product, required fields, 404 |
| `tests/storefront.test.js` | Integration | Composed product+inventory response, downstream status codes, 502 on catalog failure, graceful inventory degradation, public access |
| `tests/cart.test.js` | Integration | Get cart, empty cart, seeded cart, add item, quantity accumulation, summary recalculation, 400/404 validation |
| `tests/orders.test.js` | Integration | Get seeded order, list orders, create order, subtotal correctness, retrievable after creation, 400/404 validation |
| `tests/payments.test.js` | Integration | Successful authorization, unique paymentIds, ISO timestamp, 400/404 validation |
| `tests/shipping.test.js` | Integration | CA/US rates, three service levels, weight surcharge, field shapes, shipment creation, 400 validation |
| `tests/customers.test.js` | Integration | `/me` resolved user, lookup by ID, admin user, 404 |
| `tests/gateway.test.js` | Integration | x-request-id propagation and echo, 404 for unknown routes, wildcard path guard, security headers |
| `tests/auth-required.test.js` | Integration (REQUIRE_AUTH=true) | 401 with no token, wrong secret, expired token, malformed header, valid token grants access, public routes bypass auth, x-user-id forwarding |
| `tests/contracts/gateway-catalog.pact.test.js` | Contract | Gateway-catalog: product by ID, 404 shape |
| `tests/contracts/gateway-inventory.pact.test.js` | Contract | Gateway-inventory: availability shape, 404 shape |
| `tests/contracts/gateway-auth.pact.test.js` | Contract | Gateway-auth: login response shape, JWT fields |
| `tests/contracts/gateway-cart.pact.test.js` | Contract | Gateway-cart: cart items shape, summary shape |
| `tests/contracts/gateway-orders.pact.test.js` | Contract | Gateway-orders: order shape, list shape, create response |
| `tests/contracts/gateway-payments.pact.test.js` | Contract | Gateway-payments: authorization response shape |
| `tests/contracts/gateway-shipping.pact.test.js` | Contract | Gateway-shipping: rates array shape, shipment response |
| `tests/contracts/gateway-customers.pact.test.js` | Contract | Gateway-customers: customer profile shape, 404 shape |

---

### Install dependencies

```bash
npm install
```

---

### Run the tests

**All tests (single command):**

```bash
npm test
```

This runs the full integration and auth suite with `jest --runInBand --forceExit`. All downstream services start automatically inside the test process — no separate terminals, no Docker, no external setup needed.

**Contract tests only:**

```bash
npm run test:contracts
```

**Test coverage report:**

```bash
npm run test:coverage
```

**Watch mode (during development):**

```bash
npm run test:watch
```

---

### Test environment variables

All test environment variables are set programmatically inside the test setup files:

- `tests/helpers/setup.js` — sets env for all integration tests (`REQUIRE_AUTH=false`)
- `tests/auth-required.test.js` — sets its own env independently (`REQUIRE_AUTH=true`)

No `.env.test` file is required. The values used (`test-secret`, `ecommerce-auth` etc.) are test-only identifiers with no production risk and are safe to commit to version control.

---

### Limitations and known gaps

**Cross-service state in mock data**

Each downstream service runs as a separate process with its own in-memory copy of `mock-data.js`. Data created in one service (e.g. a new order via the orders service) is not visible to another service (e.g. payments). This means `POST /api/payments/authorize` can only reference the seeded order `12345` — not orders created at runtime. In production this is solved by a shared database per service with event-driven communication between services (e.g. Kafka). This is a known architectural constraint of the mock setup, not a gateway bug.

**Rate limit tests not included**

The rate limiter is configured to 200 requests per 60-second window per IP address. Exercising the 429 response reliably in a test environment would require either making 200+ rapid sequential requests (slow) or lowering the limit via env config (requires modifying source). The middleware is present and functional — this is a test coverage gap only.

**Downstream unavailability (502) not fully tested**

The "service is unavailable" proxy error path — where a downstream service refuses the connection entirely — is not covered. Testing it would require stopping individual mock servers mid-test, which conflicts with the shared `beforeAll` setup. The storefront 502 test covers the catalog-returns-404 path as a partial proxy for downstream error handling.

**HTTPS / TLS not tested**

The gateway does not terminate TLS — that is expected to be handled by an upstream load balancer. TLS behaviour is therefore out of scope for this suite.

**Contract tests require Pact broker for full CI value**

The contract tests generate JSON pact files locally in the `pacts/` folder. In a real microservices team setup, these would be published to a Pact Broker so downstream service teams can run provider verification against them automatically. That broker integration is not configured here.

---

## Local mock services

Start everything at once:

```bash
npm run start:all
```

Or individually:

```bash
npm run start:auth
npm run start:catalog
npm run start:inventory
npm run start:cart
npm run start:orders
npm run start:payments
npm run start:shipping
npm run start:customers
```
