begin;

create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'admin', 'member');
create type public.opportunity_status as enum ('draft', 'qualified', 'rejected', 'converted');
create type public.supplier_status as enum ('prospect', 'active', 'paused', 'archived');
create type public.product_status as enum ('draft', 'ready', 'active', 'archived');
create type public.connection_status as enum ('not_connected', 'connection_required', 'connected', 'error');
create type public.listing_status as enum ('draft', 'ready', 'publishing', 'published', 'paused', 'error');
create type public.order_status as enum ('pending', 'paid', 'processing', 'shipped', 'cancelled', 'refunded');
create type public.sync_job_status as enum ('queued', 'running', 'completed', 'failed');
create type public.sync_job_type as enum (
  'listings_import',
  'listing_publish',
  'orders_import',
  'inventory_update',
  'price_update'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  category text,
  source_url text,
  estimated_purchase_price numeric(12,2) check (estimated_purchase_price >= 0),
  estimated_shipping_cost numeric(12,2) check (estimated_shipping_cost >= 0),
  estimated_platform_fees numeric(12,2) check (estimated_platform_fees >= 0),
  recommended_sale_price numeric(12,2) check (recommended_sale_price >= 0),
  estimated_margin numeric(7,2),
  score smallint check (score between 0 and 100),
  status public.opportunity_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  website_url text,
  country text,
  contact_email text,
  minimum_order_quantity integer check (minimum_order_quantity >= 0),
  average_lead_time_days integer check (average_lead_time_days >= 0),
  reliability_score smallint check (reliability_score between 0 and 100),
  return_policy text,
  status public.supplier_status not null default 'prospect',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  name text not null,
  sku text not null,
  category text,
  description text,
  status public.product_status not null default 'draft',
  purchase_price numeric(12,2) not null default 0 check (purchase_price >= 0),
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, sku)
);

create table public.supplier_offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_product_url text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  minimum_order_quantity integer not null default 1 check (minimum_order_quantity > 0),
  lead_time_days integer check (lead_time_days >= 0),
  is_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sales_channels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table public.channel_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sales_channel_id uuid not null references public.sales_channels(id) on delete restrict,
  external_account_id text,
  external_account_name text,
  status public.connection_status not null default 'not_connected',
  credentials_reference text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, sales_channel_id, external_account_id)
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  channel_connection_id uuid not null references public.channel_connections(id) on delete cascade,
  external_listing_id text,
  title text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  status public.listing_status not null default 'draft',
  published_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_connection_id, external_listing_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_connection_id uuid references public.channel_connections(id) on delete set null,
  external_order_id text,
  status public.order_status not null default 'pending',
  currency char(3) not null default 'EUR',
  subtotal numeric(12,2) not null default 0,
  platform_fees numeric(12,2) not null default 0,
  shipping_revenue numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_connection_id, external_order_id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  external_product_id text,
  title text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_connection_id uuid not null references public.channel_connections(id) on delete cascade,
  type public.sync_job_type not null,
  status public.sync_job_status not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  items_processed integer not null default 0 check (items_processed >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  created_at timestamptz not null default now()
);

