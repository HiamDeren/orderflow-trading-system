-- 20261117172723 · revoke_rls_auto_enable_execute
-- public.rls_auto_enable() là hàm event trigger Supabase tự tạo trên project cloud (SECURITY DEFINER).
-- Thu quyền gọi qua /rpc của anon / authenticated. Local (supabase start) có thể không có hàm này nên kiểm trước.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
