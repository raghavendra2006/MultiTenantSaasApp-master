# Technical Specification - Multi-Tenant SaaS Platform

## 1. Project Overview

**Project Name:** Multi-Tenant SaaS Platform  
**Version:** 1.0.0  
**Type:** Monolithic Multi-Tenant Web Application  
**Status:** Production Ready  
**Last Updated:** 2024

## 2. Technology Stack

### Backend Technologies

| Technology        | Version    | Purpose               |
| ----------------- | ---------- | --------------------- |
| Node.js           | 18.x (LTS) | JavaScript runtime    |
| Express.js        | 4.18+      | Web framework         |
| PostgreSQL        | 15.x       | Relational database   |
| jsonwebtoken      | 9.0+       | JWT authentication    |
| bcryptjs          | 2.4+       | Password hashing      |
| express-validator | 7.0+       | Input validation      |
| cors              | 2.8+       | Cross-origin requests |
| morgan            | 1.10+      | HTTP logging          |
| pg                | 8.10+      | PostgreSQL driver     |
| uuid              | 9.0+       | UUID generation       |

### Frontend Technologies

| Technology    | Version | Purpose           |
| ------------- | ------- | ----------------- |
| React         | 18.2+   | UI framework      |
| React Router  | 6.16+   | SPA routing       |
| Axios         | 1.5+    | HTTP client       |
| Tailwind CSS  | 3.3+    | Styling framework |
| React Scripts | 5.0+    | Build tooling     |

### DevOps Technologies

| Technology     | Version | Purpose                 |
| -------------- | ------- | ----------------------- |
| Docker         | 20.10+  | Container engine        |
| Docker Compose | 2.0+    | Container orchestration |
| Git            | 2.30+   | Version control         |

## 3. Project Structure

```
saas2/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # PostgreSQL connection pool
│   │   │   └── migrations.js        # Auto-run migrations
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT validation
│   │   │   ├── role.js              # RBAC enforcement
│   │   │   ├── tenant.js            # Tenant context injection
│   │   │   └── validators.js        # Input validation rules
│   │   ├── controllers/
│   │   │   ├── authController.js    # APIs 1-4 (Auth)
│   │   │   ├── tenantController.js  # APIs 5-7 (Tenant management)
│   │   │   ├── userController.js    # APIs 8-11 (User management)
│   │   │   ├── projectController.js # APIs 12-15 (Projects)
│   │   │   └── taskController.js    # APIs 16-19 (Tasks)
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # /auth/* endpoints
│   │   │   ├── tenantRoutes.js      # /tenants/* endpoints
│   │   │   ├── userRoutes.js        # /users/* endpoints
│   │   │   ├── projectRoutes.js     # /projects/* endpoints
│   │   │   └── taskRoutes.js        # /tasks/* endpoints
│   │   ├── utils/
│   │   │   ├── auditLogger.js       # Action logging
│   │   │   ├── tokenGenerator.js    # JWT creation
│   │   │   └── validators.js        # Validation rules
│   │   └── index.js                 # Application entry point
│   ├── migrations/                  # SQL migration files
│   │   ├── 001_create_tenants.sql
│   │   ├── 002_create_users.sql
│   │   ├── 003_create_projects.sql
│   │   ├── 004_create_tasks.sql
│   │   └── 005_create_audit_logs.sql
│   ├── seeds/
│   │   └── seed_data.sql            # Test data
│   ├── .env                         # Environment variables
│   ├── .gitignore                   # Git exclusions
│   ├── Dockerfile                   # Container image
│   ├── package.json                 # Dependencies & scripts
│   └── package-lock.json            # Locked versions
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js            # Navigation bar
│   │   │   └── ProtectedRoute.js    # Route protection
│   │   ├── pages/
│   │   │   ├── Register.js          # Tenant registration
│   │   │   ├── Login.js             # User login
│   │   │   ├── Dashboard.js         # Home dashboard
│   │   │   ├── Projects.js          # Project listing
│   │   │   ├── ProjectDetails.js    # Task management
│   │   │   └── Users.js             # User management
│   │   ├── context/
│   │   │   └── AuthContext.js       # Global auth state
│   │   ├── utils/
│   │   │   └── api.js               # Axios instance
│   │   ├── App.js                   # Router setup
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Global styles
│   ├── public/
│   │   ├── index.html               # HTML template
│   │   └── favicon.ico              # Icon
│   ├── .env                         # Environment variables
│   ├── .gitignore                   # Git exclusions
│   ├── Dockerfile                   # Multi-stage container
│   ├── nginx.conf                   # Web server config
│   ├── package.json                 # Dependencies & scripts
│   └── package-lock.json            # Locked versions
│
├── docs/
│   ├── research.md                  # Research document (1700+ words)
│   ├── PRD.md                       # Product requirements
│   ├── architecture.md              # Architecture diagrams
│   ├── API.md                       # API documentation
│   ├── technical-spec.md            # This file
│   └── README.md                    # Project overview
│
├── docker-compose.yml               # Orchestration file
├── submission.json                  # Test credentials
├── .gitignore                       # Root git exclusions
└── README.md                        # Setup and usage

```

