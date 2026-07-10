-- Admin-curated, ordered list of featured product slugs per tenant.
-- Empty = fall back to the automatic featured filter (products.featured).
alter table ecom_demos.tenants
  add column if not exists featured_product_slugs text[] not null default '{}';
