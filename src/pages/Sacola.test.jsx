import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '../contexts/CartContext'
import Sacola from './Sacola'

function renderSacola(initialCart = null) {
  if (initialCart) {
    localStorage.setItem('ecommerce_cart', JSON.stringify(initialCart))
  }
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
    expect(screen.getByText(/Sacola vazia/i)).toBeInTheDocument()
    expect(screen.getByText(/Ver produtos/i)).toBeInTheDocument()
  })

  it('lists items, subtotal, and free shipping hint for cart >= R$100', () => {
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 2 },
    ])
    expect(screen.getByText('Fone')).toBeInTheDocument()
    expect(screen.getByText(/Frete grátis/)).toBeInTheDocument()
  })

  it('shows paid shipping hint for cart < R$100', () => {
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 30, image: null, quantity: 1 },
    ])
    expect(screen.getByText(/Frete: R\$ 15,90/)).toBeInTheDocument()
  })

  it('+ button increments quantity', async () => {
    const user = userEvent.setup()
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 1 },
    ])
    await user.click(screen.getByRole('button', { name: '+' }))
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('− button decrements quantity, and reaching 0 removes the item', async () => {
    const user = userEvent.setup()
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 1 },
    ])
    await user.click(screen.getByRole('button', { name: '−' }))
    expect(screen.getByText(/Sacola vazia/i)).toBeInTheDocument()
  })

  it('Remover button removes the item from cart', async () => {
    const user = userEvent.setup()
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 1 },
      { product_id: 'p2', name: 'Mouse', price: 50, image: null, quantity: 1 },
    ])
    const foneRow = screen.getByText('Fone').closest('div.flex.items-center.gap-4')
    await user.click(within(foneRow).getByRole('button', { name: /Remover/i }))
    expect(screen.queryByText('Fone')).not.toBeInTheDocument()
    expect(screen.getByText('Mouse')).toBeInTheDocument()
  })

  it('Finalizar Compra link points to /checkout', () => {
    renderSacola([
      { product_id: 'p1', name: 'Fone', price: 79.9, image: null, quantity: 1 },
    ])
    const link = screen.getByRole('link', { name: /Finalizar Compra/i })
    expect(link).toHaveAttribute('href', '/checkout')
  })
})
