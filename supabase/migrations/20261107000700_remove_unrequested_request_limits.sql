drop function public.place_enrm_order(text, text, text, text, jsonb, uuid, text);
alter function public.place_enrm_order_internal(text, text, text, text, jsonb, uuid)
  rename to place_enrm_order;
grant execute on function public.place_enrm_order(text, text, text, text, jsonb, uuid)
  to anon, authenticated;
drop table public.order_request_limits;
