-- Vendor minimum order quantity + pack increment per product.
alter table ecom_demos.products
  add column if not exists min_order_qty integer,
  add column if not exists order_increment integer;

-- Seed the known vendor minimums (applies to all variants by name).
update ecom_demos.products set min_order_qty = 100, order_increment = 100 where name ilike '%lanyard%';
update ecom_demos.products set min_order_qty = 48,  order_increment = 1   where name ilike '%mug%';
update ecom_demos.products set min_order_qty = 100, order_increment = 1   where name ilike '%lapel pin%';
update ecom_demos.products set min_order_qty = 100, order_increment = 1   where name ilike '%sticker%';
update ecom_demos.products set min_order_qty = 50,  order_increment = 1   where name ilike '%water bottle%';
update ecom_demos.products set min_order_qty = 100, order_increment = 1   where name ilike '%brochure%';
