-- Corrige o trigger handle_new_user para usar schema explícito.
-- O GoTrue conecta como supabase_auth_admin com search_path=auth,
-- então "profiles" sem prefixo falha. Solução: qualificar com public.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
