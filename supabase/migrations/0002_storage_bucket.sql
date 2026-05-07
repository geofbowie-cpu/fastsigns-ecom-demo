-- ============================================================
-- Storage bucket for tenant hero / logo uploads
-- Public read; service-role write only.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets',
  'tenant-assets',
  true,                                      -- public read
  10 * 1024 * 1024,                          -- 10 MB cap
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read policy (any visitor can view tenant images)
DROP POLICY IF EXISTS "tenant_assets_public_read" ON storage.objects;
CREATE POLICY "tenant_assets_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'tenant-assets');

-- Block anon/authenticated writes; service_role bypasses RLS so it can write.
DROP POLICY IF EXISTS "tenant_assets_no_write" ON storage.objects;
CREATE POLICY "tenant_assets_no_write"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);
