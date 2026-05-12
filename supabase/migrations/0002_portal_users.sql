-- Portal users — emails allowed to sign in via magic link at the root page.
-- Run this in Supabase SQL Editor before deploying the magic-link auth feature.

create table if not exists ecom_demos.portal_users (
  email            text primary key,
  created_at       timestamptz not null default now(),
  last_sign_in_at  timestamptz
);