create table public.sync_errors (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid not null references public.sync_jobs(id) on delete cascade,
  code text not null,
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index opportunities_workspace_id_idx on public.opportunities(workspace_id);
create index opportunities_status_idx on public.opportunities(workspace_id, status);
create index suppliers_workspace_id_idx on public.suppliers(workspace_id);
create index products_workspace_id_idx on public.products(workspace_id);
create index products_opportunity_id_idx on public.products(opportunity_id);
create index supplier_offers_workspace_id_idx on public.supplier_offers(workspace_id);
create index supplier_offers_supplier_id_idx on public.supplier_offers(supplier_id);
create index supplier_offers_product_id_idx on public.supplier_offers(product_id);
create index channel_connections_workspace_id_idx on public.channel_connections(workspace_id);
create index listings_workspace_id_idx on public.listings(workspace_id);
create index listings_product_id_idx on public.listings(product_id);
create index listings_status_idx on public.listings(workspace_id, status);
create index orders_workspace_id_idx on public.orders(workspace_id);
create index orders_placed_at_idx on public.orders(workspace_id, placed_at desc);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);
create index sync_jobs_workspace_id_idx on public.sync_jobs(workspace_id);
create index sync_jobs_connection_id_idx on public.sync_jobs(channel_connection_id);
create index sync_errors_job_id_idx on public.sync_errors(sync_job_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger workspaces_set_updated_at before update on public.workspaces
for each row execute function public.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities
for each row execute function public.set_updated_at();
create trigger suppliers_set_updated_at before update on public.suppliers
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger supplier_offers_set_updated_at before update on public.supplier_offers
for each row execute function public.set_updated_at();
create trigger channel_connections_set_updated_at before update on public.channel_connections
for each row execute function public.set_updated_at();
create trigger listings_set_updated_at before update on public.listings
for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.can_manage_workspace(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.can_manage_workspace(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid := gen_random_uuid();
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  );

  insert into public.workspaces (id, name, slug, owner_id)
  values (
    new_workspace_id,
    'ELROVA Store',
    'elrova-store-' || left(replace(new.id::text, '-', ''), 12),
    new.id
  );

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.sales_channels (code, name)
values
  ('shopify', 'Shopify'),
  ('amazon', 'Amazon'),
  ('ebay', 'eBay'),
  ('etsy', 'Etsy'),
  ('woocommerce', 'WooCommerce')
on conflict (code) do update set name = excluded.name;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.opportunities enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.supplier_offers enable row level security;
alter table public.sales_channels enable row level security;
alter table public.channel_connections enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.sync_errors enable row level security;

create policy "Users can read their profile" on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy "Users can update their profile" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Members can read workspaces" on public.workspaces
for select to authenticated using (public.is_workspace_member(id));
create policy "Users can create owned workspaces" on public.workspaces
for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Admins can update workspaces" on public.workspaces
for update to authenticated using (public.can_manage_workspace(id))
with check (public.can_manage_workspace(id));
create policy "Owners can delete workspaces" on public.workspaces
for delete to authenticated using (owner_id = (select auth.uid()));

create policy "Members can read memberships" on public.workspace_members
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins can add memberships" on public.workspace_members
for insert to authenticated with check (public.can_manage_workspace(workspace_id));
create policy "Admins can update memberships" on public.workspace_members
for update to authenticated using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
create policy "Admins can delete memberships" on public.workspace_members
for delete to authenticated using (
  public.can_manage_workspace(workspace_id)
  and not (user_id = (select auth.uid()) and role = 'owner')
);

create policy "Authenticated users can read channels" on public.sales_channels
for select to authenticated using (true);

create policy "Members can read opportunities" on public.opportunities
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins can create opportunities" on public.opportunities
for insert to authenticated with check (public.can_manage_workspace(workspace_id));
create policy "Admins can update opportunities" on public.opportunities
for update to authenticated using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
create policy "Admins can delete opportunities" on public.opportunities
for delete to authenticated using (public.can_manage_workspace(workspace_id));

create policy "Members can read suppliers" on public.suppliers
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins can create suppliers" on public.suppliers
for insert to authenticated with check (public.can_manage_workspace(workspace_id));
create policy "Admins can update suppliers" on public.suppliers
for update to authenticated using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
create policy "Admins can delete suppliers" on public.suppliers
for delete to authenticated using (public.can_manage_workspace(workspace_id));

create policy "Members can read products" on public.products
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins can create products" on public.products
for insert to authenticated with check (public.can_manage_workspace(workspace_id));
create policy "Admins can update products" on public.products
for update to authenticated using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
create policy "Admins can delete products" on public.products
for delete to authenticated using (public.can_manage_workspace(workspace_id));

create policy "Members can read supplier offers" on public.supplier_offers
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins can create supplier offers" on public.supplier_offers
for insert to authenticated with check (public.can_manage_workspace(workspace_id));
create policy "Admins can update supplier offers" on public.supplier_offers
for update to authenticated using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
create policy "Admins can delete supplier offers" on public.supplier_offers
for delete to authenticated using (public.can_manage_workspace(workspace_id));

create policy "Members can read channel connections" on public.channel_connections
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins can create channel connections" on public.channel_connections
for insert to authenticated with check (public.can_manage_workspace(workspace_id));
create policy "Admins can update channel connections" on public.channel_connections
for update to authenticated using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
create policy "Admins can delete channel connections" on public.channel_connections
for delete to authenticated using (public.can_manage_workspace(workspace_id));

create policy "Members can read listings" on public.listings
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins can create listings" on public.listings
for insert to authenticated with check (public.can_manage_workspace(workspace_id));
create policy "Admins can update listings" on public.listings
for update to authenticated using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
create policy "Admins can delete listings" on public.listings
for delete to authenticated using (public.can_manage_workspace(workspace_id));

create policy "Members can read orders" on public.orders
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins can create orders" on public.orders
for insert to authenticated with check (public.can_manage_workspace(workspace_id));
create policy "Admins can update orders" on public.orders
for update to authenticated using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
create policy "Admins can delete orders" on public.orders
for delete to authenticated using (public.can_manage_workspace(workspace_id));

create policy "Members can read order items" on public.order_items
for select to authenticated using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and public.is_workspace_member(orders.workspace_id)
  )
);
create policy "Admins can create order items" on public.order_items
for insert to authenticated with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and public.can_manage_workspace(orders.workspace_id)
  )
);
create policy "Admins can update order items" on public.order_items
for update to authenticated using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and public.can_manage_workspace(orders.workspace_id)
  )
) with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and public.can_manage_workspace(orders.workspace_id)
  )
);
create policy "Admins can delete order items" on public.order_items
for delete to authenticated using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and public.can_manage_workspace(orders.workspace_id)
  )
);

