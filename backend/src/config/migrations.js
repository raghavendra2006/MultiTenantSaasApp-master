const fs = require("fs");
const path = require("path");
const pool = require("./database");

async function runMigrations() {
  console.log("Starting database migrations...");
  const migrationsDir = path.join(__dirname, "../../migrations");

  try {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      console.log(`Running migration: ${file}`);

      // Split SQL by semicolons and execute each statement
      const statements = sql
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      console.log(`  Found ${statements.length} SQL statements in ${file}`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          console.log(`  Executing statement ${i + 1}/${statements.length}...`);
          await pool.query(stmt);
          console.log(`  ✓ Statement ${i + 1} completed`);
        } catch (error) {
          console.error(`  ✗ Statement ${i + 1} failed:`, error.message);
          throw error;
        }
      }

      console.log(`✓ Migration ${file} completed`);
    }

    console.log("✓ All migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

async function loadSeedData() {
  console.log("Loading seed data...");
  const seedFile = path.join(__dirname, "../../seeds/seed_data.sql");

  try {
    const sql = fs.readFileSync(seedFile, "utf8");

    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }

    console.log("✓ Seed data loaded successfully");
  } catch (error) {
    console.error("Seed data loading failed:", error);
    throw error;
  }
}

async function initializeDatabase() {
  try {
    // Test connection with retry
    let retries = 0;
    while (retries < 10) {
      try {
        const result = await pool.query("SELECT NOW()");
        console.log("Database connection successful");
        break;
      } catch (err) {
        retries++;
        if (retries < 10) {
          console.log(`Connection attempt ${retries}/10 failed, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          throw err;
        }
      }
    }

    // Run migrations
    await runMigrations();

    // Load seed data
    await loadSeedData();

    console.log("✓ Database initialization complete");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

module.exports = { initializeDatabase, pool };
