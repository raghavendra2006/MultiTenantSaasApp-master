# API Documentation - Multi-Tenant SaaS Platform

## Overview

**Base URL:** `http://localhost:5000/api`  
**Authentication:** JWT Bearer Token  
**Content-Type:** application/json  
**Default Port:** 5000

## Authentication

All endpoints except `/auth/register-tenant`, `/auth/login`, and `/health` require JWT authentication.

### Request Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response on Unauthorized (401)

```json
{
  "error": "Unauthorized: Invalid or expired token"
}
```

---

## 1. Authentication Endpoints

### 1.1 Register Tenant

**Endpoint:** `POST /auth/register-tenant`  
**Auth Required:** No  
**Rate Limit:** 10 requests per minute

**Request Body:**

```json
{
  "tenantName": "Acme Corporation",
  "subdomain": "acme",
  "adminEmail": "john@acme.com",
  "adminPassword": "SecurePassword123",
  "adminFullName": "John Doe"
}
```

**Validation:**

- `tenantName`: Required, 1-100 characters
- `subdomain`: Required, 3-63 characters, alphanumeric + hyphens only, must be unique
- `adminEmail`: Required, valid email format
- `adminPassword`: Required, minimum 8 characters
- `adminFullName`: Required, 1-100 characters

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantName": "Acme Corporation",
    "subdomain": "acme",
    "adminUser": {
      "id": "660e8400-e29b-41d4-a716-446655440111",
      "email": "john@acme.com",
      "fullName": "John Doe",
      "role": "tenant_admin"
    }
  }
}
```

**Error Responses:**

409 Conflict - Subdomain already exists:

```json
{
  "error": "Subdomain 'acme' is already taken"
}
```

400 Bad Request - Validation error:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "param": "tenantName",
      "msg": "Tenant name is required"
    },
    {
      "param": "subdomain",
      "msg": "Subdomain must be 3-63 characters"
    }
  ]
}
```

**Curl Example:**

```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Acme Corporation",
    "subdomain": "acme",
    "adminEmail": "john@acme.com",
    "adminPassword": "SecurePassword123",
    "adminFullName": "John Doe"
  }'
```

---

### 1.2 Login

**Endpoint:** `POST /auth/login`  
**Auth Required:** No  
**Rate Limit:** 5 requests per minute per IP

**Request Body:**

```json
{
  "tenantSubdomain": "demo",
  "email": "admin@demo.com",
  "password": "Demo@123"
}
```

**Validation:**

- `tenantSubdomain`: Required, must exist
- `email`: Required, valid email format
- `password`: Required, must match user's password hash

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440111",
      "email": "admin@demo.com",
      "fullName": "Admin User",
      "role": "tenant_admin",
      "tenantId": "550e8400-e29b-41d4-a716-446655440000",
      "tenant": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Demo Organization",
        "subdomain": "demo",
        "subscriptionPlan": "pro"
      }
    }
  }
}
```

**Error Responses:**

401 Unauthorized - Invalid credentials:

```json
{
  "error": "Invalid tenant, email, or password"
}
```

403 Forbidden - Tenant suspended:

```json
{
  "error": "Tenant account is suspended"
}
```

**Curl Example:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantSubdomain": "demo",
    "email": "admin@demo.com",
    "password": "Demo@123"
  }'
```

---

### 1.3 Get Current User

**Endpoint:** `GET /auth/me`  
**Auth Required:** Yes  
**Method:** GET

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440111",
    "email": "admin@demo.com",
    "fullName": "Admin User",
    "role": "tenant_admin",
    "isActive": true,
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Demo Organization",
      "subdomain": "demo",
      "status": "active",
      "subscriptionPlan": "pro",
      "maxUsers": 25,
      "maxProjects": 15
    }
  }
}
```

**Error Responses:**

401 Unauthorized - No valid token:

```json
{
  "error": "Unauthorized: Invalid or expired token"
}
```

**Curl Example:**

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 1.4 Logout

**Endpoint:** `POST /auth/logout`  
**Auth Required:** Yes  
**Method:** POST

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully. Please clear your token on the client."
}
```

**Note:** Backend logs logout event. Client should delete JWT from localStorage.

**Curl Example:**

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 2. Tenant Management Endpoints

### 2.1 Get Tenant Details

**Endpoint:** `GET /tenants/:tenantId`  
**Auth Required:** Yes  
**Accessible By:** Tenant members (own tenant only), Super Admin (any tenant)

**Path Parameters:**

