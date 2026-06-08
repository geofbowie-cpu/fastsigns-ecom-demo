-- Cart → purchase-order submissions for live storefronts.
-- One row per submitted cart. Line items live in a jsonb array so the schema
-- stays flexible (qty + per-line note, no pricing in this phase).

-- Per-site toggle: cart/ordering is off by default. Reddy Ice and every other
-- existing site stay off until an admin explicitly enables it.
ALTER TABLE ecom_demos.tenants
  ADD COLUMN IF NOT EXISTS enable_cart boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS ecom_demos.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid REFERENCES ecom_demos.tenants(id) ON DELETE CASCADE,
  tenant_slug     text NOT NULL,
  customer_email  text NOT NULL,
  items           jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_notes     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_tenant_idx
  ON ecom_demos.orders(tenant_id, created_at DESC);

GRANT ALL ON ecom_demos.orders TO service_role;
