const jwt = require("jsonwebtoken");

const generateToken = (userId, tenantId, role) => {
  return jwt.sign(
    {
      userId,
      tenantId,
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );
};

module.exports = { generateToken };
