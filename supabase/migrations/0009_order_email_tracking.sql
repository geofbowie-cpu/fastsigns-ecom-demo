-- Track PO email delivery per order: who it was sent to, status, when, and any error.
alter table ecom_demos.orders
  add column if not exists po_email_to text,
  add column if not exists po_email_status text check (po_email_status in ('sent', 'failed')),
  add column if not exists po_email_sent_at timestamptz,
  add column if not exists po_email_error text;
