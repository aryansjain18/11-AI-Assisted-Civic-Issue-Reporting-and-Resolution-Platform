
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/001_initial_schema.sql',
)
const sql = readFileSync(migrationPath, 'utf-8')

describe('001_initial_schema.sql security & schema invariants', () => {
  it('creates profiles, reports, and status_events tables', () => {
    expect(sql).toMatch(/CREATE TABLE public\.profiles/i)
    expect(sql).toMatch(/CREATE TABLE public\.reports/i)
    expect(sql).toMatch(/CREATE TABLE public\.status_events/i)
  })

  it('includes deleted_at and a partial index for non-deleted reports', () => {
    expect(sql).toMatch(/deleted_at timestamptz/i)
    expect(sql).toMatch(/WHERE deleted_at IS NULL/i)
  })

  it('enables Row Level Security on every application table', () => {
    expect(sql).toMatch(/ALTER TABLE public\.profiles ENABLE ROW LEVEL SECURITY/i)
    expect(sql).toMatch(/ALTER TABLE public\.reports ENABLE ROW LEVEL SECURITY/i)
    expect(sql).toMatch(
      /ALTER TABLE public\.status_events ENABLE ROW LEVEL SECURITY/i,
    )
  })

  it('hardcodes citizen role in handle_new_user trigger and ignores metadata roles', () => {
    expect(sql).toMatch(/VALUES\s*\(NEW\.id,\s*v_display_name,\s*'citizen'\)/i)
    expect(sql).not.toMatch(/raw_user_meta_data\s*->>\s*'role'/i)
  })

  it('restricts profile updates to display_name only', () => {
    expect(sql).toMatch(
      /REVOKE ALL PRIVILEGES ON TABLE public\.profiles FROM PUBLIC, anon, authenticated/i,
    )
    expect(sql).toMatch(
      /GRANT UPDATE \(display_name\) ON TABLE public\.profiles TO authenticated/i,
    )
    expect(sql).not.toMatch(
      /GRANT UPDATE ON TABLE public\.profiles TO authenticated/i,
    )
  })

  it('secures is_admin() with fixed search_path and restricted execute permissions', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.is_admin\(\)/i)
    expect(sql).toMatch(/SET search_path = ''/i)
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.is_admin\(\) FROM PUBLIC/i)
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.is_admin\(\) TO authenticated/i,
    )
  })

  it('never uses broad USING (true) or WITH CHECK (true) policies', () => {
    expect(sql).not.toMatch(/USING\s*\(\s*true\s*\)/i)
    expect(sql).not.toMatch(/WITH CHECK\s*\(\s*true\s*\)/i)
  })

  it('revokes anonymous access on all tables', () => {
    expect(sql).toMatch(
      /REVOKE ALL PRIVILEGES ON TABLE public\.profiles FROM PUBLIC, anon, authenticated/i,
    )
    expect(sql).toMatch(
      /REVOKE ALL PRIVILEGES ON TABLE public\.reports FROM PUBLIC, anon, authenticated/i,
    )
    expect(sql).toMatch(
      /REVOKE ALL PRIVILEGES ON TABLE public\.status_events FROM PUBLIC, anon, authenticated/i,
    )
  })

  it('prevents citizens from forging status, priority, ownership, or deleted_at on insert or update', () => {
    expect(sql).toMatch(
      /CREATE POLICY "reports_insert_own"[\s\S]*?reporter_id = auth\.uid\(\)[\s\S]*?status = 'submitted'[\s\S]*?priority = 'low'[\s\S]*?deleted_at IS NULL/i,
    )
    expect(sql).toMatch(
      /CREATE POLICY "reports_update_admin"[\s\S]*?USING \(public\.is_admin\(\)\)[\s\S]*?WITH CHECK \(public\.is_admin\(\)\)/i,
    )
  })
})

const adminRpcPath = resolve(
  process.cwd(),
  'supabase/migrations/002_admin_rpcs.sql',
)
const adminRpcSql = readFileSync(adminRpcPath, 'utf-8')

describe('002_admin_rpcs.sql security & atomicity invariants', () => {
  it('defines update_report_status and update_report_priority with SECURITY DEFINER and fixed search_path', () => {
    expect(adminRpcSql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.update_report_status/i,
    )
    expect(adminRpcSql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.update_report_priority/i,
    )
    expect(adminRpcSql).toMatch(/SECURITY DEFINER/i)
    expect(adminRpcSql).toMatch(/SET search_path = ''/i)
  })

  it('enforces public.is_admin() inside both admin RPCs', () => {
    const matches = adminRpcSql.match(/IF NOT public\.is_admin\(\)/gi) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })

  it('inserts into status_events inside update_report_status and restricts execution to authenticated', () => {
    expect(adminRpcSql).toMatch(/INSERT INTO public\.status_events/i)

    expect(adminRpcSql).toMatch(
      /REVOKE ALL ON FUNCTION public\.update_report_status\(uuid, text, text\)[\s\S]*?FROM PUBLIC/i,
    )
    expect(adminRpcSql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.update_report_status\(uuid, text, text\)\s+TO authenticated/i,
    )
    expect(adminRpcSql).toMatch(
      /REVOKE ALL ON FUNCTION public\.update_report_priority\(uuid, text\)[\s\S]*?FROM PUBLIC/i,
    )
    expect(adminRpcSql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.update_report_priority\(uuid, text\)\s+TO authenticated/i,
    )
  })
})

