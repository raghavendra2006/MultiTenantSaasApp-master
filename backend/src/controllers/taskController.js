const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");
const { auditLog } = require("../utils/auditLogger");


// API 16: Create Task
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;
    const {
      title,
      description,
      assignedTo,
      priority = "medium",
      dueDate,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    // Get project to verify tenant
    const projectResult = await pool.query(
      "SELECT id, tenant_id FROM projects WHERE id = $1",
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = projectResult.rows[0];
    const tenantId = project.tenant_id;

    // Authorization check - only tenant_admin can create tasks; super_admin is read-only
    if (currentUser.role !== "tenant_admin") {
      return res.status(403).json({
        success: false,
        message: "Only tenant admins can create tasks",
      });
    }

    if (currentUser.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // If assignedTo provided, verify user belongs to same tenant
    if (assignedTo) {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND tenant_id = $2",
        [assignedTo, tenantId]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Assigned user does not belong to this tenant",
        });
      }
    }

    // Create task
    const taskId = uuidv4();
    const result = await pool.query(
      `INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7, $8)
       RETURNING id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at`,
      [
        taskId,
        projectId,
        tenantId,
        title,
        description || null,
        priority,
        assignedTo || null,
        dueDate || null,
      ]
    );

    // Log the action
    await auditLog(tenantId, currentUser.userId, "CREATE_TASK", "task", taskId);

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        projectId: result.rows[0].project_id,
        tenantId: result.rows[0].tenant_id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        status: result.rows[0].status,
        priority: result.rows[0].priority,
        assignedTo: result.rows[0].assigned_to,
        dueDate: result.rows[0].due_date,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};

// API 17: List Project Tasks
const listProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;
    const {
      status,
      assignedTo,
      priority,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    // Get project to verify tenant
    const projectResult = await pool.query(
      "SELECT id, tenant_id FROM projects WHERE id = $1",
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = projectResult.rows[0];

    // Authorization check
    if (
      currentUser.tenantId !== project.tenant_id &&
      currentUser.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = `SELECT t.id, t.title, t.description, t.status, t.priority, t.assigned_to, t.due_date, t.created_at, u.full_name, u.email
                 FROM tasks t
                 LEFT JOIN users u ON t.assigned_to = u.id
                 WHERE t.project_id = $1`;
    const values = [projectId];
    let paramIndex = 2;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (assignedTo) {
      query += ` AND t.assigned_to = $${paramIndex}`;
      values.push(assignedTo);
      paramIndex++;
    }

    if (priority) {
      query += ` AND t.priority = $${paramIndex}`;
      values.push(priority);
      paramIndex++;
    }

    if (search) {
      query += ` AND LOWER(t.title) LIKE LOWER($${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM tasks WHERE project_id = $1`;
    const countValues = [projectId];

    if (status) {
      countQuery += ` AND status = $${countValues.length + 1}`;
      countValues.push(status);
    }

    if (assignedTo) {
      countQuery += ` AND assigned_to = $${countValues.length + 1}`;
      countValues.push(assignedTo);
    }

    if (priority) {
      countQuery += ` AND priority = $${countValues.length + 1}`;
      countValues.push(priority);
    }

    if (search) {
      countQuery += ` AND LOWER(title) LIKE LOWER($${countValues.length + 1})`;
      countValues.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);

    // Get tasks
    query += ` ORDER BY 
      CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END DESC,
      COALESCE(t.due_date, '2099-12-31') ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limitNum, offset);

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      data: {
        tasks: result.rows.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assigned_to
            ? {
                id: task.assigned_to,
                fullName: task.full_name,
                email: task.email,
              }
            : null,
          dueDate: task.due_date,
          createdAt: task.created_at,
        })),
        total,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("List tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list tasks",
    });
  }
};

// API 18: Update Task Status
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Get task
    const taskResult = await pool.query(
      "SELECT id, tenant_id, project_id, assigned_to FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const task = taskResult.rows[0];

    // Authorization check: tenant_admin always allowed; users may update status only if assigned; super_admin read-only
    if (currentUser.role === "super_admin") {
      return res
        .status(403)
        .json({ success: false, message: "Super admin is read-only" });
    }

    if (currentUser.role === "tenant_admin") {
      if (currentUser.tenantId !== task.tenant_id) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    } else {
      // Regular user path: must belong to tenant AND (be assigned to task OR task is unassigned)
      if (currentUser.tenantId !== task.tenant_id) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied - not your tenant" });
      }

      // Check if user can update: allowed if task is unassigned OR user is assigned to it
      if (task.assigned_to && currentUser.userId !== task.assigned_to) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Access denied - not assigned to this task",
          });
      }
    }

    // Update task status
    const result = await pool.query(
      `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status, updated_at`,
      [status, taskId]
    );

    // Log the action
    await auditLog(
      task.tenant_id,
      currentUser.userId,
      "UPDATE_TASK_STATUS",
      "task",
      taskId
    );

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task status",
    });
  }
};

// API 19: Update Task
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user;
    const { title, description, status, priority, assignedTo, dueDate } =
      req.body;

    // Get task
    const taskResult = await pool.query(
      "SELECT id, tenant_id, project_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const task = taskResult.rows[0];

    // Authorization check: only tenant_admin can update full task details; super_admin read-only
    if (currentUser.role !== "tenant_admin") {
      return res.status(403).json({
        success: false,
        message: "Only tenant admins can update tasks",
      });
    }

    if (currentUser.tenantId !== task.tenant_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // If assignedTo provided, verify user belongs to same tenant
    if (assignedTo) {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND tenant_id = $2",
        [assignedTo, task.tenant_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Assigned user does not belong to this tenant",
        });
      }
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title) {
      updates.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description || null);
      paramIndex++;
    }

    if (status) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (priority) {
      updates.push(`priority = $${paramIndex}`);
      values.push(priority);
      paramIndex++;
    }

    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`);
      values.push(assignedTo || null);
      paramIndex++;
    }

    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex}`);
      values.push(dueDate || null);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(taskId);

    const query = `UPDATE tasks SET ${updates.join(
      ", "
    )} WHERE id = $${paramIndex} 
                   RETURNING id, title, description, status, priority, assigned_to, due_date, updated_at`;

    const result = await pool.query(query, values);

    // Get assigned user details if needed
    let assignedUserData = null;
    if (result.rows[0].assigned_to) {
      const userResult = await pool.query(
        "SELECT id, full_name, email FROM users WHERE id = $1",
        [result.rows[0].assigned_to]
      );
      if (userResult.rows.length > 0) {
        assignedUserData = {
          id: userResult.rows[0].id,
          fullName: userResult.rows[0].full_name,
          email: userResult.rows[0].email,
        };
      }
    }

    // Log the action
    await auditLog(
      task.tenant_id,
      currentUser.userId,
      "UPDATE_TASK",
      "task",
      taskId
    );

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        status: result.rows[0].status,
        priority: result.rows[0].priority,
        assignedTo: assignedUserData,
        dueDate: result.rows[0].due_date,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
};

// API 20: Delete Task (Added - was missing)
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user;

    // Get task
    const taskResult = await pool.query(
      "SELECT id, project_id, tenant_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const task = taskResult.rows[0];

    // Authorization check - only tenant_admin can delete; super_admin is read-only
    if (
      currentUser.role !== "tenant_admin" ||
      currentUser.tenantId !== task.tenant_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this task",
      });
    }

    // Delete task
    await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);

    // Log the action
    await auditLog(
      task.tenant_id,
      currentUser.userId,
      "DELETE_TASK",
      "task",
      taskId
    );

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
};

module.exports = {
  createTask,
  listProjectTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
};
