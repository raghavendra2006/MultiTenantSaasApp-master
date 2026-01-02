-- Seed Data for Multi-Tenant SaaS Application

-- Insert Super Admin User (tenant_id is NULL)
-- Password: Admin@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'superadmin@system.com',
  '$2a$10$7c15pfys0qolFqZM8q/H9O0bG/ouSbZIzh9W0P.cYX4S6rcokJpt.',
  'Super Admin',
  'super_admin',
  true
) ON CONFLICT DO NOTHING;

-- Create Demo Tenant
INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Demo Company',
  'demo',
  'active',
  'pro',
  25,
  15
) ON CONFLICT DO NOTHING;

-- Create Tenant Admin for Demo Company
-- Password: Demo@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'admin@demo.com',
  '$2a$10$.jDredSTr4QevDaByk8NWeguHp3Mbl.pX16WXAGoyLcngR/NzzMQW',
  'Demo Admin',
  'tenant_admin',
  true
) ON CONFLICT DO NOTHING;

-- Create Regular Users for Demo Company
-- Password for all users: User@123
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active)
VALUES 
(
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'user1@demo.com',
  '$2a$10$9FfvhkkZF1/TcrCqG37PtenNvksDejYjtKvsghQm/oE4LD521c0My',
  'User One',
  'user',
  true
),
(
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  'user2@demo.com',
  '$2a$10$9FfvhkkZF1/TcrCqG37PtenNvksDejYjtKvsghQm/oE4LD521c0My',
  'User Two',
  'user',
  true
) ON CONFLICT DO NOTHING;

-- Create Sample Projects for Demo Company
INSERT INTO projects (id, tenant_id, name, description, status, created_by)
VALUES 
(
  '66666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  'Website Redesign',
  'Complete redesign of company website',
  'active',
  '33333333-3333-3333-3333-333333333333'
),
(
  '77777777-7777-7777-7777-777777777777',
  '22222222-2222-2222-2222-222222222222',
  'Mobile App Development',
  'Native iOS and Android app',
  'active',
  '33333333-3333-3333-3333-333333333333'
) ON CONFLICT DO NOTHING;

-- Create Sample Tasks for Projects
INSERT INTO tasks (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
VALUES 
(
  '88888888-8888-8888-8888-888888888881',
  '66666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  'Design homepage mockup',
  'Create high-fidelity design for homepage',
  'in_progress',
  'high',
  '44444444-4444-4444-4444-444444444444',
  '2024-12-31'
),
(
  '88888888-8888-8888-8888-888888888882',
  '66666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  'Implement navigation menu',
  'Build responsive navigation component',
  'todo',
  'medium',
  '55555555-5555-5555-5555-555555555555',
  '2025-01-05'
),
(
  '88888888-8888-8888-8888-888888888883',
  '66666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  'Setup database',
  'Configure PostgreSQL database',
  'completed',
  'high',
  '44444444-4444-4444-4444-444444444444',
  '2024-12-20'
),
(
  '88888888-8888-8888-8888-888888888884',
  '77777777-7777-7777-7777-777777777777',
  '22222222-2222-2222-2222-222222222222',
  'API authentication',
  'Implement JWT-based authentication',
  'in_progress',
  'high',
  '44444444-4444-4444-4444-444444444444',
  '2025-01-10'
),
(
  '88888888-8888-8888-8888-888888888885',
  '77777777-7777-7777-7777-777777777777',
  '22222222-2222-2222-2222-222222222222',
  'User management endpoints',
  'Create user CRUD endpoints',
  'todo',
  'medium',
  '55555555-5555-5555-5555-555555555555',
  '2025-01-15'
),
(
  '88888888-8888-8888-8888-888888888886',
  '66666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  'Add footer section',
  'Create footer with links and info',
  'todo',
  'low',
  NULL,
  '2025-01-20'
) ON CONFLICT DO NOTHING;