- `tenantId` (UUID): Organization ID

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Demo Organization",
    "subdomain": "demo",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 25,
    "maxProjects": 15,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-15T14:30:00Z",
    "statistics": {
      "totalUsers": 3,
      "totalProjects": 2,
      "totalTasks": 5
    }
  }
}
```

**Error Responses:**

403 Forbidden - Access denied:

```json
{
  "error": "Forbidden: You don't have access to this tenant"
}
```

404 Not Found - Tenant doesn't exist:

```json
{
  "error": "Tenant not found"
}
```

**Curl Example:**

```bash
curl -X GET http://localhost:5000/api/tenants/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 2.2 Update Tenant

**Endpoint:** `PUT /tenants/:tenantId`  
**Auth Required:** Yes  
**Accessible By:** Tenant Admin (own tenant), Super Admin (any tenant)

**Request Body (Tenant Admin):**

```json
{
  "name": "Updated Organization Name"
}
```

**Request Body (Super Admin):**

```json
{
  "name": "Updated Name",
  "status": "active",
  "subscriptionPlan": "enterprise",
  "maxUsers": 100,
  "maxProjects": 50
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Organization Name",
    "subscriptionPlan": "pro",
    "maxUsers": 25
  }
}
```

**Error Responses:**

403 Forbidden - Insufficient permissions:

```json
{
  "error": "Forbidden: Only tenant admin or super admin can update"
}
```

400 Bad Request - Invalid downgrade:

```json
{
  "error": "Cannot downgrade max_users: current 15 users exceeds new limit 10"
}
```

**Curl Example:**

```bash
curl -X PUT http://localhost:5000/api/tenants/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Organization Name"
  }'
```

---

### 2.3 List All Tenants

**Endpoint:** `GET /tenants`  
**Auth Required:** Yes  
**Accessible By:** Super Admin only

**Query Parameters:**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 10, max: 50)
- `status` (string, optional): Filter by status (active, suspended, deleted)
- `plan` (string, optional): Filter by plan (starter, pro, enterprise)
- `sortBy` (string, optional): Sort field (createdAt, name, userCount, projectCount)
- `sortOrder` (string, optional): asc or desc (default: desc)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Demo Organization",
        "subdomain": "demo",
        "status": "active",
        "subscriptionPlan": "pro",
        "userCount": 3,
        "projectCount": 2,
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Error Response:**

403 Forbidden - Not super admin:

```json
{
  "error": "Forbidden: Only super admin can list all tenants"
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/tenants?page=1&status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 3. User Management Endpoints

### 3.1 Add User to Tenant

**Endpoint:** `POST /tenants/:tenantId/users`  
**Auth Required:** Yes  
**Accessible By:** Tenant Admin (own tenant), Super Admin (any tenant)

**Request Body:**

```json
{
  "fullName": "Alice Johnson",
  "email": "alice@demo.com",
  "password": "SecurePassword123",
  "role": "user"
}
```

**Validation:**

- `fullName`: Required, 1-100 characters
- `email`: Required, valid email format, unique within tenant
- `password`: Required, minimum 8 characters
- `role`: Required, must be "user" or "admin"

**Success Response (201):**

```json
{
  "success": true,
  "message": "User added successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440222",
    "email": "alice@demo.com",
    "fullName": "Alice Johnson",
    "role": "user",
    "isActive": true,
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T14:30:00Z"
  }
}
```

**Error Responses:**

403 Forbidden - Insufficient permissions:

```json
{
  "error": "Forbidden: Only tenant admin can add users"
}
```

409 Conflict - User limit exceeded:

```json
{
  "error": "Subscription limit exceeded: Maximum 25 users allowed in pro plan, current: 25"
}
```

409 Conflict - Duplicate email:

```json
{
  "error": "Email 'alice@demo.com' is already registered in this tenant"
}
```

**Curl Example:**

```bash
curl -X POST http://localhost:5000/api/tenants/550e8400-e29b-41d4-a716-446655440000/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alice Johnson",
    "email": "alice@demo.com",
    "password": "SecurePassword123",
    "role": "user"
  }'
