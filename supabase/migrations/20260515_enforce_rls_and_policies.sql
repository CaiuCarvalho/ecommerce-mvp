-- =======================================================
-- MIGRAÇÃO DE SEGURANÇA: RLS + POLÍTICAS DE ACESSO
-- =======================================================
-- Garante que cada tabela tenha RLS ativo e que cada
-- usuário só consiga acessar seus próprios dados.
-- Admins (role = 'admin') têm acesso completo às tabelas de catálogo.
-- Todas as escritas em orders/order_items são feitas SOMENTE
-- pelo backend (service_role), nunca pelo frontend.
-- =======================================================

-- -------------------------------------------------------
-- TABELA: profiles
-- -------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário vê e edita apenas o próprio perfil
DROP POLICY IF EXISTS "profiles: select proprio" ON public.profiles;
CREATE POLICY "profiles: select proprio"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: update proprio" ON public.profiles;
CREATE POLICY "profiles: update proprio"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------
-- TABELA: addresses
-- -------------------------------------------------------
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses: select proprio" ON public.addresses;
CREATE POLICY "addresses: select proprio"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses: insert proprio" ON public.addresses;
CREATE POLICY "addresses: insert proprio"
  ON public.addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses: update proprio" ON public.addresses;
CREATE POLICY "addresses: update proprio"
  ON public.addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses: delete proprio" ON public.addresses;
CREATE POLICY "addresses: delete proprio"
  ON public.addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- TABELA: orders
-- Escrita SOMENTE pelo service_role (Edge Functions).
-- Clientes só leem os próprios pedidos.
-- -------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders: select proprio" ON public.orders;
CREATE POLICY "orders: select proprio"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins podem ver todos os pedidos
DROP POLICY IF EXISTS "orders: select admin" ON public.orders;
CREATE POLICY "orders: select admin"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -------------------------------------------------------
-- TABELA: order_items
-- Usuário só vê itens de SEUS PRÓPRIOS pedidos.
-- A subquery previne acesso cruzado por order_id direto.
-- -------------------------------------------------------
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items: select proprio" ON public.order_items;
CREATE POLICY "order_items: select proprio"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Admins podem ver todos os itens
DROP POLICY IF EXISTS "order_items: select admin" ON public.order_items;
CREATE POLICY "order_items: select admin"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -------------------------------------------------------
-- TABELA: categories
-- Leitura pública. Escrita somente para admin.
-- -------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories: select publico" ON public.categories;
CREATE POLICY "categories: select publico"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "categories: write admin" ON public.categories;
CREATE POLICY "categories: write admin"
  ON public.categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -------------------------------------------------------
-- TABELA: products
-- Leitura pública de produtos ativos. Escrita somente admin.
-- -------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products: select publico" ON public.products;
CREATE POLICY "products: select publico"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "products: write admin" ON public.products;
CREATE POLICY "products: write admin"
  ON public.products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -------------------------------------------------------
-- TABELA: product_images
-- Leitura pública. Escrita somente admin.
-- -------------------------------------------------------
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images: select publico" ON public.product_images;
CREATE POLICY "product_images: select publico"
  ON public.product_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "product_images: write admin" ON public.product_images;
CREATE POLICY "product_images: write admin"
  ON public.product_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -------------------------------------------------------
-- STORAGE: bucket product-images
-- Leitura pública. Upload restrito a admin + MIME + tamanho.
-- -------------------------------------------------------

-- Leitura pública de qualquer arquivo do bucket
DROP POLICY IF EXISTS "storage: product-images select publico" ON storage.objects;
CREATE POLICY "storage: product-images select publico"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Upload somente admin, tipos permitidos e máximo 5MB
DROP POLICY IF EXISTS "storage: product-images insert admin" ON storage.objects;
CREATE POLICY "storage: product-images insert admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (metadata->>'mimetype') IN (
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
    )
    AND (metadata->>'size')::bigint < 5242880  -- 5 MB
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update e delete somente admin
DROP POLICY IF EXISTS "storage: product-images update admin" ON storage.objects;
CREATE POLICY "storage: product-images update admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "storage: product-images delete admin" ON storage.objects;
CREATE POLICY "storage: product-images delete admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
