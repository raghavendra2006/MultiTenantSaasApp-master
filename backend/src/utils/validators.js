const { body, validationResult } = require("express-validator");

const validateEmail = body("email")
  .isEmail()
  .normalizeEmail()
  .withMessage("Invalid email format");

const validatePassword = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters");

const validateTenantName = body("tenantName")
  .notEmpty()
  .trim()
  .withMessage("Tenant name is required");

const validateSubdomain = body("subdomain")
  .matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
  .isLength({ min: 3, max: 63 })
  .withMessage("Invalid subdomain format");

const validateFullName = body("fullName")
  .notEmpty()
  .trim()
  .withMessage("Full name is required");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateTenantName,
  validateSubdomain,
  validateFullName,
  handleValidationErrors,
};
