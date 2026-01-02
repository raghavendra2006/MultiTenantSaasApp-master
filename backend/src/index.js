require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const pool = require("./config/database");
const { initializeDatabase } = require("./config/migrations");

// Import routes
const authRoutes = require("./routes/authRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("combined"));

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");
    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

// Serve static frontend files (AFTER API routes to prevent conflicts)
const frontendBuildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendBuildPath));

// Serve React app for any non-API route (enables client-side routing)
app.get("*", (req, res) => {
  // Don't serve HTML for API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API route not found",
    });
  }
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("Initializing database...");
    await initializeDatabase();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
