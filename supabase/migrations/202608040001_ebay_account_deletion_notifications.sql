begin;

create table public.ebay_account_deletion_notifications (
  notification_id_hash text primary key check (notification_id_hash ~ '^[a-f0-9]{64}$'),
  topic text not null check (topic = 'MARKETPLACE_ACCOUNT_DELETION'),
  status text not null default 'received' check (status in ('received', 'acknowledged-not-linked')),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

comment on table public.ebay_account_deletion_notifications is
  'Idempotency ledger only. Contains no eBay userId, username, eiasToken, credentials, or raw notification payload.';

alter table public.ebay_account_deletion_notifications enable row level security;

revoke all on table public.ebay_account_deletion_notifications from anon, authenticated;

create or replace function public.claim_ebay_account_deletion_notification(
  p_notification_id_hash text,
  p_topic text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count bigint;
begin
  if p_notification_id_hash !~ '^[a-f0-9]{64}$' or p_topic <> 'MARKETPLACE_ACCOUNT_DELETION' then
    raise exception 'Invalid eBay account deletion idempotency input';
  end if;

  insert into public.ebay_account_deletion_notifications (notification_id_hash, topic)
  values (p_notification_id_hash, p_topic)
  on conflict (notification_id_hash) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;

create or replace function public.complete_ebay_account_deletion_notification(
  p_notification_id_hash text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_notification_id_hash !~ '^[a-f0-9]{64}$' or p_status <> 'acknowledged-not-linked' then
    raise exception 'Invalid eBay account deletion completion input';
  end if;

  update public.ebay_account_deletion_notifications
  set status = p_status, processed_at = now()
  where notification_id_hash = p_notification_id_hash;
end;
$$;

revoke all on function public.claim_ebay_account_deletion_notification(text, text) from public;
revoke all on function public.complete_ebay_account_deletion_notification(text, text) from public;
grant execute on function public.claim_ebay_account_deletion_notification(text, text) to anon;
grant execute on function public.complete_ebay_account_deletion_notification(text, text) to anon;

commit;
