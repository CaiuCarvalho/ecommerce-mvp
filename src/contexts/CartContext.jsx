/**
 * CartContext — Camada de compatibilidade.
 *
 * O estado do carrinho foi migrado para Zustand (src/stores/cartStore.js).
 * Este arquivo mantém as exportações que o resto do app usa:
 * - `CartProvider`: agora é apenas um passthrough (Zustand não precisa de Provider)
 * - `useCart`: reexportado do cartStore para compatibilidade total
 *
 * Migração gradual: nenhum componente precisou ser alterado.
 */
export { useCart } from '../stores/cartStore'

/**
 * CartProvider mantido apenas para não quebrar o App.jsx e os testes.
 * Com Zustand, o Provider é desnecessário — o store é global por natureza.
 */
export function CartProvider({ children }) {
  return children
}
