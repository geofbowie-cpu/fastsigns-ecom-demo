-- Add password_hash column to portal_users so users can log in with
-- email + password as an alternative to the magic-link flow.
-- Nullable — existing users have no password until an admin sets one.

alter table ecom_demos.portal_users
  add column if not exists password_hash text;
