drop function public.update_enrm_order(uuid, text, text, text, text);
alter table public.orders
  drop constraint orders_payment_status_check,
  drop column payment_status;

create or replace function public.update_enrm_order(
  p_order_id uuid,
  p_status text,
  p_tracking_number text,
  p_internal_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous_status text;
begin
  if not public.is_enrm_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;
  if p_status not in ('À confirmer', 'À préparer', 'En préparation', 'Expédiée', 'Livrée', 'Annulée')
     or length(coalesce(p_tracking_number, '')) > 70
     or length(coalesce(p_internal_note, '')) > 1000 then
    raise exception 'Les informations de commande sont invalides.' using errcode = '22023';
  end if;

  select status into v_previous_status
    from public.orders
   where id = p_order_id
   for update;
  if not found then
    raise exception 'Commande introuvable.' using errcode = 'P0002';
  end if;
  if v_previous_status = 'Annulée' and p_status <> 'Annulée' then
    raise exception 'Une commande annulée ne peut pas être réactivée.' using errcode = '22023';
  end if;

  if p_status = 'Annulée' and v_previous_status <> 'Annulée' then
    update public.product_inventory as inventory
       set quantity = inventory.quantity + item.quantity
      from public.order_items as item
     where item.order_id = p_order_id
       and inventory.product_id = item.product_id;
  end if;

  update public.orders
     set status = p_status,
         tracking_number = trim(coalesce(p_tracking_number, '')),
         internal_note = trim(coalesce(p_internal_note, ''))
   where id = p_order_id;
end;
$$;
revoke all on function public.update_enrm_order(uuid, text, text, text) from public;
grant execute on function public.update_enrm_order(uuid, text, text, text) to authenticated;