create policy "Members can read sync jobs" on public.sync_jobs
for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins can create sync jobs" on public.sync_jobs
for insert to authenticated with check (public.can_manage_workspace(workspace_id));
create policy "Admins can update sync jobs" on public.sync_jobs
for update to authenticated using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));
create policy "Admins can delete sync jobs" on public.sync_jobs
for delete to authenticated using (public.can_manage_workspace(workspace_id));

create policy "Members can read sync errors" on public.sync_errors
for select to authenticated using (
  exists (
    select 1 from public.sync_jobs
    where sync_jobs.id = sync_errors.sync_job_id
      and public.is_workspace_member(sync_jobs.workspace_id)
  )
);
create policy "Admins can create sync errors" on public.sync_errors
for insert to authenticated with check (
  exists (
    select 1 from public.sync_jobs
    where sync_jobs.id = sync_errors.sync_job_id
      and public.can_manage_workspace(sync_jobs.workspace_id)
  )
);
create policy "Admins can update sync errors" on public.sync_errors
for update to authenticated using (
  exists (
    select 1 from public.sync_jobs
    where sync_jobs.id = sync_errors.sync_job_id
      and public.can_manage_workspace(sync_jobs.workspace_id)
  )
) with check (
  exists (
    select 1 from public.sync_jobs
    where sync_jobs.id = sync_errors.sync_job_id
      and public.can_manage_workspace(sync_jobs.workspace_id)
  )
);
create policy "Admins can delete sync errors" on public.sync_errors
for delete to authenticated using (
  exists (
    select 1 from public.sync_jobs
    where sync_jobs.id = sync_errors.sync_job_id
      and public.can_manage_workspace(sync_jobs.workspace_id)
  )
);

commit;
