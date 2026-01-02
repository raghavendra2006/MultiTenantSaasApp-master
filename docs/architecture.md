# Architecture Documentation - Multi-Tenant SaaS Platform

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Tier (Frontend)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React 18 SPA (Navbar, Dashboard, Projects, Tasks, Users)  │ │
│  │  Context API for Auth State Management                      │ │
│  │  Axios with JWT Interceptors                               │ │
│  │  Tailwind CSS Styling                                      │ │
│  │  Port: 3000                                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS/REST
┌─────────────────────────────▼───────────────────────────────────┐
│                 API Gateway / Load Balancer                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Reverse Proxy (Nginx/HAProxy)                             │ │
│  │  CORS Enforcement                                          │ │
│  │  SSL/TLS Termination                                       │ │
│  │  Request Rate Limiting                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/TCP
┌─────────────────────────────▼───────────────────────────────────┐
│                  Backend Application Tier                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          Node.js + Express Application (Port 5000)         │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │         Middleware Stack (In Order)                  │ │ │
│  │  │  1. CORS Middleware (Dynamic Origin)                │ │ │
│  │  │  2. Body Parser (JSON/Form)                          │ │ │
│  │  │  3. Morgan Logger (HTTP Request Logging)            │ │ │
│  │  │  4. Authentication Middleware (JWT Validation)      │ │ │
│  │  │  5. Tenant Context Middleware (req.tenantId)        │ │ │
│  │  │  6. Role-Based Authorization Middleware             │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Route Handlers / Controllers                        │ │ │
│  │  │  • authController (APIs 1-4): Login, Register       │ │ │
│  │  │  • tenantController (APIs 5-7): Tenant Mgmt         │ │ │
│  │  │  • userController (APIs 8-11): User Mgmt            │ │ │
│  │  │  • projectController (APIs 12-15): Project Mgmt     │ │ │
│  │  │  • taskController (APIs 16-19): Task Mgmt           │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Utility Modules                                     │ │ │
│  │  │  • validators.js: Input validation                  │ │ │
│  │  │  • auditLogger.js: Action logging                   │ │ │
│  │  │  • tokenGenerator.js: JWT creation                  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ TCP Connection Pool
┌─────────────────────────────▼───────────────────────────────────┐
│               Database Tier (PostgreSQL 15)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Primary Database Instance                                 │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Tables:                                             │ │ │
│  │  │  • tenants (id, name, subdomain, status, plan)      │ │ │
│  │  │  • users (id, tenant_id, email, password, role)     │ │ │
│  │  │  • projects (id, tenant_id, name, created_by)       │ │ │
│  │  │  • tasks (id, project_id, tenant_id, assigned_to)   │ │ │
│  │  │  • audit_logs (id, tenant_id, user_id, action)      │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Indexes:                                            │ │ │
│  │  │  • (tenant_id, status) on projects                  │ │ │
│  │  │  • (tenant_id, email) on users                      │ │ │
│  │  │  • (project_id) on tasks                            │ │ │
│  │  │  • (tenant_id, created_at) on audit_logs            │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  Port: 5432 (Default)                                     │ │
│  │  Volume: postgres_data (Persistent Storage)               │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## 2. Component Architecture

### 2.1 Frontend Architecture

```
React Application (3000)
├── Components/
│   ├── Navbar.js (Navigation, User Menu)
│   ├── ProtectedRoute.js (Authorization Wrapper)
│   └── (Future: Common UI components)
├── Pages/
│   ├── Register.js (Tenant Registration)
│   ├── Login.js (User Authentication)
│   ├── Dashboard.js (Home Page with Stats)
│   ├── Projects.js (Project Listing & CRUD)
│   ├── ProjectDetails.js (Task Management)
│   └── Users.js (User Management - Admin Only)
├── Context/
│   └── AuthContext.js (Global Auth State)
│       ├── user (Current user info)
│       ├── loading (Initial load state)
│       ├── login() (Authenticate user)
│       ├── logout() (Clear session)
│       └── registerTenant() (Create organization)
├── Utils/
│   └── api.js (Axios instance with Interceptors)
│       ├── Request: Add JWT to Authorization header
│       └── Response: Redirect to /login on 401
└── App.js (Router Configuration)
    ├── Route: /register (Public)
    ├── Route: /login (Public)
    ├── Route: /dashboard (Protected)
    ├── Route: /projects (Protected)
    ├── Route: /projects/:projectId (Protected)
    └── Route: /users (Protected, Admin Only)
```

