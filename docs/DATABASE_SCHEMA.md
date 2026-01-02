# Database Schema

## Overview

The SaaS platform uses PostgreSQL 15 with a normalized multi-tenant schema. All tables support the shared database multi-tenancy pattern with proper isolation and referential integrity.

## Entity Relationship Diagram

```
┌─────────────────┐
│    tenants      │
├─────────────────┤
│ id (PK)         │────┐
│ name            │    │
│ subdomain       │    │ One-to-Many
│ status          │    │
│ max_users       │    │
│ max_projects    │    │
│ created_at      │    │
└─────────────────┘    │
                       │
        ┌──────────────┤
        │              │
        ▼              ▼
┌──────────────────┐  ┌──────────────────┐
│      users       │  │    projects      │
├──────────────────┤  ├──────────────────┤
│ id (PK)          │  │ id (PK)          │
│ tenant_id (FK)───┼──│ tenant_id (FK)   │
│ email            │  │ name             │
│ password_hash    │  │ description      │
│ full_name        │  │ status           │
│ role             │  │ created_by (FK)  │
│ is_active        │  │ created_at       │
│ created_at       │  └────────┬─────────┘
└────────┬─────────┘           │
         │                     │ One-to-Many
         │        ┌────────────┘
         │        │
         │        ▼
         │   ┌──────────────────┐
         │   │      tasks       │
         │   ├──────────────────┤
         │   │ id (PK)          │
         │   │ project_id (FK)  │
         │   │ tenant_id (FK)   │
         │   │ title            │
         │   │ description      │
         │   │ status           │
         │   │ priority         │
         │   │ assigned_to (FK) │
         │   │ due_date         │
         │   │ created_at       │
         │   └──────────────────┘
         │
         │ One-to-Many
         │
         ▼
    ┌──────────────────┐
    │   audit_logs     │
    ├──────────────────┤
    │ id (PK)          │
    │ tenant_id (FK)   │
    │ user_id (FK)     │
    │ action           │
    │ resource         │
    │ timestamp        │
    └──────────────────┘
```

## Table Definitions

### 1. tenants

**Purpose**: Represents organizations/customers in the SaaS platform

| Column              | Type         | Constraints                | Description                    |
| ------------------- | ------------ | -------------------------- | ------------------------------ |
| `id`                | UUID         | PRIMARY KEY                | Unique identifier for tenant   |
| `name`              | VARCHAR(255) | NOT NULL, UNIQUE           | Organization name              |
| `subdomain`         | VARCHAR(100) | NOT NULL, UNIQUE           | URL subdomain for tenant       |
| `status`            | VARCHAR(50)  | NOT NULL, DEFAULT 'active' | active \| suspended \| deleted |
| `subscription_plan` | VARCHAR(50)  | DEFAULT 'free'             | free \| pro \| enterprise      |
| `max_users`         | INT          | DEFAULT 5                  | Maximum users allowed          |
| `max_projects`      | INT          | DEFAULT 3                  | Maximum projects allowed       |
| `created_at`        | TIMESTAMP    | DEFAULT NOW()              | Creation timestamp             |

**Indexes**:

- `id` (primary key)
- `subdomain` (unique, for faster lookups)

**Example Data**:

```
id: 22222222-2222-2222-2222-222222222222
name: "Demo Tenant"
subdomain: "demo"
status: "active"
subscription_plan: "pro"
max_users: 10
max_projects: 5
```

---

### 2. users

**Purpose**: Stores user accounts with role-based access control

| Column          | Type         | Constraints                                | Description                              |
| --------------- | ------------ | ------------------------------------------ | ---------------------------------------- |
| `id`            | UUID         | PRIMARY KEY                                | Unique identifier for user               |
| `tenant_id`     | UUID         | FOREIGN KEY (tenants.id) ON DELETE CASCADE | References tenant (NULL for super admin) |
| `email`         | VARCHAR(255) | NOT NULL, UNIQUE                           | User email address                       |
| `password_hash` | VARCHAR(255) | NOT NULL                                   | Bcrypt hashed password                   |
| `full_name`     | VARCHAR(255) | NOT NULL                                   | User's full name                         |
| `role`          | VARCHAR(50)  | NOT NULL                                   | super_admin \| tenant_admin \| user      |
| `is_active`     | BOOLEAN      | DEFAULT true                               | Whether user account is active           |
| `created_at`    | TIMESTAMP    | DEFAULT NOW()                              | Creation timestamp                       |

**Indexes**:

- `id` (primary key)
- `email` (unique)
- `tenant_id` (for filtering users by tenant)

**Constraints**:

