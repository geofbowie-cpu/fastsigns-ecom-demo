-- Per-site marketing popup (modal or pasted third-party embed).
-- Stored as a single jsonb blob so the shape can evolve without migrations.
-- Shape lives in lib/popup.ts (TenantPopup). Off by default everywhere.

alter table ecom_demos.tenants
  add column if not exists popup jsonb not null default '{}'::jsonb;

comment on column ecom_demos.tenants.popup is
  'Marketing popup config — see TenantPopup in lib/popup.ts. {} / {"enabled":false} = no popup.';

notify pgrst, 'reload schema';