### 2.2 Backend Architecture

```
Express Application (5000)
├── src/
│   ├── config/
│   │   ├── database.js (PostgreSQL Pool)
│   │   └── migrations.js (Auto-run SQL migrations)
│   ├── middleware/
│   │   ├── auth.js (JWT Validation)
│   │   ├── role.js (RBAC Enforcement)
│   │   ├── tenant.js (Tenant Context Injection)
│   │   └── validators.js (Input Validation)
│   ├── controllers/
│   │   ├── authController.js (APIs 1-4)
│   │   ├── tenantController.js (APIs 5-7)
│   │   ├── userController.js (APIs 8-11)
│   │   ├── projectController.js (APIs 12-15)
│   │   └── taskController.js (APIs 16-19)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── tenantRoutes.js
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── utils/
│   │   ├── auditLogger.js (Action Logging)
│   │   ├── tokenGenerator.js (JWT Creation)
│   │   └── validators.js (Validation Rules)
│   └── index.js (Application Entry Point)
├── migrations/ (SQL Migration Files)
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   ├── 003_create_projects.sql
│   ├── 004_create_tasks.sql
│   └── 005_create_audit_logs.sql
├── seeds/ (Test Data)
│   └── seed_data.sql
├── Dockerfile (Container Image)
└── docker-compose.yml (Orchestration)
```

## 3. Data Model and Entity Relationships

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      tenants                                │
├─────────────────────────────────────────────────────────────┤
│ id (UUID) [PK]                                              │
│ name (VARCHAR)                                              │
│ subdomain (VARCHAR) [UNIQUE]                                │
│ status (ENUM: active, suspended, deleted)                   │
│ subscription_plan (VARCHAR: starter, pro, enterprise)       │
│ max_users (INTEGER)                                         │
│ max_projects (INTEGER)                                      │
│ created_at, updated_at (TIMESTAMP)                          │
└────────────┬────────────────────────────────────────────────┘
             │
             │ 1:N (Foreign Key)
             │
    ┌────────▼─────────┬────────────────────────────────┐
    │                  │                                │
