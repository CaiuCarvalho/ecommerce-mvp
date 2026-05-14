-- =======================================================
-- RESTRIÇÃO DE UNICIDADE: APENAS TELEFONE
-- =======================================================
-- Removido a unicidade de nome (nomes podem se repetir).
-- Mantido apenas telefone como único para evitar contas duplicadas.
-- O e-mail já é único por padrão no Supabase Auth.
-- =======================================================

-- Garante que Telefone seja único na tabela de perfis
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
