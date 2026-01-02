const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");
const tenantMiddleware = require("../middleware/tenant");

// Tenant routes
router.get(
  "/:tenantId",
  authMiddleware,
  tenantMiddleware,
  tenantController.getTenantDetails
);
router.put(
  "/:tenantId",
  authMiddleware,
  tenantMiddleware,
  tenantController.updateTenant
);
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  tenantController.listTenants
);

// User routes (nested under tenants)
router.post(
  "/:tenantId/users",
  authMiddleware,
  tenantMiddleware,
  userController.addUserToTenant
);
router.get(
  "/:tenantId/users",
  authMiddleware,
  tenantMiddleware,
  userController.listTenantUsers
);

module.exports = router;