const publicReportsRpcPath = resolve(
  process.cwd(),
  'supabase/migrations/003_public_reports_rpc.sql',
)
const publicReportsRpcSql = readFileSync(publicReportsRpcPath, 'utf-8')

describe('003_public_reports_rpc.sql privacy & security invariants', () => {
  it('defines get_public_reports with SECURITY DEFINER and fixed search_path', () => {
    expect(publicReportsRpcSql).toMatch(
      /CREATE(?: OR REPLACE)? FUNCTION public\.get_public_reports\(\)/i,
    )
    expect(publicReportsRpcSql).toMatch(/SECURITY DEFINER/i)
    expect(publicReportsRpcSql).toMatch(/SET search_path = ''/i)
  })

  it('excludes deleted and rejected reports and omits private columns', () => {
    expect(publicReportsRpcSql).toMatch(/r\.deleted_at IS NULL/i)
    expect(publicReportsRpcSql).toMatch(/r\.status <> 'rejected'/i)

    expect(publicReportsRpcSql).not.toMatch(/r\.reporter_id/i)
    expect(publicReportsRpcSql).not.toMatch(/r\.description/i)
    expect(publicReportsRpcSql).not.toMatch(/r\.photo_path/i)
    expect(publicReportsRpcSql).not.toMatch(/r\.title/i)
    expect(publicReportsRpcSql).not.toMatch(/r\.location_text/i)
    expect(publicReportsRpcSql).not.toMatch(/email/i)
  })

  it('uses generic titles and approximate coordinates for public reports', () => {
    expect(publicReportsRpcSql).toMatch(
      /initcap\(replace\(r\.category::text,\s*'_',\s*' '\)\)\s*\|\|\s*' report'/i,
    )
    expect(publicReportsRpcSql).toMatch(/round\(r\.location_lat::numeric,\s*2\)/i)
    expect(publicReportsRpcSql).toMatch(/round\(r\.location_lng::numeric,\s*2\)/i)
    expect(publicReportsRpcSql).toMatch(/'Approximate area'/i)
  })

  it('revokes execute from PUBLIC, anon, and authenticated before granting access', () => {
    expect(publicReportsRpcSql).toMatch(
      /REVOKE ALL ON FUNCTION public\.get_public_reports\(\)\s+FROM PUBLIC,\s*anon,\s*authenticated/i,
    )

    expect(publicReportsRpcSql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.get_public_reports\(\)\s+TO anon,\s*authenticated/i,
    )
  })
})

const analyticsRpcPath = resolve(
  process.cwd(),
  'supabase/migrations/004_analytics_rpc.sql',
)
const analyticsRpcSql = readFileSync(analyticsRpcPath, 'utf-8')

describe('004_analytics_rpc.sql privacy & security invariants', () => {
  it('defines get_analytics_summary with SECURITY DEFINER and fixed search_path', () => {
    expect(analyticsRpcSql).toMatch(
      /CREATE(?: OR REPLACE)? FUNCTION public\.get_analytics_summary\(\)/i,
    )
    expect(analyticsRpcSql).toMatch(/SECURITY DEFINER/i)
    expect(analyticsRpcSql).toMatch(/SET search_path = ''/i)
  })

  it('queries only active reports (deleted_at IS NULL) and returns aggregates', () => {
    expect(analyticsRpcSql).toMatch(/deleted_at IS NULL/i)
    expect(analyticsRpcSql).toMatch(/count\(\*\)/i)
    expect(analyticsRpcSql).toMatch(/json_object_agg/i)
    expect(analyticsRpcSql).toMatch(/json_build_object/i)
  })

  it('never references reporter_id, email, description, photo_path, or location_text', () => {
    expect(analyticsRpcSql).not.toMatch(/reporter_id/i)
    expect(analyticsRpcSql).not.toMatch(/email/i)
    expect(analyticsRpcSql).not.toMatch(/description/i)
    expect(analyticsRpcSql).not.toMatch(/photo_path/i)
    expect(analyticsRpcSql).not.toMatch(/location_text/i)
    expect(analyticsRpcSql).not.toMatch(/location_lat/i)
    expect(analyticsRpcSql).not.toMatch(/location_lng/i)
  })

  it('revokes execute from PUBLIC before granting to anon and authenticated', () => {
    expect(analyticsRpcSql).toMatch(
      /REVOKE ALL ON FUNCTION public\.get_analytics_summary\(\)[\s\S]*?FROM PUBLIC/i,
    )
    expect(analyticsRpcSql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.get_analytics_summary\(\)\s+TO anon,\s*authenticated/i,
    )
  })
})
