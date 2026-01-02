const pool = require("../config/database");

const tenantMiddleware = async (req, res, next) => {
  try {
    // Allow super admins to bypass tenant checks
    if (req.user.role === "super_admin") {
      req.tenantId = null;
      return next();
    }

    // For other users, set tenant from JWT
    req.tenantId = req.user.tenantId;

    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID not found in user context",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = tenantMiddleware;
