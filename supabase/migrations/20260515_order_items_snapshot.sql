-- =======================================================
-- MIGRAÇÃO: GARANTIR SNAPSHOT HISTÓRICO EM ORDER_ITEMS
-- =======================================================
-- O campo product_name já é inserido pela Edge Function create-checkout.
-- Esta migration garante que a coluna exista e não seja nula
-- para registros novos, preservando o histórico mesmo se o
-- produto for editado ou excluído do catálogo.
-- =======================================================

-- Adiciona a coluna product_name caso ainda não exista
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Preenche registros antigos que possam estar nulos com dado do produto
-- (best-effort: se o produto ainda existir no catálogo)
UPDATE public.order_items oi
SET product_name = p.name
FROM public.products p
WHERE oi.product_id = p.id
  AND oi.product_name IS NULL;
