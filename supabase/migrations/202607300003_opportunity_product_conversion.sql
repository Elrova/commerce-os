create type public.product_conversion_status as enum ('manual', 'from_opportunity');

alter table public.products
  add column supplier_id uuid references public.suppliers(id) on delete set null,
  add column preferred_supplier_offer_id uuid,
  add column customs_cost numeric(12, 2) not null default 0 check (customs_cost >= 0),
  add column payment_fees numeric(12, 2) not null default 0 check (payment_fees >= 0),
  add column total_unit_cost numeric(12, 2) not null default 0 check (total_unit_cost >= 0),
  add column margin_amount numeric(12, 2) not null default 0,
  add column margin_percent numeric(7, 2) not null default 0,
  add column roi_percent numeric(7, 2) not null default 0,
  add column currency char(3) not null default 'EUR',
  add column conversion_status public.product_conversion_status not null default 'manual',
  add column converted_at timestamptz,
  add column notes text;

alter table public.supplier_offers
  add column source_supplier_offer_id uuid references public.supplier_offers(id) on delete set null;

alter table public.products
  add constraint products_preferred_supplier_offer_fkey
  foreign key (preferred_supplier_offer_id)
  references public.supplier_offers(id)
  on delete set null;

create unique index products_one_per_opportunity_idx
  on public.products(opportunity_id)
  where opportunity_id is not null;
create index products_supplier_id_idx on public.products(supplier_id);
create index products_preferred_offer_idx on public.products(preferred_supplier_offer_id);
create index supplier_offers_source_idx on public.supplier_offers(source_supplier_offer_id);

create or replace function public.validate_product_workspace_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.opportunity_id is not null and not exists (
    select 1 from public.opportunities
    where id = new.opportunity_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Opportunity and product must belong to the same workspace';
  end if;

  if new.supplier_id is not null and not exists (
    select 1 from public.suppliers
    where id = new.supplier_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Supplier and product must belong to the same workspace';
  end if;

  if new.preferred_supplier_offer_id is not null and not exists (
    select 1 from public.supplier_offers
    where id = new.preferred_supplier_offer_id
      and workspace_id = new.workspace_id
      and product_id = new.id
      and supplier_id = new.supplier_id
  ) then
    raise exception 'Preferred offer must target this product and workspace';
  end if;

  return new;
end;
$$;

create trigger validate_product_workspace_links_before_write
before insert or update on public.products
for each row execute function public.validate_product_workspace_links();

create or replace function public.convert_opportunity_to_product(
  target_workspace_id uuid,
  target_opportunity_id uuid,
  selected_offer_id uuid,
  product_name text,
  product_sku text,
  product_category text,
  product_description text,
  product_status public.product_status,
  product_purchase_price numeric,
  product_shipping_cost numeric,
  product_customs_cost numeric,
  product_payment_fees numeric,
  product_sale_price numeric,
  product_stock_quantity integer,
  product_currency char(3),
  product_notes text,
  manual_conversion_confirmed boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  opportunity_record public.opportunities%rowtype;
  offer_record public.supplier_offers%rowtype;
  new_product_id uuid;
  new_offer_id uuid;
  computed_total numeric(12, 2);
  computed_margin numeric(12, 2);
  computed_margin_percent numeric(7, 2);
  computed_roi_percent numeric(7, 2);
begin
  if not public.can_manage_workspace(target_workspace_id) then
    raise exception 'Insufficient workspace permissions';
  end if;

  select * into opportunity_record
  from public.opportunities
  where id = target_opportunity_id and workspace_id = target_workspace_id
  for update;

  if not found then raise exception 'Opportunity not found'; end if;
  if opportunity_record.status = 'converted' or exists (
    select 1 from public.products where opportunity_id = target_opportunity_id
  ) then
    raise exception 'Opportunity already converted';
  end if;

  if selected_offer_id is not null then
    select * into offer_record
    from public.supplier_offers
    where id = selected_offer_id
      and opportunity_id = target_opportunity_id
      and workspace_id = target_workspace_id
    for update;
    if not found then raise exception 'Supplier offer not found for opportunity'; end if;
  elsif not manual_conversion_confirmed then
    raise exception 'Manual conversion must be explicitly confirmed';
  end if;

  if product_purchase_price < 0 or product_shipping_cost < 0
     or product_customs_cost < 0 or product_payment_fees < 0
     or product_sale_price < 0 or product_stock_quantity < 0 then
    raise exception 'Financial values and stock cannot be negative';
  end if;

  computed_total := round(product_purchase_price + product_shipping_cost + product_customs_cost + product_payment_fees, 2);
  computed_margin := round(product_sale_price - computed_total, 2);
  computed_margin_percent := case when product_sale_price > 0 then round(computed_margin / product_sale_price * 100, 2) else 0 end;
  computed_roi_percent := case when computed_total > 0 then round(computed_margin / computed_total * 100, 2) else 0 end;

  insert into public.products (
    workspace_id, opportunity_id, supplier_id, name, sku, category, description,
    status, purchase_price, shipping_cost, customs_cost, payment_fees,
    total_unit_cost, sale_price, margin_amount, margin_percent, roi_percent,
    currency, stock_quantity, conversion_status, converted_at, notes
  ) values (
    target_workspace_id, target_opportunity_id,
    case when selected_offer_id is null then null else offer_record.supplier_id end,
    product_name, upper(product_sku), nullif(product_category, ''), nullif(product_description, ''),
    product_status, product_purchase_price, product_shipping_cost, product_customs_cost,
    product_payment_fees, computed_total, product_sale_price, computed_margin,
    computed_margin_percent, computed_roi_percent, upper(product_currency),
    product_stock_quantity, 'from_opportunity', now(), nullif(product_notes, '')
  ) returning id into new_product_id;

  if selected_offer_id is not null then
    insert into public.supplier_offers (
      workspace_id, supplier_id, product_id, opportunity_id, source_supplier_offer_id,
      supplier_product_url, supplier_sku, currency, unit_price, shipping_cost, customs_cost,
      platform_or_payment_fees, sample_price, minimum_order_quantity,
      lead_time_days, available_stock, rating, last_checked_at,
      is_preferred, notes
    ) values (
      target_workspace_id, offer_record.supplier_id, new_product_id, null, selected_offer_id,
      offer_record.supplier_product_url, offer_record.supplier_sku, offer_record.currency, offer_record.unit_price,
      offer_record.shipping_cost, offer_record.customs_cost,
      offer_record.platform_or_payment_fees, offer_record.sample_price,
      offer_record.minimum_order_quantity, offer_record.lead_time_days,
      offer_record.available_stock, offer_record.rating,
      offer_record.last_checked_at, true, offer_record.notes
    ) returning id into new_offer_id;

    update public.products
    set preferred_supplier_offer_id = new_offer_id
    where id = new_product_id;
  end if;

  update public.opportunities
  set status = 'converted', updated_at = now()
  where id = target_opportunity_id and workspace_id = target_workspace_id;

  return new_product_id;
end;
$$;

grant execute on function public.convert_opportunity_to_product(
  uuid, uuid, uuid, text, text, text, text, public.product_status,
  numeric, numeric, numeric, numeric, numeric, integer, char, text, boolean
) to authenticated;