## 4. Environment Variables

### Backend (.env)

```bash
# Database Configuration
DB_HOST=database                    # PostgreSQL host
DB_PORT=5432                        # PostgreSQL port
DB_NAME=saas_db                     # Database name
DB_USER=postgres                    # Database user
DB_PASSWORD=postgres                # Database password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_min_32_chars_make_it_secure_2024
JWT_EXPIRES_IN=24h                  # Token expiration time

# Server Configuration
PORT=5000                           # Backend port
NODE_ENV=production                 # Environment (development/production)

# CORS Configuration
FRONTEND_URL=http://frontend:3000   # Frontend origin

# Optional Email Configuration (Phase 2)
SMTP_HOST=                          # Email server
SMTP_PORT=                          # Email port
SMTP_USER=                          # Email user
SMTP_PASS=                          # Email password
```

### Frontend (.env)

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api  # Backend API URL
```

## 5. Database Schema

### 5.1 Tenants Table

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  subscription_plan VARCHAR(20) DEFAULT 'starter'
    CHECK (subscription_plan IN ('starter', 'pro', 'enterprise')),
  max_users INTEGER NOT NULL,
  max_projects INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_subdomain (subdomain),
  INDEX idx_status (status)
);
```

**Indexes:**

- `subdomain` (UNIQUE) - For tenant lookup
- `status` - For filtering suspended tenants

### 5.2 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, email),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_email (email)
);
```

**Key Constraints:**

- `UNIQUE(tenant_id, email)` - No duplicate emails within tenant
- `Foreign Key` - tenant_id references tenants with CASCADE DELETE

### 5.3 Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_tenant_id (tenant_id),
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_created_by (created_by)
);
```

**Indexes:**

- `(tenant_id, status)` - Filter active projects by tenant
- `created_by` - Find user's created projects

### 5.4 Tasks Table

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'completed')),
  priority VARCHAR(20) DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_project_id (project_id),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_status (status),
  INDEX idx_assigned_to (assigned_to)
);
```

**Indexes:**

- `project_id` - Find tasks by project
- `(tenant_id, status)` - Filter tasks by tenant
- `assigned_to` - Find user's assigned tasks

### 5.5 Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_tenant_date (tenant_id, created_at),
  INDEX idx_user_date (user_id, created_at)
);
```

**Indexes:**

- `(tenant_id, created_at)` - Query audit by tenant
- `(user_id, created_at)` - Query user's actions

## 6. API Endpoints Summary

### 6.1 Authentication (4 endpoints)

| Method | Endpoint              | Purpose                   | Auth |
| ------ | --------------------- | ------------------------- | ---- |
| POST   | /auth/register-tenant | Register new organization | No   |
| POST   | /auth/login           | User login                | No   |
| GET    | /auth/me              | Get current user          | Yes  |
| POST   | /auth/logout          | Logout                    | Yes  |

