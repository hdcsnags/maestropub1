CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS app;

SET search_path TO app, public;

CREATE TABLE IF NOT EXISTS app.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    created_by UUID REFERENCES app.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.project_members (
    project_id UUID NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'maintainer', 'member', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES app.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES app.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES app.users(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES app.users(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON app.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON app.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON app.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON app.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON app.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON app.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON app.tasks(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON app.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_entity_id ON app.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON app.audit_logs(created_at);

CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON app.users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON app.users
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at();

DROP TRIGGER IF EXISTS trg_projects_set_updated_at ON app.projects;
CREATE TRIGGER trg_projects_set_updated_at
BEFORE UPDATE ON app.projects
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_set_updated_at ON app.tasks;
CREATE TRIGGER trg_tasks_set_updated_at
BEFORE UPDATE ON app.tasks
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at();

INSERT INTO app.users (email, display_name, password_hash, role)
VALUES (
    'admin@session74.local',
    'Session 74 Admin',
    crypt('change-me-now', gen_salt('bf')),
    'admin'
)
ON CONFLICT (email) DO NOTHING;
