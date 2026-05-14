-- =======================================================
-- MIGRAÇÃO DE PERFORMANCE: ÍNDICES PRINCIPAIS
-- =======================================================
-- Previne queries lentas conforme o volume de pedidos cresce.
-- IF NOT EXISTS garante idempotência (pode rodar mais de uma vez).
-- =======================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON public.orders (user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_products_is_active
  ON public.products (is_active);

CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products (category_id);
