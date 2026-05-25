-- Proteção contra escalação de privilégios na tabela profiles
-- Impede que usuários comuns alterem sua própria coluna 'role'

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se a requisição vier da API pública (usuário logado)
  IF auth.uid() IS NOT NULL THEN
    -- Mantém a role original, ignorando qualquer tentativa de alteração
    NEW.role = OLD.role;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();