┌───┴──────────────────┴──────────────┐   ┌────────────┴──────────────────────┐
│         users                       │   │         projects                   │
├─────────────────────────────────────┤   ├────────────────────────────────────┤
│ id (UUID) [PK]                      │   │ id (UUID) [PK]                     │
│ tenant_id (UUID) [FK→tenants]       │   │ tenant_id (UUID) [FK→tenants]      │
│ email (VARCHAR)                     │   │ name (VARCHAR)                     │
│ password_hash (VARCHAR)             │   │ description (TEXT)                 │
│ full_name (VARCHAR)                 │   │ status (VARCHAR)                   │
│ role (ENUM: admin, user)            │   │ created_by (UUID) [FK→users]       │
│ is_active (BOOLEAN)                 │   │ created_at, updated_at (TIMESTAMP) │
│ created_at, updated_at (TIMESTAMP)  │   │                                    │
│ UNIQUE(tenant_id, email)            │   │ INDEX (tenant_id, status)          │
│                                     │   │ INDEX (created_by)                 │
└─────┬───────────────────────────────┘   └────────────┬──────────────────────┘
      │                                                │
      │ 1:N (Foreign Key)                             │ 1:N (Foreign Key)
      │ (can create tasks, audit logs)                │
      │                                                │
      └──────────────────────┬───────────────────────┬─────────────────┐
                             │                       │                 │
                             │                   ┌───┴──────────────────┴──────────────┐
                             │                   │         tasks                      │
                             │                   ├────────────────────────────────────┤
                             │                   │ id (UUID) [PK]                     │
                             │                   │ project_id (UUID) [FK→projects]    │
                             │                   │ tenant_id (UUID) [FK→tenants]      │
                             │                   │ title (VARCHAR)                    │
                             │                   │ description (TEXT)                 │
                             │                   │ status (ENUM: todo, in_progress)   │
                             │                   │ priority (ENUM: low, medium, high) │
                             │                   │ assigned_to (UUID) [FK→users]      │
                             │                   │ due_date (DATE)                    │
                             │                   │ created_at, updated_at (TIMESTAMP) │
                             │                   │                                    │
                             │                   │ INDEX (project_id)                 │
                             │                   │ INDEX (assigned_to)                │
                             │                   │ INDEX (status)                     │
                             │                   └────────────────────────────────────┘
                             │
                    ┌────────▼─────────────────────────────────────┐
                    │      audit_logs                              │
                    ├────────────────────────────────────────────────┤
                    │ id (UUID) [PK]                               │
                    │ tenant_id (UUID) [FK→tenants]                │
                    │ user_id (UUID) [FK→users]                    │
                    │ action (VARCHAR: create, update, delete)      │
                    │ entity_type (VARCHAR: user, project, task)    │
                    │ entity_id (UUID)                             │
                    │ ip_address (VARCHAR)                         │
                    │ created_at (TIMESTAMP)                       │
                    │                                              │
                    │ INDEX (tenant_id, created_at)                │
                    │ INDEX (user_id, created_at)                  │
                    └────────────────────────────────────────────────┘
```

### 3.2 Key Relationships

| Relationship         | Type | Description                                   |
| -------------------- | ---- | --------------------------------------------- |
| tenants → users      | 1:N  | One organization has many users               |
| tenants → projects   | 1:N  | One organization has many projects            |
| tenants → tasks      | 1:N  | One organization has many tasks               |
| tenants → audit_logs | 1:N  | One organization generates many audit entries |
| projects → tasks     | 1:N  | One project has many tasks; CASCADE DELETE    |
| users → tasks        | 1:N  | One user can be assigned many tasks           |
| users → projects     | 1:N  | One user can create many projects             |
| users → audit_logs   | 1:N  | One user generates many audit entries         |

## 4. API Endpoint Architecture

### 4.1 REST API Design

**Base URL:** `http://localhost:5000/api`

**Authentication:** JWT Bearer Token in Authorization header

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 Endpoint Organization

```
POST   /auth/register-tenant        Register new organization
POST   /auth/login                  User login
GET    /auth/me                     Get current user
POST   /auth/logout                 Logout

GET    /tenants/:tenantId           Get tenant details
PUT    /tenants/:tenantId           Update tenant
GET    /tenants                     List all tenants (super_admin)

POST   /tenants/:tenantId/users     Add user to tenant
GET    /tenants/:tenantId/users     List tenant users
PUT    /users/:userId               Update user
DELETE /users/:userId               Delete user

POST   /projects                    Create project
GET    /projects                    List projects
PUT    /projects/:projectId         Update project
DELETE /projects/:projectId         Delete project

POST   /projects/:projectId/tasks   Create task
GET    /projects/:projectId/tasks   List tasks in project
PATCH  /tasks/:taskId/status        Update task status
PUT    /tasks/:taskId               Update task details

GET    /health                      Health check (no auth required)
```

## 5. Authentication and Authorization Flow

### 5.1 Registration Flow

