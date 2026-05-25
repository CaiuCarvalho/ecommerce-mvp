-- Adiciona colunas faltantes na tabela addresses existente
-- (is_favorite e label) para suportar favoritos e identificação

-- Coluna label (Casa, Trabalho, etc.)
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS label text DEFAULT 'Casa';

-- Coluna is_favorite
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

-- Índice para busca rápida por user_id (caso não exista)
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- Trigger para garantir apenas 1 favorito por usuário
CREATE OR REPLACE FUNCTION public.ensure_single_favorite_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.is_favorite = true THEN
    UPDATE public.addresses
    SET is_favorite = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_favorite = true;
  END IF;
  -- Se é o primeiro endereço, forçar como favorito
  IF NOT EXISTS (
    SELECT 1 FROM public.addresses
    WHERE user_id = NEW.user_id AND id != NEW.id
  ) THEN
    NEW.is_favorite := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_single_favorite ON public.addresses;
CREATE TRIGGER trg_ensure_single_favorite
  BEFORE INSERT OR UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_favorite_address();
