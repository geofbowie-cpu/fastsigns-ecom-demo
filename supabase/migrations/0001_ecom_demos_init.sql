-- ============================================================
-- ecom_demos schema — multi-tenant demo storefront builder
-- Isolated from the DAM (public schema). Service-role-only access.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS ecom_demos;

-- ─────────────────────────────────────────────────────────────
-- tenants — one row per branded demo site
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ecom_demos.tenants (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text NOT NULL UNIQUE,
  name                  text NOT NULL,
  brand                 jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled_categories    text[] NOT NULL DEFAULT '{}',
  product_overrides     jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_email           text,
  archived              boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT slug_lowercase CHECK (slug = lower(slug)),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' OR length(slug) = 1)
);

CREATE INDEX IF NOT EXISTS tenants_slug_active_idx
  ON ecom_demos.tenants (slug)
  WHERE NOT archived;

-- updated_at trigger
CREATE OR REPLACE FUNCTION ecom_demos.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_updated_at ON ecom_demos.tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON ecom_demos.tenants
  FOR EACH ROW EXECUTE FUNCTION ecom_demos.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- API exposure: tell PostgREST about the schema so supabase-js
-- can use .schema('ecom_demos') to read/write these tables.
-- ─────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA ecom_demos TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ecom_demos TO service_role;
GRANT SELECT ON ecom_demos.tenants TO anon, authenticated;

-- Lock down anon/authenticated to read-only on non-archived rows only
ALTER TABLE ecom_demos.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_public_read ON ecom_demos.tenants;
CREATE POLICY tenants_public_read ON ecom_demos.tenants
  FOR SELECT
  TO anon, authenticated
  USING (NOT archived);

-- service_role bypasses RLS by default; no policy needed for it.
