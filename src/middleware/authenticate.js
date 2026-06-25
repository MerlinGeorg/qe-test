const jwt = require("jsonwebtoken");

const { publicRouteRules, security } = require("../config");

function isPublicRoute(req) {
  return publicRouteRules.some((rule) => {
    const methodMatches = !rule.method || rule.method === req.method;
    return methodMatches && rule.pattern.test(req.path);
  });
}

function authenticate(req, res, next) {
  if (!security.requireAuth || isPublicRoute(req)) {
    return next();
  }

  const authorization = req.header("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid bearer token",
      requestId: req.requestId,
    });
  }

  try {
    const verifyOptions = {};

    if (security.jwtIssuer) {
      verifyOptions.issuer = security.jwtIssuer;
    }

    if (security.jwtAudience) {
      verifyOptions.audience = security.jwtAudience;
    }

    const payload = jwt.verify(token, security.jwtSecret, verifyOptions);

    req.user = payload;

    if (payload.sub) {
      req.headers["x-user-id"] = String(payload.sub);
    }

    if (payload.roles) {
      const roles = Array.isArray(payload.roles) ? payload.roles.join(",") : String(payload.roles);
      req.headers["x-user-roles"] = roles;
    }

    return next();
  } catch {
    return res.status(401).json({
      error: "Token validation failed",
      requestId: req.requestId,
    });
  }
}

module.exports = {
  authenticate,
};