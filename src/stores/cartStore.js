import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const CART_KEY = 'ecommerce_cart'

/**
 * Store Zustand do carrinho com persistência automática no localStorage.
 *
 * Zustand com `persist` substitui o CartContext + useState + useEffect manual,
 * com a vantagem de:
 * - Sem re-render em cascata (componentes subscrevem apenas ao slice que usam)
 * - Persistência automática e hidratação sem flicker
 * - Acesso direto fora de componentes React (ex: em funções de checkout)
 * - API mais simples e testável
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      /**
       * Adiciona um produto ao carrinho.
       * Se já existir, incrementa a quantidade.
       */
      addItem: (product, qty = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product_id === product.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === product.id
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                product_id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url,
                quantity: qty,
              },
            ],
          }
        })
      },

      /** Remove um item pelo productId */
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }))
      },

      /** Atualiza a quantidade. Se quantity < 1, remove o item. */
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId ? { ...i, quantity } : i
          ),
        }))
      },

      /** Esvazia o carrinho */
      clearCart: () => set({ items: [] }),

      // Selectors computados (derivados do state, não armazenados)
      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },
      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },
    }),
    {
      name: CART_KEY,
      // Só persiste os items, não os métodos
      partialize: (state) => ({ items: state.items }),
    }
  )
)

/**
 * Hook de compatibilidade — mantém a mesma API do useCart() anterior.
 * Permite migração gradual sem alterar todos os componentes de uma vez.
 *
 * Uso: `const { items, addItem, removeItem, subtotal } = useCart()`
 */
export function useCart() {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }
}
