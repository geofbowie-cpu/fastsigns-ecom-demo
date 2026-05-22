-- Quote request submissions from tenant product pages (demo mode).
-- One row per submission of the in-app quote form.

CREATE TABLE IF NOT EXISTS ecom_demos.quote_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES ecom_demos.tenants(id) ON DELETE CASCADE,
  tenant_slug   text NOT NULL,
  product_slug  text NOT NULL,
  product_name  text NOT NULL,
  email         text NOT NULL,
  first_name    text,
  last_name     text,
  comments      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_requests_tenant_idx
  ON ecom_demos.quote_requests(tenant_id, created_at DESC);

GRANT ALL ON ecom_demos.quote_requests TO service_role;
