const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const pool = require("../config/database");
const { generateToken } = require("../utils/tokenGenerator");
const { auditLog } = require("../utils/auditLogger");


// API 1: Tenant Registration
const registerTenant = async (req, res) => {
  const client = await pool.connect();

  try {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } =
      req.body;

    // Validation
    if (
      !tenantName ||
      !subdomain ||
      !adminEmail ||
      !adminPassword ||
      !adminFullName
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (adminPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Validate subdomain format
    if (
      !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain) ||
      subdomain.length < 3
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid subdomain format",
      });
    }

    await client.query("BEGIN");

    // Check if subdomain exists
    const subdomainCheck = await client.query(
      "SELECT id FROM tenants WHERE subdomain = $1",
      [subdomain]
    );

    if (subdomainCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Subdomain already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create tenant
    const tenantId = uuidv4();
    const tenantResult = await client.query(
      `INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, $3, 'active', 'free', 5, 3)
       RETURNING id, name, subdomain, status, subscription_plan`,
      [tenantId, tenantName, subdomain]
    );

    // Create admin user
    const userId = uuidv4();
    const userResult = await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, 'tenant_admin', true)
       RETURNING id, email, full_name, role`,
      [userId, tenantId, adminEmail, passwordHash, adminFullName]
    );

    await client.query("COMMIT");

    // Log the action
    await auditLog(tenantId, userId, "TENANT_REGISTRATION", "tenant", tenantId);

    res.status(201).json({
      success: true,
      message: "Tenant registered successfully",
      data: {
        tenantId: tenantResult.rows[0].id,
        subdomain: tenantResult.rows[0].subdomain,
        adminUser: userResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  } finally {
    client.release();
  }
};

// API 2: User Login
const login = async (req, res) => {
  try {
    const { email, password, tenantSubdomain } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if this is super admin login (no tenant)
    if (!tenantSubdomain || tenantSubdomain.trim() === "") {
      // Super admin login
      const userResult = await pool.query(
        `SELECT id, email, password_hash, full_name, role, is_active, tenant_id
         FROM users WHERE email = $1 AND role = 'super_admin' AND tenant_id IS NULL`,
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const user = userResult.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: "User account is not active",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate token for super admin
      const token = generateToken(user.id, null, user.role);

      // Log the action
      await auditLog(null, user.id, "LOGIN", "user", user.id);

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tenantId: null,
          },
          token,
          expiresIn: 86400,
        },
      });
    }

    // Regular tenant user login
    // Get tenant
    const tenantResult = await pool.query(
      "SELECT id, name, subdomain, status FROM tenants WHERE subdomain = $1",
      [tenantSubdomain]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const tenant = tenantResult.rows[0];

    if (tenant.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Tenant account is not active",
      });
    }

    // Get user
    const userResult = await pool.query(
      `SELECT id, email, password_hash, full_name, role, is_active, tenant_id
       FROM users WHERE email = $1 AND tenant_id = $2`,
      [email, tenant.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is not active",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user.id, user.tenant_id, user.role);

    // Log the action
    await auditLog(user.tenant_id, user.id, "LOGIN", "user", user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
          },
        },
        token,
        expiresIn: 86400,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// API 3: Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.tenant_id,
              t.name, t.subdomain, t.subscription_plan, t.max_users, t.max_projects
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        tenant: user.tenant_id
          ? {
              id: user.tenant_id,
              name: user.name,
              subdomain: user.subdomain,
              subscriptionPlan: user.subscription_plan,
              maxUsers: user.max_users,
              maxProjects: user.max_projects,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
};

// API 4: Logout
const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Log the action
    await auditLog(tenantId, userId, "LOGOUT", "user", userId);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

module.exports = {
  registerTenant,
  login,
  getCurrentUser,
  logout,
};
