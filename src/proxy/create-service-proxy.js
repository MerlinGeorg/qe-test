const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function buildTargetUrl(service, req) {
  return new URL(req.url || "/", service.target).toString();
}

function buildForwardHeaders(req) {
  const headers = { ...req.headers };

  for (const headerName of HOP_BY_HOP_HEADERS) {
    delete headers[headerName];
  }

  headers["x-request-id"] = req.requestId;

  if (req.user && req.user.sub) {
    headers["x-user-id"] = String(req.user.sub);
  }

  if (req.user && req.user.roles) {
    headers["x-user-roles"] = Array.isArray(req.user.roles)
      ? req.user.roles.join(",")
      : String(req.user.roles);
  }

  return headers;
}

function buildRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  if (req.body == null) {
    return undefined;
  }

  if (Buffer.isBuffer(req.body) || typeof req.body === "string") {
    return req.body;
  }

  return JSON.stringify(req.body);
}

function copyResponseHeaders(response, res) {
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      res.setHeader(key, value);
    }
  });
}

function writeProxyError(service, req, res, error) {
  if (!res.headersSent) {
    res.status(502).json({
      error: `Downstream ${service.name} service is unavailable`,
      requestId: req.requestId,
      details: error.message,
    });
    return;
  }

  res.end();
}

function createServiceProxy(service) {
  return async (req, res) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      const response = await fetch(buildTargetUrl(service, req), {
        method: req.method,
        headers: buildForwardHeaders(req),
        body: buildRequestBody(req),
        signal: controller.signal,
      });

      const responseBody = Buffer.from(await response.arrayBuffer());

      copyResponseHeaders(response, res);
      res.status(response.status).send(responseBody);
    } catch (error) {
      writeProxyError(service, req, res, error);
    } finally {
      clearTimeout(timeout);
    }
  };
}

module.exports = {
  createServiceProxy,
};