const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");
const tenantMiddleware = require("../middleware/tenant");

// User routes
router.get("/", authMiddleware, tenantMiddleware, userController.listAllUsers);
router.put(
  "/:userId",
  authMiddleware,
  tenantMiddleware,
  userController.updateUser
);
router.delete(
  "/:userId",
  authMiddleware,
  tenantMiddleware,
  userController.deleteUser
);

module.exports = router;