```

---

### 3.2 List Tenant Users

**Endpoint:** `GET /tenants/:tenantId/users`  
**Auth Required:** Yes  
**Accessible By:** Tenant members (own tenant), Super Admin (any tenant)

**Query Parameters:**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 20, max: 100)
- `search` (string, optional): Search by name or email
- `role` (string, optional): Filter by role (user, admin)
- `status` (string, optional): Filter by status (active, inactive)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440111",
        "email": "admin@demo.com",
        "fullName": "Admin User",
        "role": "tenant_admin",
        "isActive": true,
        "createdAt": "2024-01-01T10:00:00Z"
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440222",
        "email": "alice@demo.com",
        "fullName": "Alice Johnson",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-01-15T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/tenants/550e8400-e29b-41d4-a716-446655440000/users?page=1&role=user" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3.3 Update User

**Endpoint:** `PUT /users/:userId`  
**Auth Required:** Yes  
**Accessible By:** User (own profile), Tenant Admin, Super Admin

**Request Body (User updating self):**

```json
{
  "fullName": "Alice J. Johnson"
}
```

**Request Body (Admin updating others):**

```json
{
  "fullName": "Alice J. Johnson",
  "role": "admin",
  "isActive": true
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440222",
    "email": "alice@demo.com",
    "fullName": "Alice J. Johnson",
    "role": "user",
    "isActive": true
  }
}
```

**Error Responses:**

403 Forbidden - Insufficient permissions:

```json
{
  "error": "Forbidden: Cannot update other users without admin role"
}
```

400 Bad Request - Cannot change own role:

```json
{
  "error": "Cannot change your own role"
}
```

**Curl Example:**

```bash
curl -X PUT http://localhost:5000/api/users/770e8400-e29b-41d4-a716-446655440222 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Alice J. Johnson"
  }'
```

---

### 3.4 Delete User

**Endpoint:** `DELETE /users/:userId`  
**Auth Required:** Yes  
**Accessible By:** Tenant Admin (own tenant), Super Admin (any tenant)

**Success Response (200):**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**

403 Forbidden - Cannot delete self:

```json
{
  "error": "Forbidden: Cannot delete yourself"
}
```

404 Not Found - User doesn't exist:

```json
{
  "error": "User not found"
}
```

**Curl Example:**

```bash
curl -X DELETE http://localhost:5000/api/users/770e8400-e29b-41d4-a716-446655440222 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 4. Project Management Endpoints

### 4.1 Create Project

**Endpoint:** `POST /projects`  
**Auth Required:** Yes  
**Accessible By:** Any authenticated user in tenant

**Request Body:**

```json
{
  "name": "Website Redesign",
  "description": "Complete website UI/UX redesign",
  "status": "active"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440333",
    "name": "Website Redesign",
    "description": "Complete website UI/UX redesign",
    "status": "active",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "createdBy": "660e8400-e29b-41d4-a716-446655440111",
    "createdAt": "2024-01-15T14:30:00Z"
  }
}
```

**Error Responses:**

409 Conflict - Project limit exceeded:

```json
{
  "error": "Subscription limit exceeded: Maximum 15 projects allowed"
}
```

**Curl Example:**

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign",
    "description": "Complete website UI/UX redesign",
    "status": "active"
  }'
```

---

### 4.2 List Projects

**Endpoint:** `GET /projects`  
**Auth Required:** Yes

**Query Parameters:**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Results per page (default: 10)
- `search` (string, optional): Search by project name
- `status` (string, optional): Filter by status (active, archived)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440333",
        "name": "Website Redesign",
        "description": "Complete website UI/UX redesign",
        "status": "active",
        "createdBy": "Admin User",
        "createdAt": "2024-01-15T14:30:00Z",
        "taskStats": {
          "totalTasks": 5,
          "completedTasks": 2,
          "percentComplete": 40
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/projects?status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4.3 Update Project

**Endpoint:** `PUT /projects/:projectId`  
**Auth Required:** Yes  
**Accessible By:** Project creator, Tenant Admin

**Request Body:**

```json
{
  "name": "Website Redesign v2",
  "description": "Updated description",
  "status": "archived"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440333",
    "name": "Website Redesign v2",
    "status": "archived"
  }
}
```

**Curl Example:**

```bash
curl -X PUT http://localhost:5000/api/projects/880e8400-e29b-41d4-a716-446655440333 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Website Redesign v2"
  }'
```

---

### 4.4 Delete Project

**Endpoint:** `DELETE /projects/:projectId`  
**Auth Required:** Yes  
**Accessible By:** Project creator, Tenant Admin

**Success Response (200):**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Note:** Cascading delete removes all associated tasks

**Curl Example:**

```bash
curl -X DELETE http://localhost:5000/api/projects/880e8400-e29b-41d4-a716-446655440333 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 5. Task Management Endpoints

### 5.1 Create Task

**Endpoint:** `POST /projects/:projectId/tasks`  
**Auth Required:** Yes

**Request Body:**

