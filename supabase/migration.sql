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

-- ══════════════════════════════════════════════════
-- 7. FINANCE OS: ALLOCATION RULES
-- Quy tắc phân bổ % doanh thu → quỹ
-- ══════════════════════════════════════════════════
CREATE TYPE allocation_category AS ENUM ('cogs', 'marketing', 'operations', 'payroll', 'profit');

CREATE TABLE IF NOT EXISTS allocation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    category allocation_category NOT NULL,
    percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(workspace_id, category)
);

-- ══════════════════════════════════════════════════
-- 8. FINANCE OS: DEPARTMENTS
-- Phòng ban + % phân bổ từ Payroll pool
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    payroll_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- 9. FINANCE OS: EMPLOYEE ASSIGNMENTS
-- Gắn nhân viên vào phòng ban với salary + bonus
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS employee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    base_salary NUMERIC(15,0) NOT NULL DEFAULT 0,
    bonus NUMERIC(15,0) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- 10. FINANCE OS: MARKETING CHANNELS
-- Chia budget Marketing → kênh (Ads, Influencer, Content...)
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS marketing_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- 11. FINANCE OS: DAILY CASHFLOW
-- Ghi nhận doanh thu/chi phí hàng ngày
-- ══════════════════════════════════════════════════
CREATE TYPE cashflow_source AS ENUM ('manual', 'invoice');

CREATE TABLE IF NOT EXISTS daily_cashflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    revenue NUMERIC(15,0) NOT NULL DEFAULT 0,
    expense NUMERIC(15,0) NOT NULL DEFAULT 0,
    source cashflow_source NOT NULL DEFAULT 'manual',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- 12. FINANCE OS: ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════

ALTER TABLE allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_cashflow ENABLE ROW LEVEL SECURITY;

-- Helper: workspace membership check
-- All Finance OS tables use workspace_id, so RLS checks membership

-- allocation_rules
CREATE POLICY "Members can view allocation_rules" ON allocation_rules
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Owner/Editor can manage allocation_rules" ON allocation_rules
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

-- departments
CREATE POLICY "Members can view departments" ON departments
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Owner/Editor can manage departments" ON departments
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

-- employee_assignments
CREATE POLICY "Members can view employee_assignments" ON employee_assignments
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Owner/Editor can manage employee_assignments" ON employee_assignments
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

-- marketing_channels
CREATE POLICY "Members can view marketing_channels" ON marketing_channels
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Owner/Editor can manage marketing_channels" ON marketing_channels
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

-- daily_cashflow
CREATE POLICY "Members can view daily_cashflow" ON daily_cashflow
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Owner/Editor can manage daily_cashflow" ON daily_cashflow
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

-- ══════════════════════════════════════════════════
-- 13. FINANCE OS: DEFAULT ALLOCATION RULES TRIGGER
-- Khi tạo workspace mới, tự tạo 5 rule mặc định
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auto_create_default_allocation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO allocation_rules (workspace_id, category, percent) VALUES
        (NEW.id, 'cogs', 30),
        (NEW.id, 'marketing', 15),
        (NEW.id, 'operations', 20),
        (NEW.id, 'payroll', 20),
        (NEW.id, 'profit', 15);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_workspace_created_allocation
    AFTER INSERT ON workspaces
    FOR EACH ROW EXECUTE FUNCTION auto_create_default_allocation();

-- ══════════════════════════════════════════════════
-- 14. FINANCE OS: FINANCIAL PLANS (AI-generated)
-- Kế hoạch tài chính 12 tháng do AI generate
-- ══════════════════════════════════════════════════
CREATE TYPE plan_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE IF NOT EXISTS financial_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    year INT NOT NULL,
    annual_revenue_target NUMERIC(15,0) NOT NULL DEFAULT 0,
    industry TEXT DEFAULT '',
    business_context TEXT DEFAULT '',
    status plan_status NOT NULL DEFAULT 'draft',
    ai_summary TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- 15. FINANCE OS: MONTHLY TARGETS
-- Kế hoạch chi tiết từng tháng (AI generate hoặc manual)
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS monthly_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES financial_plans(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),
    revenue NUMERIC(15,0) NOT NULL DEFAULT 0,
    cogs NUMERIC(15,0) NOT NULL DEFAULT 0,
    marketing NUMERIC(15,0) NOT NULL DEFAULT 0,
    operations NUMERIC(15,0) NOT NULL DEFAULT 0,
    payroll NUMERIC(15,0) NOT NULL DEFAULT 0,
    profit NUMERIC(15,0) NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(plan_id, month)
);

-- ══════════════════════════════════════════════════
-- 16. FINANCE OS: PLAN RLS
-- ══════════════════════════════════════════════════
ALTER TABLE financial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view financial_plans" ON financial_plans
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Owner/Editor can manage financial_plans" ON financial_plans
    FOR ALL USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Members can view monthly_targets" ON monthly_targets
    FOR SELECT USING (
        plan_id IN (
            SELECT fp.id FROM financial_plans fp
            JOIN workspace_members wm ON fp.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid()
        )
    );
CREATE POLICY "Owner/Editor can manage monthly_targets" ON monthly_targets
    FOR ALL USING (
        plan_id IN (
            SELECT fp.id FROM financial_plans fp
            JOIN workspace_members wm ON fp.workspace_id = wm.workspace_id
            WHERE wm.user_id = auth.uid() AND wm.role IN ('owner', 'editor')
        )
    );
