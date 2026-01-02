const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");
const { auditLog } = require("../utils/auditLogger");

// API 12: Create Project
const createProject = async (req, res) => {
  try {
    const currentUser = req.user;
    const { name, description, status = "active" } = req.body;

    // Authorization check - only tenant_admin can create projects; super_admin is read-only
    if (currentUser.role !== "tenant_admin") {
      return res.status(403).json({
        success: false,
        message: "Only tenant admins can create projects",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const tenantId = currentUser.tenantId;

    // Check subscription limit
    const projectCountResult = await pool.query(
      "SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1",
      [tenantId]
    );

    const tenantResult = await pool.query(
      "SELECT max_projects FROM tenants WHERE id = $1",
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const currentCount = parseInt(projectCountResult.rows[0].count);
    const maxProjects = tenantResult.rows[0].max_projects;

    if (currentCount >= maxProjects) {
      return res.status(403).json({
        success: false,
        message: "Project limit reached for your subscription plan",
      });
    }

    // Create project
    const projectId = uuidv4();
    const result = await pool.query(
      `INSERT INTO projects (id, tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tenant_id, name, description, status, created_by, created_at`,
      [
        projectId,
        tenantId,
        name,
        description || null,
        status,
        currentUser.userId,
      ]
    );

    // Log the action
    await auditLog(
      tenantId,
      currentUser.userId,
      "CREATE_PROJECT",
      "project",
      projectId
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        tenantId: result.rows[0].tenant_id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        status: result.rows[0].status,
        createdBy: result.rows[0].created_by,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

// API 13: List Projects
const listProjects = async (req, res) => {
  try {
    const currentUser = req.user;
    const { status, search, page = 1, limit = 20 } = req.query;
    const tenantId = currentUser.tenantId;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Super admin sees all projects, regular users see only their tenant's projects
    let query = `SELECT p.id, p.name, p.description, p.status, p.created_by, p.created_at, u.full_name
                 FROM projects p
                 LEFT JOIN users u ON p.created_by = u.id`;

    const values = [];
    let paramIndex = 1;
    let whereAdded = false;

    // Add tenant filter for non-super-admin users
    if (currentUser.role !== "super_admin") {
      query += ` WHERE p.tenant_id = $${paramIndex}`;
      values.push(tenantId);
      paramIndex++;
      whereAdded = true;
    }

    if (status) {
      const keyword = whereAdded ? "AND" : "WHERE";
      query += ` ${keyword} p.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
      whereAdded = true;
    }

    if (search) {
      const keyword = whereAdded ? "AND" : "WHERE";
      query += ` ${keyword} LOWER(p.name) LIKE LOWER($${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
      whereAdded = true;
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM projects`;
    const countValues = [];
    let countParamIndex = 1;
    let countWhereAdded = false;

    // Add tenant filter for non-super-admin users
    if (currentUser.role !== "super_admin") {
      countQuery += ` WHERE tenant_id = $${countParamIndex}`;
      countValues.push(tenantId);
      countParamIndex++;
      countWhereAdded = true;
    }

    if (status) {
      const keyword = countWhereAdded ? "AND" : "WHERE";
      countQuery += ` ${keyword} status = $${countParamIndex}`;
      countValues.push(status);
      countParamIndex++;
      countWhereAdded = true;
    }

    if (search) {
      const keyword = countWhereAdded ? "AND" : "WHERE";
      countQuery += ` ${keyword} LOWER(name) LIKE LOWER($${countParamIndex})`;
      countValues.push(`%${search}%`);
      countParamIndex++;
      countWhereAdded = true;
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);

    // Get projects
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    values.push(limitNum, offset);

    const result = await pool.query(query, values);

    // Get task counts for each project
    const projectsWithStats = await Promise.all(
      result.rows.map(async (project) => {
        const taskCountResult = await pool.query(
          "SELECT COUNT(*) as total, SUM(CASE WHEN status = $1 THEN 1 ELSE 0 END) as completed FROM tasks WHERE project_id = $2",
          ["completed", project.id]
        );

        const stats = taskCountResult.rows[0];

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          createdBy: {
            id: project.created_by,
            fullName: project.full_name,
          },
          taskCount: parseInt(stats.total) || 0,
          completedTaskCount: parseInt(stats.completed) || 0,
          createdAt: project.created_at,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        projects: projectsWithStats,
        total,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("List projects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list projects",
    });
  }
};

// API 14: Update Project
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;
    const { name, description, status } = req.body;

    // Get project
    const projectResult = await pool.query(
      "SELECT id, tenant_id, created_by FROM projects WHERE id = $1",
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
    if (currentUser.tenantId !== project.tenant_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      currentUser.role !== "tenant_admin" &&
      currentUser.userId !== project.created_by
    ) {
      return res.status(403).json({
        success: false,
        message: "Only tenant admin or project creator can update",
      });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
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

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(projectId);

    const query = `UPDATE projects SET ${updates.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING id, name, description, status, updated_at`;

    const result = await pool.query(query, values);

    // Log the action
    await auditLog(
      project.tenant_id,
      currentUser.userId,
      "UPDATE_PROJECT",
      "project",
      projectId
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};

// API 15: Delete Project
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // Get project
    const projectResult = await pool.query(
      "SELECT id, tenant_id, created_by FROM projects WHERE id = $1",
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
    if (currentUser.tenantId !== project.tenant_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (
      currentUser.role !== "tenant_admin" &&
      currentUser.userId !== project.created_by
    ) {
      return res.status(403).json({
        success: false,
        message: "Only tenant admin or project creator can delete",
      });
    }

    // Delete project (cascades to tasks)
    await pool.query("DELETE FROM projects WHERE id = $1", [projectId]);

    // Log the action
    await auditLog(
      project.tenant_id,
      currentUser.userId,
      "DELETE_PROJECT",
      "project",
      projectId
    );

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
};

module.exports = {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
};