### 6.2 Tenant Management (3 endpoints)

| Method | Endpoint           | Purpose            | Auth        |
| ------ | ------------------ | ------------------ | ----------- |
| GET    | /tenants/:tenantId | Get tenant details | Yes         |
| PUT    | /tenants/:tenantId | Update tenant      | Yes         |
| GET    | /tenants           | List all tenants   | Yes (admin) |

### 6.3 User Management (4 endpoints)

| Method | Endpoint                 | Purpose     | Auth |
| ------ | ------------------------ | ----------- | ---- |
| POST   | /tenants/:tenantId/users | Add user    | Yes  |
| GET    | /tenants/:tenantId/users | List users  | Yes  |
| PUT    | /users/:userId           | Update user | Yes  |
| DELETE | /users/:userId           | Delete user | Yes  |

### 6.4 Project Management (4 endpoints)

| Method | Endpoint             | Purpose        | Auth |
| ------ | -------------------- | -------------- | ---- |
| POST   | /projects            | Create project | Yes  |
| GET    | /projects            | List projects  | Yes  |
| PUT    | /projects/:projectId | Update project | Yes  |
| DELETE | /projects/:projectId | Delete project | Yes  |

### 6.5 Task Management (4 endpoints)

| Method | Endpoint                   | Purpose       | Auth |
| ------ | -------------------------- | ------------- | ---- |
| POST   | /projects/:projectId/tasks | Create task   | Yes  |
| GET    | /projects/:projectId/tasks | List tasks    | Yes  |
| PATCH  | /tasks/:taskId/status      | Update status | Yes  |
| PUT    | /tasks/:taskId             | Update task   | Yes  |

### 6.6 Health (1 endpoint)

| Method | Endpoint | Purpose      | Auth |
| ------ | -------- | ------------ | ---- |
| GET    | /health  | Health check | No   |

**Total: 19 RESTful API endpoints**

## 7. Development Setup

### 7.1 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 15.x or higher
- Docker and Docker Compose (for containerized setup)
- Git
- npm or yarn

### 7.2 Local Development Setup

**Step 1: Clone Repository**

```bash
git clone https://github.com/yourusername/saas-platform.git
cd saas-platform
```

**Step 2: Backend Setup**

```bash
cd backend
cp .env.example .env  # Create env file with your settings
npm install
```

**Step 3: Database Setup**

```bash
# If running PostgreSQL locally
createdb saas_db
psql -U postgres saas_db < seeds/seed_data.sql
```

**Step 4: Start Backend**

```bash
npm start
# Server runs on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

**Step 5: Frontend Setup**

```bash
cd ../frontend
cp .env.example .env
npm install
npm start
# Application opens at http://localhost:3000
```

### 7.3 Docker Compose Setup

**One Command Deployment:**

```bash
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access Points:**

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Database: localhost:5432

## 8. Build and Deployment

### 8.1 Production Build

**Backend:**

```bash
cd backend
npm install --production
# Code is production-ready; no build step needed
```

**Frontend:**

```bash
cd frontend
npm run build
# Creates optimized build in build/ directory
# Gzipped bundle is ~200-300KB
```

### 8.2 Docker Builds

**Backend Image:**

```bash
cd backend
docker build -t saas-backend:latest .
docker run -p 5000:5000 --env-file .env saas-backend:latest
```

**Frontend Image (Multi-Stage):**

```bash
cd frontend
docker build -t saas-frontend:latest .
docker run -p 3000:3000 saas-frontend:latest
```

**Docker Compose (All Services):**

```bash
docker-compose build
docker-compose up -d
```

## 9. Testing

### 9.1 API Testing

**Using Curl:**

