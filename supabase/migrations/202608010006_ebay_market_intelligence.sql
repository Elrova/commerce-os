begin;

create table public.marketplace_research_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  supplier_catalog_product_id uuid not null references public.supplier_catalog_products(id) on delete cascade,
  marketplace text not null check (marketplace = 'ebay'),
  environment text not null check (environment in ('sandbox', 'production')),
  query text not null,
  search_strategy text not null check (search_strategy in ('gtin', 'brand_reference', 'title')),
  status text not null check (status in ('running', 'completed', 'failed', 'access_pending')),
  normalized_results jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  error_code text,
  expires_at timestamptz not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.marketplace_listing_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  research_run_id uuid not null references public.marketplace_research_runs(id) on delete cascade,
  supplier_catalog_product_id uuid not null references public.supplier_catalog_products(id) on delete cascade,
  marketplace text not null check (marketplace = 'ebay'),
  environment text not null check (environment in ('sandbox', 'production')),
  external_id text not null,
  normalized_listing jsonb not null,
  match_score smallint not null check (match_score between 0 and 100),
  match_level text not null check (match_level in ('exact', 'strong', 'possible', 'weak')),
  reasons jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  retrieved_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (research_run_id, external_id)
);

create index marketplace_research_cache_idx on public.marketplace_research_runs(workspace_id, supplier_catalog_product_id, marketplace, environment, query, expires_at desc);
create index marketplace_listing_run_idx on public.marketplace_listing_snapshots(research_run_id, match_score desc);

create or replace function public.validate_marketplace_research_workspace()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.supplier_catalog_products where id = new.supplier_catalog_product_id and workspace_id = new.workspace_id) then
    raise exception 'Marketplace research product workspace mismatch';
  end if;
  return new;
end;
$$;

create or replace function public.validate_marketplace_listing_workspace()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.marketplace_research_runs
    where id = new.research_run_id
      and workspace_id = new.workspace_id
      and supplier_catalog_product_id = new.supplier_catalog_product_id
      and marketplace = new.marketplace
      and environment = new.environment
  ) then
    raise exception 'Marketplace listing research workspace mismatch';
  end if;
  return new;
end;
$$;

create trigger marketplace_research_validate before insert or update on public.marketplace_research_runs for each row execute function public.validate_marketplace_research_workspace();
create trigger marketplace_listing_validate before insert or update on public.marketplace_listing_snapshots for each row execute function public.validate_marketplace_listing_workspace();

alter table public.marketplace_research_runs enable row level security;
alter table public.marketplace_listing_snapshots enable row level security;
create policy "Members read marketplace research" on public.marketplace_research_runs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins manage marketplace research" on public.marketplace_research_runs for all to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));
create policy "Members read marketplace snapshots" on public.marketplace_listing_snapshots for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins manage marketplace snapshots" on public.marketplace_listing_snapshots for all to authenticated using (public.can_manage_workspace(workspace_id)) with check (public.can_manage_workspace(workspace_id));

commit;