```
User                    Frontend              Backend            Database
 │                          │                    │                  │
 ├─ Fill registration form  │                    │                  │
 │────────────────────────>│                     │                  │
 │                          ├─ POST /register    │                  │
 │                          │───────────────────>│                  │
 │                          │                    ├─ Validate input  │
 │                          │                    │                  │
 │                          │                    ├─ Hash password   │
 │                          │                    │                  │
 │                          │                    ├─ BEGIN TRANS     │
 │                          │                    │───────────────>│  │
 │                          │                    │                  ├─ INSERT tenant
 │                          │                    │                  │
 │                          │                    │                  ├─ INSERT user (admin)
 │                          │                    │                  │
 │                          │                    │<─ COMMIT         │
 │                          │<───── Success ─────│                  │
 │<────── Redirect /login ──┤                    │                  │
```

### 5.2 Login and Token Generation Flow

```
User              Frontend            Backend          Database         JWT
 │                    │                  │                │              │
 ├─ Enter credentials │                  │                │              │
 │───────────────────>│                  │                │              │
 │                    ├─ POST /login     │                │              │
 │                    │─────────────────>│                │              │
 │                    │                  ├─ Find tenant   │              │
 │                    │                  │───────────────>│              │
 │                    │                  │<─ tenant_id    │              │
 │                    │                  │                │              │
 │                    │                  ├─ Find user     │              │
 │                    │                  │───────────────>│              │
 │                    │                  │<─ user_id      │              │
 │                    │                  │                │              │
 │                    │                  ├─ Verify bcrypt │              │
 │                    │                  │                │              │
 │                    │                  ├─ Generate JWT──┼─────────────>│
 │                    │                  │<─ token ───────┤──────────────┤
 │                    │<─ {token, user} ─│                │              │
 │                    │                  ├─ Log login     │              │
 │                    │                  │───────────────>│              │
 │<─ Store in localStorage              │                │              │
 │                    │                  │                │              │
```

### 5.3 Protected Request Flow

```
User                Frontend                     Backend             Database
 │                     │                           │                    │
 ├─ Request protected resource                     │                    │
 │────────────────────>│                           │                    │
 │                     ├─ Add JWT to header        │                    │
 │                     ├─ GET /dashboard           │                    │
 │                     │──────────────────────────>│                    │
 │                     │                           ├─ Verify JWT sig    │
 │                     │                           ├─ Extract userId    │
 │                     │                           ├─ Extract tenantId  │
 │                     │                           │                    │
 │                     │                           ├─ Check role        │
 │                     │                           ├─ Execute query     │
 │                     │                           │──────────────────>│  │
 │                     │                           │   WHERE tenant_id  │
 │                     │                           │   = req.tenantId   │
 │                     │                           │<─ results ─────────┤
 │                     │<────────── Response ──────│                    │
 │<─ Render page ──────┤                           │                    │
```

## 6. Data Isolation and Multi-Tenancy

### 6.1 Tenant Isolation Strategy

Every database query includes a tenant_id filter to ensure complete data isolation:

```javascript
// Example: List projects for authenticated user's tenant
SELECT * FROM projects
WHERE tenant_id = $1  // req.tenantId injected by middleware
ORDER BY created_at DESC;

// Tenant middleware ensures req.tenantId is always set:
// - For regular users: extracted from JWT token (user's tenant_id)
// - For super_admin: null (but API still filters by requested tenant_id in URL)

// Example: Super admin viewing specific tenant
GET /api/tenants/:tenantId
SELECT * FROM projects
WHERE tenant_id = $1  // :tenantId from URL parameter
ORDER BY created_at DESC;
```

### 6.2 Multi-Tenant Query Patterns

**Pattern 1: Implicit tenant from authenticated user**

```javascript
const projects = await db.query(
  "SELECT * FROM projects WHERE tenant_id = $1 AND status = $2",
  [req.tenantId, "active"] // req.tenantId from middleware
);
// User can only see their organization's projects
```

**Pattern 2: Explicit tenant from URL parameter (super_admin)**

```javascript
const users = await db.query(
  "SELECT * FROM users WHERE tenant_id = $1",
  [req.params.tenantId] // From URL
);
// Additional check: if user not super_admin, tenantId must match their own
```

