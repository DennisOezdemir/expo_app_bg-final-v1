-- Change-Order RPCs härten: approve/reject nur service_role, submit für authenticated
REVOKE EXECUTE ON FUNCTION public.approve_change_order(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_change_order(uuid, text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_change_order(uuid) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.approve_change_order(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_change_order(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_change_order(uuid) TO service_role, authenticated;
