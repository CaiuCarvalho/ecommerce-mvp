-- Adicionar coluna is_active em categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Garantir que as categorias existentes fiquem ativas
UPDATE categories SET is_active = true WHERE is_active IS NULL;
