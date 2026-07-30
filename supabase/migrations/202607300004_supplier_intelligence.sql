begin;

create type public.supplier_integration_environment as enum ('mock', 'sandbox', 'production', 'disabled');
create type public.supplier_integration_status as enum ('not_configured', 'ready', 'syncing', 'error', 'disabled');
create type public.supplier_sync_status as enum ('running', 'completed', 'partial', 'failed', 'dry_run');

create table public.supplier_integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  connector_code text not null,
  environment public.supplier_integration_environment not null,
  status public.supplier_integration_status not null default 'not_configured',
  credentials_reference text,
  capabilities jsonb not null default '{}'::jsonb,
  configuration jsonb not null default '{}'::jsonb,
  last_connection_test_at timestamptz,
  last_successful_sync_at timestamptz,
  last_error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, connector_code)
);

create table public.supplier_catalog_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  integration_id uuid not null references public.supplier_integrations(id) on delete cascade,
  external_id text not null, sku text not null, ean text, gtin text, brand text,
  manufacturer text, title text not null, description text, category text,
  images jsonb not null default '[]'::jsonb, attributes jsonb not null default '{}'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  purchase_price_ex_vat numeric(12,2) not null check (purchase_price_ex_vat >= 0),
  purchase_price_inc_vat numeric(12,2) check (purchase_price_inc_vat >= 0),
  recommended_retail_price numeric(12,2) check (recommended_retail_price >= 0),
  shipping_cost numeric(12,2) check (shipping_cost >= 0), currency char(3) not null,
  stock integer not null default 0 check (stock >= 0), stock_status text not null,
  moq integer not null default 1 check (moq > 0), weight numeric(10,3),
  dimensions jsonb, shipping_countries jsonb not null default '[]'::jsonb,
  ships_from_country char(2), delivery_min_days integer, delivery_max_days integer,
  product_url text, raw_data jsonb not null default '{}'::jsonb,
  active boolean not null default true, last_synced_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (integration_id, external_id)
);

create table public.supplier_sync_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  integration_id uuid not null references public.supplier_integrations(id) on delete cascade,
  sync_type text not null, status public.supplier_sync_status not null default 'running',
  started_at timestamptz not null default now(), finished_at timestamptz,
  products_read integer not null default 0, products_created integer not null default 0,
  products_updated integer not null default 0, products_failed integer not null default 0,
  error_summary jsonb not null default '[]'::jsonb, metadata jsonb not null default '{}'::jsonb
);

create table public.supplier_product_matches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  supplier_catalog_product_id uuid not null references public.supplier_catalog_products(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  amazon_asin text, ebay_listing_id text, ean text, gtin text,
  match_status text not null default 'unreviewed',
  confidence numeric(5,2) check (confidence between 0 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workspace_id, supplier_catalog_product_id)
);

create index supplier_integrations_workspace_idx on public.supplier_integrations(workspace_id);
create index supplier_catalog_search_idx on public.supplier_catalog_products(workspace_id, active, category);
create index supplier_catalog_supplier_idx on public.supplier_catalog_products(supplier_id);
create index supplier_catalog_ean_idx on public.supplier_catalog_products(workspace_id, ean);
create index supplier_sync_runs_integration_idx on public.supplier_sync_runs(integration_id, started_at desc);
create index supplier_product_matches_product_idx on public.supplier_product_matches(product_id);

create trigger supplier_integrations_set_updated_at before update on public.supplier_integrations for each row execute function public.set_updated_at();
create trigger supplier_catalog_products_set_updated_at before update on public.supplier_catalog_products for each row execute function public.set_updated_at();
create trigger supplier_product_matches_set_updated_at before update on public.supplier_product_matches for each row execute function public.set_updated_at();

create or replace function public.validate_supplier_intelligence_workspace()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'supplier_integrations' and not exists (
    select 1 from public.suppliers where id = new.supplier_id and workspace_id = new.workspace_id
  ) then raise exception 'Supplier integration workspace mismatch'; end if;
  if tg_table_name = 'supplier_catalog_products' and not exists (
    select 1 from public.supplier_integrations where id = new.integration_id and supplier_id = new.supplier_id and workspace_id = new.workspace_id
  ) then raise exception 'Catalog integration workspace mismatch'; end if;
  if tg_table_name = 'supplier_sync_runs' and not exists (
    select 1 from public.supplier_integrations where id = new.integration_id and workspace_id = new.workspace_id
  ) then raise exception 'Sync integration workspace mismatch'; end if;
  if tg_table_name = 'supplier_product_matches' then
    if not exists (select 1 from public.supplier_catalog_products where id = new.supplier_catalog_product_id and workspace_id = new.workspace_id) then raise exception 'Catalog match workspace mismatch'; end if;
    if new.opportunity_id is not null and not exists (select 1 from public.opportunities where id = new.opportunity_id and workspace_id = new.workspace_id) then raise exception 'Opportunity match workspace mismatch'; end if;
    if new.product_id is not null and not exists (select 1 from public.products where id = new.product_id and workspace_id = new.workspace_id) then raise exception 'Product match workspace mismatch'; end if;
  end if;
  return new;
end; $$;

create trigger supplier_integrations_validate before insert or update on public.supplier_integrations for each row execute function public.validate_supplier_intelligence_workspace();
create trigger supplier_catalog_products_validate before insert or update on public.supplier_catalog_products for each row execute function public.validate_supplier_intelligence_workspace();
create trigger supplier_sync_runs_validate before insert or update on public.supplier_sync_runs for each row execute function public.validate_supplier_intelligence_workspace();
create trigger supplier_product_matches_validate before insert or update on public.supplier_product_matches for each row execute function public.validate_supplier_intelligence_workspace();

alter table public.supplier_integrations enable row level security;
alter table public.supplier_catalog_products enable row level security;
alter table public.supplier_sync_runs enable row level security;
alter table public.supplier_product_matches enable row level security;

create policy "Members read supplier integrations" on public.supplier_integrations for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins manage supplier integrations" on public.supplier_integrations for all to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));
create policy "Members read supplier catalog" on public.supplier_catalog_products for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins manage supplier catalog" on public.supplier_catalog_products for all to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));
create policy "Members read supplier sync runs" on public.supplier_sync_runs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins manage supplier sync runs" on public.supplier_sync_runs for all to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));
create policy "Members read supplier matches" on public.supplier_product_matches for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins manage supplier matches" on public.supplier_product_matches for all to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));

commit;
