const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");
const tenantMiddleware = require("../middleware/tenant");

// Task routes
router.patch(
  "/:taskId/status",
  authMiddleware,
  tenantMiddleware,
  taskController.updateTaskStatus
);
router.put(
  "/:taskId",
  authMiddleware,
  tenantMiddleware,
  taskController.updateTask
);
router.delete(
  "/:taskId",
  authMiddleware,
  tenantMiddleware,
  taskController.deleteTask
);

module.exports = router;
