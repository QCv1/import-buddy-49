DROP POLICY IF EXISTS "sellers public read" ON public.sellers;
REVOKE SELECT ON public.sellers FROM anon, authenticated;
GRANT ALL ON public.sellers TO service_role;

CREATE OR REPLACE VIEW public.sellers_public
WITH (security_invoker = true) AS
SELECT id, name, slug, logo_url, banner_url, description, active, external_url, link_mode, created_at
FROM public.sellers;

GRANT SELECT ON public.sellers_public TO anon, authenticated;