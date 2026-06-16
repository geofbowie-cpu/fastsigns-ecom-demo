-- Required contact details collected at PO submission.
alter table ecom_demos.orders
  add column if not exists contact_first_name text,
  add column if not exists contact_last_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;
