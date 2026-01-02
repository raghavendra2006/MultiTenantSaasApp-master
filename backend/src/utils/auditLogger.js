const pool = require("../config/database");

const auditLog = async (
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  ipAddress = null
) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, userId, action, entityType, entityId, ipAddress]
    );
  } catch (error) {
    console.error("Audit logging error:", error);
    // Don't throw - audit logging shouldn't break the operation
  }
};

module.exports = { auditLog };
