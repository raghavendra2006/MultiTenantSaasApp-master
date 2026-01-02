const pool = require("../config/database");
const { auditLog } = require("../utils/auditLogger");

// API 5: Get Tenant Details
const getTenantDetails = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const currentUser = req.user;

    // Authorization check
    if (
      currentUser.role !== "super_admin" &&
      currentUser.tenantId !== tenantId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const tenantResult = await pool.query(
      "SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at FROM tenants WHERE id = $1",
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const tenant = tenantResult.rows[0];

    // Get stats
    const usersCount = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE tenant_id = $1",
      [tenantId]
    );

    const projectsCount = await pool.query(
      "SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1",
      [tenantId]
    );

    const tasksCount = await pool.query(
      "SELECT COUNT(*) as count FROM tasks WHERE tenant_id = $1",
      [tenantId]
    );

    res.status(200).json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        stats: {
          totalUsers: parseInt(usersCount.rows[0].count),
          totalProjects: parseInt(projectsCount.rows[0].count),
          totalTasks: parseInt(tasksCount.rows[0].count),
        },
      },
    });
  } catch (error) {
    console.error("Get tenant details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tenant details",
    });
  }
};

// API 6: Update Tenant
const updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const currentUser = req.user;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    // Authorization check - only tenant_admin of their own tenant or super_admin
    if (
      currentUser.role !== "super_admin" &&
      (currentUser.tenantId !== tenantId || currentUser.role !== "tenant_admin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Tenant admins can only update name
    if (currentUser.role === "tenant_admin") {
      if (status || subscriptionPlan || maxUsers || maxProjects) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions to update those fields",
        });
      }
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (status && currentUser.role === "super_admin") {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (subscriptionPlan && currentUser.role === "super_admin") {
      updates.push(`subscription_plan = $${paramIndex}`);
      values.push(subscriptionPlan);
      paramIndex++;
    }

    if (maxUsers !== undefined && currentUser.role === "super_admin") {
      updates.push(`max_users = $${paramIndex}`);
      values.push(maxUsers);
      paramIndex++;
    }

    if (maxProjects !== undefined && currentUser.role === "super_admin") {
      updates.push(`max_projects = $${paramIndex}`);
      values.push(maxProjects);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(tenantId);

    const query = `UPDATE tenants SET ${updates.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING id, name, updated_at`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Log the action
    await auditLog(
      tenantId,
      currentUser.userId,
      "UPDATE_TENANT",
      "tenant",
      tenantId
    );

    res.status(200).json({
      success: true,
      message: "Tenant updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update tenant error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tenant",
    });
  }
};

// API 7: List All Tenants
const listTenants = async (req, res) => {
  try {
    const currentUser = req.user;

    // Only super_admin can list all tenants
    if (currentUser.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = "SELECT * FROM tenants WHERE 1=1";
    const values = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    if (subscriptionPlan) {
      query += ` AND subscription_plan = $${paramIndex}`;
      values.push(subscriptionPlan);
      paramIndex++;
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM tenants WHERE 1=1${
        status ? ` AND status = $1` : ""
      }${
        subscriptionPlan
          ? ` AND subscription_plan = ${status ? "$2" : "$1"}`
          : ""
      }`,
      status
        ? [status, subscriptionPlan].filter(Boolean)
        : subscriptionPlan
        ? [subscriptionPlan]
        : []
    );

    const total = parseInt(countResult.rows[0].total);

    // Get tenants with pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    values.push(limitNum, offset);

    const result = await pool.query(query, values);

    // Get stats for each tenant
    const tenantsWithStats = await Promise.all(
      result.rows.map(async (tenant) => {
        const usersCount = await pool.query(
          "SELECT COUNT(*) as count FROM users WHERE tenant_id = $1",
          [tenant.id]
        );

        const projectsCount = await pool.query(
          "SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1",
          [tenant.id]
        );

        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          status: tenant.status,
          subscriptionPlan: tenant.subscription_plan,
          totalUsers: parseInt(usersCount.rows[0].count),
          totalProjects: parseInt(projectsCount.rows[0].count),
          createdAt: tenant.created_at,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        tenants: tenantsWithStats,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalTenants: total,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("List tenants error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list tenants",
    });
  }
};

module.exports = {
  getTenantDetails,
  updateTenant,
  listTenants,
};