**Pattern 3: Across tables with cascade isolation**

```javascript
const task = await db.query(
  `SELECT t.* FROM tasks t
   JOIN projects p ON t.project_id = p.id
   WHERE t.id = $1 AND t.tenant_id = $2 AND p.tenant_id = $2`,
  [taskId, req.tenantId]
);
// Double-check tenant isolation across relationships
```

## 7. Deployment Architecture

### 7.1 Docker Compose Services

```yaml
services:
  database:
    - Image: postgres:15-alpine
    - Port: 5432
    - Volume: postgres_data
    - Health Check: pg_isready
    - Network: saas-network

  backend:
    - Build: ./backend/Dockerfile
    - Port: 5000
    - Environment: DB_HOST, JWT_SECRET, etc.
    - Depends On: database (healthy)
    - Health Check: GET /api/health
    - Network: saas-network

  frontend:
    - Build: ./frontend/Dockerfile
    - Port: 3000
    - Nginx Serving: /build (production bundle)
    - Proxy: /api → http://backend:5000/api
    - Network: saas-network
```

### 7.2 Container Health Checks

```
Database (PostgreSQL):
  Command: pg_isready -U postgres
  Interval: 10 seconds
  Timeout: 5 seconds
  Retries: 5

Backend (Node.js):
  URL: http://localhost:5000/api/health
  Interval: 10 seconds
  Timeout: 5 seconds
  Retries: 5

Frontend (Nginx):
  Command: wget --quiet --tries=1 --spider http://localhost:3000/
  Interval: 10 seconds
  Timeout: 5 seconds
  Retries: 5
```

## 8. Scalability and Future Architecture

### 8.1 Current Single-Instance Architecture (MVP)

- Single PostgreSQL database
- Single backend application instance
- Single frontend instance
- All running in docker-compose

**Capacity:**

- 10,000 tenants
- 100,000 users
- 1,000,000 tasks
- <200ms API response time

### 8.2 Horizontal Scaling (Growth Phase)

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │    (Nginx)      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼───┐          ┌──────▼──┐           ┌──────▼──┐
    │Backend│          │ Backend │           │ Backend │
    │ Pod 1 │          │  Pod 2  │           │  Pod 3  │
    └───┬───┘          └───┬─────┘           └───┬─────┘
        │                  │                     │
        └──────────────────┼─────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │  (Primary)  │
                    └─────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
    ┌───▼────┐                          ┌────▼───┐
    │ Replica│                          │ Replica│
    │  (RO)  │                          │  (RO)  │
    └────────┘                          └────────┘
```

### 8.3 Multi-Database Architecture (Enterprise Scale)

```
Shard 1: Tenants A-G       Shard 2: Tenants H-N       Shard 3: Tenants O-Z
├── PostgreSQL Primary     ├── PostgreSQL Primary     ├── PostgreSQL Primary
├── Replica               ├── Replica               ├── Replica
└── Replica               └── Replica               └── Replica

Application Router:
  - Consistent hash of tenant_id
  - Routes to appropriate shard
  - Transparent to application code
```

## 9. Security Architecture

### 9.1 Security Layers

```
┌─ Transport Security ────────────────────────────────────────┐
│  HTTPS/TLS 1.3                                              │
│  Encrypted in-transit communication                         │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─ Application Security ─────────────────────────────────────┐
│  CORS Enforcement (Whitelisted Origins)                     │
│  Rate Limiting on API Endpoints                            │
│  Input Validation (express-validator)                      │
│  Parameterized Queries (SQL Injection Prevention)           │
│  JWT Verification (HS256 Signature)                        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─ Data Security ────────────────────────────────────────────┐
│  Password Hashing (bcryptjs 10 rounds)                     │
│  Tenant Isolation (tenant_id in every WHERE clause)        │
│  Role-Based Access Control (RBAC)                          │
│  Audit Logging (All user actions)                          │
│  PII Encryption (At-rest, if implemented)                  │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─ Database Security ────────────────────────────────────────┐
│  Connection Pooling with TLS                               │
│  Least Privilege Database User                             │
│  Backups with Encryption                                   │
│  Point-in-Time Recovery                                    │
│  Regular Security Updates                                  │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Authentication Token Lifecycle