- UNIQUE constraint on (email) for global uniqueness
- Foreign key on tenant_id with CASCADE delete
- Role validation: must be one of three values

**Roles**:

- `super_admin`: System administrator, no tenant, can manage all tenants
- `tenant_admin`: Organization administrator, manages own tenant and users
- `user`: Regular team member, read-only access + update own tasks

**Example Data**:

```
id: 11111111-1111-1111-1111-111111111111
tenant_id: NULL
email: "superadmin@platform.com"
password_hash: "$2a$10$..." (Admin@123)
full_name: "Super Admin"
role: "super_admin"
is_active: true

id: 33333333-3333-3333-3333-333333333333
tenant_id: 22222222-2222-2222-2222-222222222222
email: "admin@demo.com"
password_hash: "$2a$10$..." (Demo@123)
full_name: "Demo Admin"
role: "tenant_admin"
is_active: true
```

---

### 3. projects

**Purpose**: Represents projects within a tenant

| Column        | Type         | Constraints                                | Description                         |
| ------------- | ------------ | ------------------------------------------ | ----------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                | Unique identifier for project       |
| `tenant_id`   | UUID         | FOREIGN KEY (tenants.id) ON DELETE CASCADE | References tenant (required)        |
| `name`        | VARCHAR(255) | NOT NULL                                   | Project name                        |
| `description` | TEXT         | NULLABLE                                   | Project description                 |
| `status`      | VARCHAR(50)  | NOT NULL, DEFAULT 'active'                 | active \| archived \| deleted       |
| `created_by`  | UUID         | FOREIGN KEY (users.id) ON DELETE SET NULL  | References user who created project |
| `created_at`  | TIMESTAMP    | DEFAULT NOW()                              | Creation timestamp                  |

**Indexes**:

- `id` (primary key)
- `tenant_id` (for multi-tenant filtering)
- `created_by` (for tracing creator)

**Constraints**:

- Foreign key on tenant_id with CASCADE delete
- Foreign key on created_by with SET NULL on delete
- All projects must belong to exactly one tenant

**Example Data**:

```
id: 44444444-4444-4444-4444-444444444444
tenant_id: 22222222-2222-2222-2222-222222222222
name: "Website Redesign"
description: "Complete redesign of corporate website"
status: "active"
created_by: 33333333-3333-3333-3333-333333333333
created_at: 2025-01-15 10:00:00
```

---

### 4. tasks

**Purpose**: Stores individual tasks within projects

| Column        | Type         | Constraints                                 | Description                                 |
| ------------- | ------------ | ------------------------------------------- | ------------------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                 | Unique identifier for task                  |
| `project_id`  | UUID         | FOREIGN KEY (projects.id) ON DELETE CASCADE | References project (required)               |
| `tenant_id`   | UUID         | FOREIGN KEY (tenants.id) ON DELETE CASCADE  | References tenant (required, for isolation) |
| `title`       | VARCHAR(255) | NOT NULL                                    | Task title                                  |
| `description` | TEXT         | NULLABLE                                    | Task description                            |
| `status`      | VARCHAR(50)  | NOT NULL, DEFAULT 'todo'                    | todo \| in_progress \| done                 |
| `priority`    | VARCHAR(50)  | NOT NULL, DEFAULT 'medium'                  | low \| medium \| high                       |
| `assigned_to` | UUID         | FOREIGN KEY (users.id) ON DELETE SET NULL   | References user task is assigned to         |
| `due_date`    | TIMESTAMP    | NULLABLE                                    | Task deadline                               |
| `created_at`  | TIMESTAMP    | DEFAULT NOW()                               | Creation timestamp                          |

**Indexes**:

