import { describe, it, expect } from 'vitest'
import { act, render } from '@testing-library/react'
import { CartProvider, useCart } from './CartContext'

function setup() {
  let api
  function Probe() {
    api = useCart()
    return null
  }
  render(<CartProvider><Probe /></CartProvider>)
  return () => api
}

const P1 = { id: 'p1', name: 'Fone', price: 79.9, image_url: 'a.jpg' }
const P2 = { id: 'p2', name: 'Camera', price: 200, image_url: 'b.jpg' }

describe('CartContext', () => {
  it('starts empty', () => {
    const get = setup()
    expect(get().items).toEqual([])
    expect(get().totalItems).toBe(0)
    expect(get().subtotal).toBe(0)
  })

  it('adds new items and accumulates quantity for the same product', () => {
    const get = setup()
    act(() => get().addItem(P1))
    act(() => get().addItem(P1, 2))
    expect(get().items).toHaveLength(1)
    expect(get().items[0]).toMatchObject({ product_id: 'p1', quantity: 3, price: 79.9 })
    expect(get().totalItems).toBe(3)
    expect(get().subtotal).toBeCloseTo(79.9 * 3, 5)
  })

  it('updateQuantity sets a new quantity, and 0 removes the item', () => {
    const get = setup()
    act(() => get().addItem(P1))
    act(() => get().addItem(P2, 2))
    act(() => get().updateQuantity('p2', 5))
    expect(get().items.find(i => i.product_id === 'p2').quantity).toBe(5)
    act(() => get().updateQuantity('p1', 0))
    expect(get().items.map(i => i.product_id)).toEqual(['p2'])
  })

  it('removeItem removes a product', () => {
    const get = setup()
    act(() => get().addItem(P1))
    act(() => get().addItem(P2))
    act(() => get().removeItem('p1'))
    expect(get().items.map(i => i.product_id)).toEqual(['p2'])
  })

  it('clearCart empties the cart', () => {
    const get = setup()
    act(() => get().addItem(P1, 3))
    act(() => get().clearCart())
    expect(get().items).toEqual([])
    expect(get().totalItems).toBe(0)
  })

  it('persists to localStorage on change', () => {
    const get = setup()
    act(() => get().addItem(P1, 2))
    const stored = JSON.parse(localStorage.getItem('ecommerce_cart'))
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ product_id: 'p1', quantity: 2 })
  })

  it('rehydrates from localStorage when provider mounts', () => {
    localStorage.setItem('ecommerce_cart', JSON.stringify([
      { product_id: 'pX', name: 'Saved', price: 10, image: null, quantity: 4 },
    ]))
    const get = setup()
    expect(get().items).toEqual([
      { product_id: 'pX', name: 'Saved', price: 10, image: null, quantity: 4 },
    ])
    expect(get().totalItems).toBe(4)
  })

  it('survives corrupted localStorage by returning empty cart', () => {
    localStorage.setItem('ecommerce_cart', '{not-json')
    const get = setup()
    expect(get().items).toEqual([])
  })
})
