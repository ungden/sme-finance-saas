-- RealProfit Multi-Tenant Workspace Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ══════════════════════════════════════════════════
-- 1. WORKSPACES (= Brand / Chuỗi)
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- 2. WORKSPACE MEMBERS (Vai trò trong workspace)
-- ══════════════════════════════════════════════════
CREATE TYPE member_role AS ENUM ('owner', 'editor', 'viewer', 'investor');

CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'viewer',
    invited_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- ══════════════════════════════════════════════════
-- 3. BRANCHES (Chi nhánh — mỗi cái có BCTC riêng)
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    years_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    employees JSONB NOT NULL DEFAULT '[]'::jsonb,
    facilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- 4. BRANCH INVESTORS (NĐT gắn với chi nhánh cụ thể)
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS branch_investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
    equity_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    UNIQUE(branch_id, member_id)
);

-- ══════════════════════════════════════════════════
-- 5. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_investors ENABLE ROW LEVEL SECURITY;

-- Workspaces: only members can see
CREATE POLICY "Members can view workspaces" ON workspaces
    FOR SELECT USING (
        id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Auth users can create workspaces" ON workspaces
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update workspace" ON workspaces
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owner can delete workspace" ON workspaces
    FOR DELETE USING (owner_id = auth.uid());

-- Workspace Members: members can see co-members, owner can manage
CREATE POLICY "Members can view members" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid())
    );

CREATE POLICY "Owner can insert members" ON workspace_members
    FOR INSERT WITH CHECK (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

CREATE POLICY "Owner can delete members" ON workspace_members
    FOR DELETE USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

-- Branches: workspace members can see; owner+editor can modify
CREATE POLICY "Members can view branches" ON branches
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Owner/Editor can insert branches" ON branches
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Owner/Editor can update branches" ON branches
    FOR UPDATE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Owner can delete branches" ON branches
    FOR DELETE USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Branch Investors: workspace members can view, owner manages
CREATE POLICY "Members can view branch investors" ON branch_investors
    FOR SELECT USING (
        branch_id IN (
            SELECT b.id FROM branches b
            JOIN workspace_members wm ON b.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Owner can manage branch investors" ON branch_investors
    FOR ALL USING (
        branch_id IN (
            SELECT b.id FROM branches b
            JOIN workspaces w ON b.workspace_id = w.id
            WHERE w.owner_id = auth.uid()
        )
    );

-- ══════════════════════════════════════════════════
-- 6. AUTO-INSERT OWNER AS WORKSPACE MEMBER (Trigger)
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auto_add_owner_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_workspace_created
    AFTER INSERT ON workspaces
    FOR EACH ROW EXECUTE FUNCTION auto_add_owner_member();
