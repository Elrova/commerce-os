begin;

alter table public.supplier_offers
  alter column product_id drop not null,
  add column opportunity_id uuid references public.opportunities(id) on delete cascade,
  add column supplier_sku text,
  add column currency char(3) not null default 'EUR',
  add column customs_cost numeric(12,2) not null default 0 check (customs_cost >= 0),
  add column platform_or_payment_fees numeric(12,2) not null default 0 check (platform_or_payment_fees >= 0),
  add column sample_price numeric(12,2) check (sample_price >= 0),
  add column available_stock integer check (available_stock >= 0),
  add column rating numeric(3,2) check (rating between 0 and 5),
  add column last_checked_at timestamptz not null default now(),
  add column notes text;

alter table public.supplier_offers
  add constraint supplier_offers_exactly_one_target_check
  check (num_nonnulls(opportunity_id, product_id) = 1);

create index supplier_offers_opportunity_id_idx
  on public.supplier_offers(opportunity_id)
  where opportunity_id is not null;

create index supplier_offers_product_id_target_idx
  on public.supplier_offers(product_id)
  where product_id is not null;

create index supplier_offers_workspace_supplier_idx
  on public.supplier_offers(workspace_id, supplier_id);

create index supplier_offers_last_checked_idx
  on public.supplier_offers(workspace_id, last_checked_at desc);

create unique index supplier_offers_one_preferred_per_opportunity_idx
  on public.supplier_offers(opportunity_id)
  where is_preferred and opportunity_id is not null;

create unique index supplier_offers_one_preferred_per_product_idx
  on public.supplier_offers(product_id)
  where is_preferred and product_id is not null;

create or replace function public.validate_supplier_offer_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.suppliers
    where id = new.supplier_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Supplier does not belong to the offer workspace';
  end if;

  if new.opportunity_id is not null and not exists (
    select 1 from public.opportunities
    where id = new.opportunity_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Opportunity does not belong to the offer workspace';
  end if;

  if new.product_id is not null and not exists (
    select 1 from public.products
    where id = new.product_id and workspace_id = new.workspace_id
  ) then
    raise exception 'Product does not belong to the offer workspace';
  end if;

  return new;
end;
$$;

create trigger supplier_offers_validate_workspace
before insert or update on public.supplier_offers
for each row execute function public.validate_supplier_offer_workspace();

create or replace function public.set_preferred_supplier_offer(
  target_offer_id uuid,
  target_workspace_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_opportunity_id uuid;
begin
  if not public.can_manage_workspace(target_workspace_id) then
    raise exception 'Not authorized to manage this workspace';
  end if;

  select opportunity_id
  into target_opportunity_id
  from public.supplier_offers
  where id = target_offer_id
    and workspace_id = target_workspace_id
  for update;

  if target_opportunity_id is null then
    raise exception 'Offer does not exist or is not linked to an opportunity';
  end if;

  update public.supplier_offers
  set is_preferred = false
  where workspace_id = target_workspace_id
    and opportunity_id = target_opportunity_id
    and is_preferred;

  update public.supplier_offers
  set is_preferred = true
  where id = target_offer_id
    and workspace_id = target_workspace_id
    and opportunity_id = target_opportunity_id;
end;
$$;

revoke all on function public.set_preferred_supplier_offer(uuid, uuid) from public;
grant execute on function public.set_preferred_supplier_offer(uuid, uuid) to authenticated;

commit;