```
Token Created (Login)
  ├─ Payload: {userId, tenantId, role}
  ├─ Signed with: HS256 + JWT_SECRET
  └─ Expiration: 24 hours

Token Usage (Each Request)
  ├─ Extracted from Authorization header
  ├─ Signature verified
  ├─ Expiration checked
  ├─ Decoded to get userId, tenantId, role
  └─ Injected into request context

Token Expiration
  ├─ Backend returns 401 Unauthorized
  ├─ Frontend catches 401 in axios interceptor
  ├─ Frontend clears localStorage
  └─ Frontend redirects to /login

Token Refresh (Future Implementation)
  ├─ Implement refresh token with longer expiry
  ├─ Automatic token rotation on use
  ├─ Background refresh before expiry
  └─ Sliding window sessions
```

## 10. Performance Optimization

### 10.1 Query Optimization

```javascript
// SLOW: N+1 query problem
const projects = await db.query("SELECT * FROM projects WHERE tenant_id = $1", [
  tenantId,
]);
projects.forEach(async (p) => {
  const tasks = await db.query("SELECT * FROM tasks WHERE project_id = $1", [
    p.id,
  ]);
  // Database called once per project!
});

// FAST: Aggregated query
const projects = await db.query(
  `
  SELECT 
    p.*,
    COUNT(t.id) as total_tasks,
    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
  FROM projects p
  LEFT JOIN tasks t ON p.id = t.project_id
  WHERE p.tenant_id = $1
  GROUP BY p.id
  ORDER BY p.created_at DESC
`,
  [tenantId]
);
```

### 10.2 Index Strategy

```sql
-- Composite indexes for common queries
CREATE INDEX idx_projects_tenant_status ON projects(tenant_id, status);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_audit_logs_tenant_date ON audit_logs(tenant_id, created_at);

-- Improves: WHERE tenant_id = $1 AND status = $2 queries
-- Prevents: Full table scans on large tables
```

### 10.3 Connection Pool Optimization

```javascript
// Backend uses pg.Pool with:
max: 20,              // Maximum connections
idleTimeoutMillis: 30000,  // Close idle connections
connectionTimeoutMillis: 2000,  // Fail fast on connection issues

// Results:
// - Avoids connection leak
// - Reuses connections (cheaper than creating new)
// - Scales to 1000+ concurrent users
```

## 11. Monitoring and Logging

### 11.1 Application Logs

```
[2024-01-15 14:23:45] INFO  - Server started on port 5000
[2024-01-15 14:23:47] INFO  - Database migration: 001_create_tenants.sql
[2024-01-15 14:23:48] INFO  - Database migration: 002_create_users.sql
[2024-01-15 14:23:50] INFO  - Health check passed
[2024-01-15 14:24:12] POST  /api/auth/login - 200 - 84ms
[2024-01-15 14:24:15] GET   /api/projects - 200 - 12ms
[2024-01-15 14:24:20] POST  /api/projects - 201 - 18ms
[2024-01-15 14:24:25] WARN  - Response time > 500ms detected
[2024-01-15 14:24:30] ERROR - Database connection timeout
```

### 11.2 Metrics to Monitor

```
Performance:
  ├─ API response time (p50, p95, p99)
  ├─ Database query time
  ├─ Connection pool usage
  └─ Memory consumption

Reliability:
  ├─ Error rate (4xx, 5xx errors)
  ├─ Database connection errors
  ├─ Failed transactions
  └─ Uptime percentage

Business:
  ├─ New tenant signups
  ├─ Active users
  ├─ API usage by endpoint
  └─ Audit log volume
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Architecture Pattern:** Monolithic Multi-Tenant SaaS
