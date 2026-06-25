function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || "Unexpected gateway error";

  return res.status(status).json({
    error: message,
    requestId: req.requestId,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};