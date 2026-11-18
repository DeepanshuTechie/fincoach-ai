-- =========================================================================
-- FINCOACH AUTONOMOUS TAX RULES SCHEMA
-- Run this in your Supabase SQL Editor to enable Cloud Persistence
-- for Autonomous AI Budget Ingestion
-- =========================================================================

CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_year TEXT UNIQUE NOT NULL,
    assessment_year TEXT NOT NULL,
    budget_announcement TEXT,
    rules_json JSONB NOT NULL,
    source TEXT DEFAULT 'AI_AUTONOMOUS_INGESTION',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;

-- Allow reading tax rules for all users
DROP POLICY IF EXISTS "Allow public read access to tax rules" ON tax_rules;
CREATE POLICY "Allow public read access to tax rules" 
ON tax_rules FOR SELECT USING (true);

-- Allow inserting/updating tax rules
DROP POLICY IF EXISTS "Allow insert or update for tax rules" ON tax_rules;
CREATE POLICY "Allow insert or update for tax rules" 
ON tax_rules FOR ALL USING (true);