```json
{
  "title": "Design Homepage",
  "description": "Create mockups for homepage",
  "priority": "high",
  "dueDate": "2024-02-01",
  "assignedTo": "770e8400-e29b-41d4-a716-446655440222"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440444",
    "title": "Design Homepage",
    "description": "Create mockups for homepage",
    "status": "todo",
    "priority": "high",
    "assignedTo": "Alice Johnson",
    "dueDate": "2024-02-01",
    "createdAt": "2024-01-15T14:30:00Z"
  }
}
```

**Curl Example:**

```bash
curl -X POST http://localhost:5000/api/projects/880e8400-e29b-41d4-a716-446655440333/tasks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Homepage",
    "description": "Create mockups for homepage",
    "priority": "high",
    "assignedTo": "770e8400-e29b-41d4-a716-446655440222"
  }'
```

---

### 5.2 List Project Tasks

**Endpoint:** `GET /projects/:projectId/tasks`  
**Auth Required:** Yes

**Query Parameters:**

- `status` (string, optional): Filter by status (todo, in_progress, completed)
- `priority` (string, optional): Filter by priority (high, medium, low)
- `assignedTo` (UUID, optional): Filter by assignee
- `search` (string, optional): Search by title

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440444",
        "title": "Design Homepage",
        "description": "Create mockups",
        "status": "in_progress",
        "priority": "high",
        "assignedTo": "Alice Johnson",
        "dueDate": "2024-02-01",
        "createdAt": "2024-01-15T14:30:00Z",
        "updatedAt": "2024-01-16T10:15:00Z"
      }
    ],
    "pagination": {
      "total": 1
    }
  }
}
```

**Curl Example:**

```bash
curl -X GET "http://localhost:5000/api/projects/880e8400-e29b-41d4-a716-446655440333/tasks?status=in_progress" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 5.3 Update Task Status

**Endpoint:** `PATCH /tasks/:taskId/status`  
**Auth Required:** Yes

**Request Body:**

```json
{
  "status": "in_progress"
}
```

**Allowed Status Values:** todo, in_progress, completed

**Success Response (200):**

```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440444",
    "title": "Design Homepage",
    "status": "in_progress",
    "updatedAt": "2024-01-16T10:15:00Z"
  }
}
```

**Curl Example:**

```bash
curl -X PATCH http://localhost:5000/api/tasks/990e8400-e29b-41d4-a716-446655440444/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

---

### 5.4 Update Task

**Endpoint:** `PUT /tasks/:taskId`  
**Auth Required:** Yes

**Request Body:**

```json
{
  "title": "Design Homepage - Updated",
  "description": "Updated description",
  "priority": "medium",
  "status": "completed",
  "assignedTo": "770e8400-e29b-41d4-a716-446655440222",
  "dueDate": "2024-02-05"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440444",
    "title": "Design Homepage - Updated",
    "status": "completed",
    "priority": "medium",
    "updatedAt": "2024-01-16T10:15:00Z"
  }
}
```

**Curl Example:**

```bash
curl -X PUT http://localhost:5000/api/tasks/990e8400-e29b-41d4-a716-446655440444 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design Homepage - Updated",
    "status": "completed"
  }'
```

---

## 6. Health Check

### 6.1 Health Check Endpoint

**Endpoint:** `GET /health`  
**Auth Required:** No

**Success Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-16T10:15:00Z",
  "database": "connected",
  "uptime": 3600
}
```

**Error Response (503):**

```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "message": "Database connection failed"
}
```

**Curl Example:**

```bash
curl http://localhost:5000/api/health
```

---

## Error Codes Reference

| Code | Meaning             | Description                                   |
| ---- | ------------------- | --------------------------------------------- |
| 200  | OK                  | Request successful                            |
| 201  | Created             | Resource created successfully                 |
| 400  | Bad Request         | Invalid input or validation error             |
| 401  | Unauthorized        | Missing or invalid authentication             |
| 403  | Forbidden           | Insufficient permissions                      |
| 404  | Not Found           | Resource doesn't exist                        |
| 409  | Conflict            | Resource conflict (duplicate, limit exceeded) |
| 429  | Too Many Requests   | Rate limit exceeded                           |
| 500  | Server Error        | Internal server error                         |
| 503  | Service Unavailable | Database or service unavailable               |

---

## Rate Limiting

| Endpoint              | Limit | Window   |
| --------------------- | ----- | -------- |
| /auth/register-tenant | 10    | 1 minute |
| /auth/login           | 5     | 1 minute |
| Other endpoints       | 100   | 1 minute |

---

**API Version:** 1.0  
**Last Updated:** 2024  
**Status:** Stable
