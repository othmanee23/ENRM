revoke all on function public.save_enrm_product_with_stock(text, jsonb, integer) from public, anon;
grant execute on function public.save_enrm_product_with_stock(text, jsonb, integer) to authenticated;

-- Publish the corrected privilege state to PostgREST immediately.
notify pgrst, 'reload schema';
