-- Per-tenant storefront design version: "legacy" (default) or "v2".
alter table ecom_demos.tenants
  add column if not exists theme text not null default 'legacy'
    check (theme in ('legacy', 'v2'));
