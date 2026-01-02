const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { handleValidationErrors } = require("../utils/validators");
const authMiddleware = require("../middleware/auth");

// Public routes
router.post("/register-tenant", authController.registerTenant);
router.post("/login", authController.login);

// Protected routes
router.get("/me", authMiddleware, authController.getCurrentUser);
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;

