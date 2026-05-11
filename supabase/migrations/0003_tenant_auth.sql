-- Tenant-level access control: allowed domains + visitor log.

ALTER TABLE ecom_demos.tenants
  ADD COLUMN IF NOT EXISTS allowed_domains text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS ecom_demos.tenant_visitors (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES ecom_demos.tenants(id) ON DELETE CASCADE,
  email        text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  sign_in_count int NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, email)
);

GRANT ALL ON ecom_demos.tenant_visitors TO service_role;
