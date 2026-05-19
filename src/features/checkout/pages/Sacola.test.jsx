import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '../../../contexts/CartContext'
import { useCartStore } from '../../../stores/cartStore'
import Sacola from './Sacola'

function renderSacola(initialCart = null) {
  useCartStore.setState({ items: initialCart || [] })
  return render(
    <MemoryRouter>
      <CartProvider>
        <Sacola />
      </CartProvider>
    </MemoryRouter>
  )
}

describe('Sacola page', () => {
  it('shows empty state when cart is empty', () => {
    renderSacola()
    expect(screen.getByText(/Sua sacola está vazia/i)).toBeInTheDocument()
    expect(screen.getByText(/Explorar Produtos/i)).toBeInTheDocument()
  })

  it('lists items, subtotal, and free shipping hint for cart >= R$100', () => {
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 2 },
    ])
    expect(screen.getByText('Fone')).toBeInTheDocument()
    expect(screen.getByText(/Grátis/)).toBeInTheDocument()
  })

  it('shows paid shipping hint for cart < R$100', () => {
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 30, image: null, quantity: 1 },
    ])
    expect(screen.getByText('R$ 15,90')).toBeInTheDocument()
  })

  it('+ button increments quantity', async () => {
    const user = userEvent.setup()
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 1 },
    ])
    await user.click(screen.getByTestId('increase-cart-qty'))
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('− button decrements quantity, and reaching 0 removes the item', async () => {
    const user = userEvent.setup()
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 1 },
    ])
    await user.click(screen.getByTestId('decrease-cart-qty'))
    expect(screen.getByText(/Sua sacola está vazia/i)).toBeInTheDocument()
  })

  it('Remover button removes the item from cart', async () => {
    const user = userEvent.setup()
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 1 },
      { product_id: 'p2', name: 'Mouse', price: 50, image: null, quantity: 1 },
    ])
    const foneRow = screen.getByText('Fone').closest('[data-testid="cart-item"]')
    await user.click(within(foneRow).getByTestId('remove-cart-item'))
    expect(screen.queryByText('Fone')).not.toBeInTheDocument()
    expect(screen.getByText('Mouse')).toBeInTheDocument()
  })

  it('Finalizar Compra link points to /checkout', () => {
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 1 },
    ])
    const link = screen.getByRole('link', { name: /Continuar para o Checkout/i })
    expect(link).toHaveAttribute('href', '/checkout')
  })
})
