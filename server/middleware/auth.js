const authService = require("../services/auth");
const userService = require("../services/user");

const authMiddleware = async (req, res, next) => {
  // Check for static API token (query param or Authorization: Token <tok>)
  const apiToken =
    req.query.token ||
    (req.headers.authorization?.startsWith("Token ") && req.headers.authorization.split(" ")[1]);

  if (apiToken) {
    try {
      const user = await userService.findByToken(apiToken);
      if (!user) return res.status(401).json({ message: "Invalid API token" });

      const { tokenResetAt } = user.dataValues;
      if (!tokenResetAt || Date.now() - new Date(tokenResetAt).getTime() > 24 * 60 * 60 * 1000) {
        return res.status(401).json({ message: "API token expired. Please regenerate." });
      }

      req.user = user.dataValues;
      return next();
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  // Primary: httpOnly cookie
  let token = req.cookies && req.cookies.token;

  // Fallback: Authorization: Bearer <jwt>
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
