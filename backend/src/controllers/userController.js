const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");
const { auditLog } = require("../utils/auditLogger");

// API 8: Add User to Tenant
const addUserToTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const currentUser = req.user;
    const { email, password, fullName, role = "user" } = req.body;

    // Authorization check
    if (
      currentUser.role !== "tenant_admin" ||
      currentUser.tenantId !== tenantId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Check subscription limit
    const userCountResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE tenant_id = $1",
      [tenantId]
    );

    const tenantResult = await pool.query(
      "SELECT max_users FROM tenants WHERE id = $1",
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const currentCount = parseInt(userCountResult.rows[0].count);
    const maxUsers = tenantResult.rows[0].max_users;

    if (currentCount >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: "Subscription limit reached",
      });
    }

    // Check if email already exists in this tenant
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE tenant_id = $1 AND email = $2",
      [tenantId, email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists in this tenant",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const result = await pool.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [userId, tenantId, email, passwordHash, fullName, role]
    );

    // Log the action
    await auditLog(tenantId, currentUser.userId, "CREATE_USER", "user", userId);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        role: result.rows[0].role,
        tenantId: tenantId,
        isActive: result.rows[0].is_active,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error("Add user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// API 9: List Tenant Users
const listTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const currentUser = req.user;
    const { search, role, page = 1, limit = 50 } = req.query;

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

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query =
      "SELECT id, email, full_name, role, is_active, created_at FROM users WHERE tenant_id = $1";
    const values = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (LOWER(full_name) LIKE LOWER($${paramIndex}) OR LOWER(email) LIKE LOWER($${paramIndex}))`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      values.push(role);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users WHERE tenant_id = $1${
      search
        ? ` AND (LOWER(full_name) LIKE LOWER($2) OR LOWER(email) LIKE LOWER($2))`
        : ""
    }${role ? ` AND role = ${search ? "$3" : "$2"}` : ""}`;
    const countValues = [tenantId];
    if (search) countValues.push(`%${search}%`);
    if (role) countValues.push(role);

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);

    // Get users
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    values.push(limitNum, offset);

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      data: {
        users: result.rows.map((user) => ({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
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
    console.error("List users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list users",
    });
  }
};

// API 10: Update User
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    const { fullName, role, isActive } = req.body;

    // Super admin is read-only
    if (currentUser.role === "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Super admin cannot modify users",
      });
    }

    // Get user to verify tenant
    const userResult = await pool.query(
      "SELECT id, tenant_id FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    // Authorization check
    if (currentUser.tenantId !== user.tenant_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Only tenant_admin can update other users
    if (currentUser.role !== "tenant_admin" && currentUser.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Users can only update their own fullName
    if (
      currentUser.userId !== userId &&
      (role !== undefined || isActive !== undefined)
    ) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (fullName) {
      updates.push(`full_name = $${paramIndex}`);
      values.push(fullName);
      paramIndex++;
    }

    if (role !== undefined && currentUser.role === "tenant_admin") {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (isActive !== undefined && currentUser.role === "tenant_admin") {
      updates.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING id, full_name, role, updated_at`;

    const result = await pool.query(query, values);

    // Log the action
    await auditLog(
      user.tenant_id,
      currentUser.userId,
      "UPDATE_USER",
      "user",
      userId
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// API 11: Delete User
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Get user to verify tenant
    const userResult = await pool.query(
      "SELECT id, tenant_id, role FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    // Authorization check: super_admin read-only; only tenant_admin of same tenant can delete
    if (
      currentUser.role !== "tenant_admin" ||
      currentUser.tenantId !== user.tenant_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Cannot delete self
    if (currentUser.userId === userId) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete yourself",
      });
    }

    // Reassign project ownership to current admin to satisfy NOT NULL FK
    await pool.query(
      "UPDATE projects SET created_by = $1 WHERE tenant_id = $2 AND created_by = $3",
      [currentUser.userId, user.tenant_id, userId]
    );

    // Delete user
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    // Log the action
    await auditLog(
      user.tenant_id,
      currentUser.userId,
      "DELETE_USER",
      "user",
      userId
    );

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// API X: List All Users (Super Admin)
const listAllUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    const { search, role, page = 1, limit = 50 } = req.query;

    if (currentUser.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query =
      "SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at, t.id as tenant_id, t.name as tenant_name FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id";
    const values = [];
    let whereAdded = false;
    let paramIndex = 1;

    if (search) {
      query += ` WHERE (LOWER(u.full_name) LIKE LOWER($${paramIndex}) OR LOWER(u.email) LIKE LOWER($${paramIndex}))`;
      values.push(`%${search}%`);
      whereAdded = true;
      paramIndex++;
    }

    if (role) {
      query += ` ${whereAdded ? "AND" : "WHERE"} u.role = $${paramIndex}`;
      values.push(role);
      whereAdded = true;
      paramIndex++;
    }

    // Count
    let countQuery = "SELECT COUNT(*) as total FROM users";
    const countValues = [];
    let countWhereAdded = false;
    let countParamIndex = 1;
    if (search) {
      countQuery += ` WHERE (LOWER(full_name) LIKE LOWER($${countParamIndex}) OR LOWER(email) LIKE LOWER($${countParamIndex}))`;
      countValues.push(`%${search}%`);
      countWhereAdded = true;
      countParamIndex++;
    }
    if (role) {
      countQuery += ` ${
        countWhereAdded ? "AND" : "WHERE"
      } role = $${countParamIndex}`;
      countValues.push(role);
      countParamIndex++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    values.push(limitNum, offset);

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      data: {
        users: result.rows.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          isActive: u.is_active,
          tenantId: u.tenant_id,
          tenantName: u.tenant_name,
          createdAt: u.created_at,
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
    console.error("List all users error:", error);
    res.status(500).json({ success: false, message: "Failed to list users" });
  }
};

module.exports = {
  addUserToTenant,
  listTenantUsers,
  updateUser,
  deleteUser,
  listAllUsers,
};
