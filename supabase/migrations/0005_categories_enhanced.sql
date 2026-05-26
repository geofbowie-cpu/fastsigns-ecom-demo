-- Enhance categories table with image support and explicit product assignments.
-- image_url: optional hero/card image for a category
-- product_slugs: for custom categories — explicit product list (overrides category matching)

ALTER TABLE ecom_demos.categories
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS product_slugs text[] NOT NULL DEFAULT '{}';
