/**
 * Query Keys centralizadas para TanStack Query.
 *
 * Centralizar aqui evita strings espalhadas e garante
 * invalidação/refetch correta ao mudar dados relacionados.
 *
 * Padrão: array hierárquico ['entity', 'scope', ...params]
 * Referência: https://tkdodo.eu/blog/effective-react-query-keys
 */
export const queryKeys = {
  // Produtos
  products: {
    all: () => ['products'],
    list: (filters = {}) => ['products', 'list', filters],
    detail: (id) => ['products', 'detail', id],
  },

  // Categorias
  categories: {
    all: () => ['categories'],
    active: () => ['categories', 'active'],
    bySlug: (slug) => ['categories', 'slug', slug],
  },

  // Pedidos
  orders: {
    all: () => ['orders'],
    list: () => ['orders', 'list'],
    detail: (id) => ['orders', 'detail', id],
  },

  // Perfil do usuário
  profile: {
    all: () => ['profile'],
    byId: (userId) => ['profile', userId],
  },
}
