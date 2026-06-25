
const express = require("express");

const { services } = require("../config");
const { buildUrl, fetchJson } = require("../lib/http");

const router = express.Router();

router.get("/products/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const headers = {
      "x-request-id": req.requestId,
    };

    if (req.header("authorization")) {
      headers.authorization = req.header("authorization");
    }

    const [productResponse, inventoryResponse] = await Promise.all([
      fetchJson(buildUrl(services.catalog.target, `/products/${productId}`), { headers }),
      fetchJson(buildUrl(services.inventory.target, `/products/${productId}/availability`), { headers }),
    ]);

    if (!productResponse.ok) {
      return res.status(502).json({
        error: "Catalog service failed to provide product data",
        requestId: req.requestId,
        downstream: {
          catalog: {
            status: productResponse.status,
            body: productResponse.body,
          },
        },
      });
    }

    return res.json({
      requestId: req.requestId,
      product: productResponse.body,
      inventory: inventoryResponse.ok ? inventoryResponse.body : null,
      downstream: {
        catalog: productResponse.status,
        inventory: inventoryResponse.status,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;