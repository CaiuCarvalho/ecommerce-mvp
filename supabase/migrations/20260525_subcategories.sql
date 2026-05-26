-- =======================================================
-- MIGRAÇÃO: Subcategorias (parent_id)
-- =======================================================
-- Adiciona suporte a categorias pai/filho (2 níveis).
-- parent_id NULL = categoria principal.
-- parent_id preenchido = subcategoria.
-- ON DELETE RESTRICT impede exclusão de categoria pai
-- que ainda possui filhas.
-- =======================================================

-- Adicionar coluna parent_id (referência à própria tabela)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id integer DEFAULT NULL;

-- Chave estrangeira: garante integridade referencial
-- RESTRICT impede exclusão de categorias pai que possuem filhas
ALTER TABLE public.categories
  ADD CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id)
    REFERENCES public.categories(id)
    ON DELETE RESTRICT;

-- Índice para consultas rápidas de subcategorias por pai
CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON public.categories(parent_id);

-- Constraint: impedir que uma categoria seja pai de si mesma
ALTER TABLE public.categories
  ADD CONSTRAINT chk_categories_no_self_parent
    CHECK (parent_id IS NULL OR parent_id != id);
