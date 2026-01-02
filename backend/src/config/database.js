const { Pool } = require("pg");
require("dotenv").config();

// Use DATABASE_URL for production (Render) or individual vars for local development
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Required for Render PostgreSQL
        },
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || "saas_db",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
      }
);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