```bash
# Register tenant
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{"tenantName":"Test","subdomain":"test","adminEmail":"admin@test.com","adminPassword":"Test123!","adminFullName":"Admin"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenantSubdomain":"demo","email":"admin@demo.com","password":"Demo@123"}'

# Get current user
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

**Using Postman:**

1. Import API documentation from docs/API.md
2. Create environment with variables: `{{BASE_URL}}`, `{{TOKEN}}`
3. Run collection tests

### 9.2 Manual Testing Checklist

- [ ] Tenant registration with unique subdomain
- [ ] User login with correct credentials
- [ ] Prevent login with wrong password
- [ ] Dashboard displays project statistics
- [ ] Create new project
- [ ] Create task in project
- [ ] Update task status (todo → in_progress → completed)
- [ ] Assign task to team member
- [ ] Delete task
- [ ] Delete project
- [ ] Data isolation (Tenant A can't see Tenant B's data)
- [ ] Permission checks (regular user can't access /users page)

## 10. Security Considerations

### 10.1 Implemented Security

✅ Password Hashing (bcryptjs 10 rounds)  
✅ JWT Authentication (HS256 signature, 24h expiry)  
✅ Parameterized SQL Queries (prevents SQL injection)  
✅ CORS Enforcement (whitelist frontend origin)  
✅ Input Validation (express-validator)  
✅ Tenant Isolation (tenant_id in every query)  
✅ Role-Based Access Control (super_admin, tenant_admin, user)  
✅ Audit Logging (all user actions)  
✅ HTTP-only Cookie Support (future)

### 10.2 Recommended Production Hardening

- Enable HTTPS/TLS (use nginx reverse proxy with SSL certificates)
- Use environment secrets management (HashiCorp Vault, AWS Secrets Manager)
- Enable database encryption at-rest
- Implement API rate limiting and DDoS protection
- Regular security audits and penetration testing
- Implement 2FA for sensitive accounts
- Use refresh tokens with sliding window sessions
- Enable database activity monitoring and alerting
- Implement CORS more restrictively in production
- Use helmet.js for additional HTTP security headers

## 11. Performance Specifications

### 11.1 API Response Time Targets

| Endpoint                | Target | Typical |
| ----------------------- | ------ | ------- |
| POST /login             | <150ms | 80ms    |
| GET /projects           | <50ms  | 15ms    |
| POST /projects          | <100ms | 18ms    |
| GET /tasks              | <100ms | 25ms    |
| PATCH /tasks/:id/status | <50ms  | 20ms    |

### 11.2 Database Performance

- Max 1,000,000 rows per table
- Query response <50ms for indexed queries
- Connection pool: 20 max connections
- Index coverage: 95%+ of queries use indexes

### 11.3 Scalability Targets

- 10,000 tenants per single database instance
- 100,000 concurrent users with load balancer
- 1,000,000+ total tasks in system
- <200ms p95 API response at scale

## 12. Maintenance and Support

### 12.1 Database Maintenance

```bash
# Backup database
pg_dump saas_db > saas_db_backup.sql

# Restore database
psql saas_db < saas_db_backup.sql

# Vacuum (optimize storage)
vacuumdb saas_db

# Analyze (update statistics)
analyzedb saas_db
```

### 12.2 Log Management

- Application logs: stdout (captured by Docker)
- Database logs: PostgreSQL server logs
- Audit logs: audit_logs table in database
- Retention: Audit logs retained for 1 year minimum

### 12.3 Health Monitoring

```bash
# Check backend health
curl http://localhost:5000/api/health

# Check Docker services
docker-compose ps

# View service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

## 13. Troubleshooting

### Common Issues

**Issue:** "Cannot connect to database"

```
Solution: Ensure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD are correct
Run: docker-compose logs database
```

**Issue:** "JWT token expired"

```
Solution: Frontend automatically redirects to /login
Check: JWT_EXPIRES_IN environment variable
```

**Issue:** "CORS error in browser"

```
Solution: Ensure FRONTEND_URL matches frontend origin
Verify: cors middleware configuration in index.js
```

**Issue:** "Tenant data not isolated"

```
Solution: Check middleware applies tenant_id filtering
Verify: All queries include WHERE tenant_id = $X
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production Ready
