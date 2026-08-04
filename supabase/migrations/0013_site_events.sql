-- In-app traffic/event log so anonymous storefront traffic is captured in our
-- own DB (in addition to GTM/GA). Written by the public /api/track beacon.
create table if not exists ecom_demos.site_events (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  event text not null,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists site_events_tenant_created_idx
  on ecom_demos.site_events (tenant_slug, created_at desc);
create index if not exists site_events_event_idx on ecom_demos.site_events (event);

-- REQUIRED: tables created via raw SQL do NOT inherit role grants automatically,
-- so PostgREST (supabase-js) inserts fail with "permission denied" (42501) until
-- the API role is granted. All access here is via the service-role adminClient.
grant select, insert, update, delete on ecom_demos.site_events to service_role;

-- Belt-and-suspenders: RLS on (service_role bypasses; anon has no grant anyway).
alter table ecom_demos.site_events enable row level security;

-- PostgREST caches the schema; reload so it sees the new table + grants.
notify pgrst, 'reload schema';
