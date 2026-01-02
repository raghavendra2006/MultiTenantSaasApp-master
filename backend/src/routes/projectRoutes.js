const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/auth");
const tenantMiddleware = require("../middleware/tenant");

// Project routes
router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  projectController.createProject
);
router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  projectController.listProjects
);
router.put(
  "/:projectId",
  authMiddleware,
  tenantMiddleware,
  projectController.updateProject
);
router.delete(
  "/:projectId",
  authMiddleware,
  tenantMiddleware,
  projectController.deleteProject
);

// Task routes (nested under projects)
router.post(
  "/:projectId/tasks",
  authMiddleware,
  tenantMiddleware,
  taskController.createTask
);
router.get(
  "/:projectId/tasks",
  authMiddleware,
  tenantMiddleware,
  taskController.listProjectTasks
);

module.exports = router;
