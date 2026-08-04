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
-- Lock out direct anon/PostgREST access; writes go through our service-role API.
alter table ecom_demos.site_events enable row level security;