- `id` (primary key)
- `project_id` (for task filtering)
- `tenant_id` (for multi-tenant isolation)
- `assigned_to` (for finding user's tasks)

**Constraints**:

- Foreign key on project_id with CASCADE delete
- Foreign key on tenant_id with CASCADE delete
- Foreign key on assigned_to with SET NULL on delete

**Status Flow**: todo → in_progress → done

**Priority Levels**: low, medium, high

**Example Data**:

```
id: 55555555-5555-5555-5555-555555555555
project_id: 44444444-4444-4444-4444-444444444444
tenant_id: 22222222-2222-2222-2222-222222222222
title: "Design homepage mockups"
description: "Create high-fidelity mockups for homepage redesign"
status: "in_progress"
priority: "high"
assigned_to: 44444444-4444-4444-4444-444444444444
due_date: 2025-02-15 17:00:00
created_at: 2025-01-15 10:30:00
```

---

### 5. audit_logs

**Purpose**: Tracks all important actions for compliance and debugging

| Column        | Type         | Constraints                                | Description                                     |
| ------------- | ------------ | ------------------------------------------ | ----------------------------------------------- |
| `id`          | UUID         | PRIMARY KEY                                | Unique identifier for log entry                 |
| `tenant_id`   | UUID         | FOREIGN KEY (tenants.id) ON DELETE CASCADE | References tenant                               |
| `user_id`     | UUID         | FOREIGN KEY (users.id) ON DELETE SET NULL  | References user who performed action            |
| `action`      | VARCHAR(100) | NOT NULL                                   | Action type (CREATE_PROJECT, DELETE_TASK, etc.) |
| `resource`    | VARCHAR(100) | NOT NULL                                   | Resource type (project, task, user, etc.)       |
| `resource_id` | UUID         | NULLABLE                                   | ID of affected resource                         |
| `timestamp`   | TIMESTAMP    | DEFAULT NOW()                              | When action occurred                            |

**Indexes**:

- `id` (primary key)
- `tenant_id` (for audit filtering by tenant)
- `user_id` (for audit filtering by user)
- `timestamp` (for time-range queries)

**Constraints**:

- Foreign keys with CASCADE and SET NULL for data cleanup

**Action Types**:

- CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT
- CREATE_TASK, UPDATE_TASK, DELETE_TASK
- CREATE_USER, UPDATE_USER, DEACTIVATE_USER
- USER_LOGIN, USER_LOGOUT

**Example Data**:

```
id: 66666666-6666-6666-6666-666666666666
tenant_id: 22222222-2222-2222-2222-222222222222
user_id: 33333333-3333-3333-3333-333333333333
action: "CREATE_PROJECT"
resource: "project"
resource_id: 44444444-4444-4444-4444-444444444444
timestamp: 2025-01-15 10:00:00
```

---

## Multi-Tenancy Implementation

### Data Isolation Strategy

- **Shared Database, Shared Schema**: All tenants use the same tables
- **Tenant ID Filtering**: Every query filters by `tenant_id`
- **Foreign Keys**: Enforce referential integrity within tenants
- **Cascade Delete**: Deleting tenant deletes all related data

### Tenant ID in Every Table

- Users have `tenant_id` (NULL for super admin)
- Projects have `tenant_id` (inherit from tenant)
- Tasks have `tenant_id` (inherit from project's tenant)
- Audit logs have `tenant_id` (for filtering logs by tenant)

### Query Pattern

```sql
-- Fetching projects for authenticated user
SELECT * FROM projects
WHERE tenant_id = $1  -- Extracted from JWT token
ORDER BY created_at DESC;
```

---

## Indexes for Performance

```sql
-- Table: tenants
CREATE UNIQUE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- Table: users
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

-- Table: projects
CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- Table: tasks
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- Table: audit_logs
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

---

## Foreign Key Relationships

| Source Table | FK Column   | Target Table | Target Column | On Delete |
| ------------ | ----------- | ------------ | ------------- | --------- |
| users        | tenant_id   | tenants      | id            | CASCADE   |
| projects     | tenant_id   | tenants      | id            | CASCADE   |
| projects     | created_by  | users        | id            | SET NULL  |
| tasks        | project_id  | projects     | id            | CASCADE   |
| tasks        | tenant_id   | tenants      | id            | CASCADE   |
| tasks        | assigned_to | users        | id            | SET NULL  |
| audit_logs   | tenant_id   | tenants      | id            | CASCADE   |
| audit_logs   | user_id     | users        | id            | SET NULL  |

---

## Data Constraints Summary

| Table    | Constraint             | Type             | Impact                                    |
| -------- | ---------------------- | ---------------- | ----------------------------------------- |
| tenants  | id, name, subdomain    | Unique           | No duplicate orgs/subdomains              |
| users    | email                  | Unique (global)  | No duplicate user accounts                |
| users    | tenant_id              | NOT NULL or NULL | Every user has tenant (or is super admin) |
| projects | tenant_id              | NOT NULL         | Every project must belong to tenant       |
| tasks    | tenant_id + project_id | Combined         | Tasks properly scoped                     |

---

## Capacity Limits (from subscription)

```
Free Plan:
  - max_users: 5
  - max_projects: 3

Pro Plan:
  - max_users: 50
  - max_projects: 20

Enterprise Plan:
  - max_users: unlimited
  - max_projects: unlimited
```

Enforced in controllers before INSERT operations.

---

## Migration History

All schema creation is handled in: `database/migrations/001_initial_schema.sql`

The migrations are automatically applied when the database container starts.
