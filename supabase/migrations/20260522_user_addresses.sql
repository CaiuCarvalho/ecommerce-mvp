-- Tabela de endereços do usuário com suporte a favorito
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text DEFAULT 'Casa',
  cep text NOT NULL,
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL CHECK (char_length(state) = 2),
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

-- Garantir apenas 1 favorito por usuário via trigger
CREATE OR REPLACE FUNCTION public.ensure_single_favorite_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.is_favorite = true THEN
    UPDATE public.user_addresses
    SET is_favorite = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_favorite = true;
  END IF;
  -- Se é o primeiro endereço, forçar como favorito
  IF NOT EXISTS (
    SELECT 1 FROM public.user_addresses
    WHERE user_id = NEW.user_id AND id != NEW.id
  ) THEN
    NEW.is_favorite := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_single_favorite ON public.user_addresses;
CREATE TRIGGER trg_ensure_single_favorite
  BEFORE INSERT OR UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_favorite_address();

-- RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_addresses: select own" ON public.user_addresses;
CREATE POLICY "user_addresses: select own"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_addresses: insert own" ON public.user_addresses;
CREATE POLICY "user_addresses: insert own"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_addresses: update own" ON public.user_addresses;
CREATE POLICY "user_addresses: update own"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_addresses: delete own" ON public.user_addresses;
CREATE POLICY "user_addresses: delete own"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);
