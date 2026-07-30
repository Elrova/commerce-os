begin;

drop trigger if exists supplier_integrations_validate
  on public.supplier_integrations;
drop trigger if exists supplier_catalog_products_validate
  on public.supplier_catalog_products;
drop trigger if exists supplier_sync_runs_validate
  on public.supplier_sync_runs;
drop trigger if exists supplier_product_matches_validate
  on public.supplier_product_matches;

create or replace function public.validate_supplier_integrations_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.suppliers
    where id = new.supplier_id
      and workspace_id = new.workspace_id
  ) then
    raise exception 'Supplier integration workspace mismatch';
  end if;

  return new;
end;
$$;

create or replace function public.validate_supplier_catalog_products_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.supplier_integrations
    where id = new.integration_id
      and supplier_id = new.supplier_id
      and workspace_id = new.workspace_id
  ) then
    raise exception 'Catalog integration workspace mismatch';
  end if;

  return new;
end;
$$;

create or replace function public.validate_supplier_sync_runs_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.supplier_integrations
    where id = new.integration_id
      and workspace_id = new.workspace_id
  ) then
    raise exception 'Sync integration workspace mismatch';
  end if;

  return new;
end;
$$;

create or replace function public.validate_supplier_product_matches_workspace()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.supplier_catalog_products
    where id = new.supplier_catalog_product_id
      and workspace_id = new.workspace_id
  ) then
    raise exception 'Catalog match workspace mismatch';
  end if;

  if new.opportunity_id is not null and not exists (
    select 1
    from public.opportunities
    where id = new.opportunity_id
      and workspace_id = new.workspace_id
  ) then
    raise exception 'Opportunity match workspace mismatch';
  end if;

  if new.product_id is not null and not exists (
    select 1
    from public.products
    where id = new.product_id
      and workspace_id = new.workspace_id
  ) then
    raise exception 'Product match workspace mismatch';
  end if;

  return new;
end;
$$;

create trigger supplier_integrations_validate
before insert or update on public.supplier_integrations
for each row execute function public.validate_supplier_integrations_workspace();

create trigger supplier_catalog_products_validate
before insert or update on public.supplier_catalog_products
for each row execute function public.validate_supplier_catalog_products_workspace();

create trigger supplier_sync_runs_validate
before insert or update on public.supplier_sync_runs
for each row execute function public.validate_supplier_sync_runs_workspace();

create trigger supplier_product_matches_validate
before insert or update on public.supplier_product_matches
for each row execute function public.validate_supplier_product_matches_workspace();

drop function if exists public.validate_supplier_intelligence_workspace();

commit;
