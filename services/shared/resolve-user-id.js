function resolveUserId(req) {
  return req.header("x-user-id") || req.header("x-mock-user-id") || "user-123";
}

module.exports = {
  resolveUserId,
};