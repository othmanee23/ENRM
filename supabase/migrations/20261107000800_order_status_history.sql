create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_timeline on public.order_status_history (order_id, created_at, id);
alter table public.order_status_history enable row level security;
revoke all on public.order_status_history from public, anon, authenticated;
grant select on public.order_status_history to authenticated;
create policy "ENRM admins read order status history" on public.order_status_history
  for select to authenticated using (public.is_enrm_admin());

create or replace function public.record_enrm_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (
      order_id, previous_status, status, changed_by
    ) values (
      new.id,
      null,
      new.status,
      auth.uid()
    );
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (
      order_id, previous_status, status, changed_by
    ) values (
      new.id,
      old.status,
      new.status,
      auth.uid()
    );
  end if;
  return new;
end;
$$;
revoke all on function public.record_enrm_order_status() from public, anon, authenticated;

create trigger orders_record_status_insert
after insert on public.orders
for each row execute procedure public.record_enrm_order_status();
create trigger orders_record_status_update
after update of status on public.orders
for each row execute procedure public.record_enrm_order_status();
