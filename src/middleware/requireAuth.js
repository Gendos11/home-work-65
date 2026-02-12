function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      message: "Unauthorized. Please log in."
    });
  }

  return next();
}

module.exports = requireAuth;
