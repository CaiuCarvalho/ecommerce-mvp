import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../../../test/utils'
import { useCartStore } from '../../../stores/cartStore'

const { supabaseMock, response } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
  response: { current: null },
}))

vi.mock('../../../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

import ProductDetail from './ProductDetail'

const PRODUCT_AVAILABLE = {
  id: 'p1', name: 'Fone Bluetooth', price: 79.9, compare_price: 149.9,
  stock_status: 'available', description: 'Som incrível',
  product_images: [
    { id: 'i1', url: 'a.jpg', position: 0 },
    { id: 'i2', url: 'b.jpg', position: 1 },
  ],
  categories: { name: 'Eletrônicos', slug: 'eletronicos' },
}
const PRODUCT_OOS = { ...PRODUCT_AVAILABLE, id: 'p2', name: 'Indisponível', stock_status: 'out_of_stock' }

beforeEach(() => {
  useCartStore.setState({ items: [] })
  response.current = { data: PRODUCT_AVAILABLE, error: null }
  supabaseMock.from = vi.fn(() => {
    const b = {}
    const chain = ['select', 'eq', 'order', 'limit', 'in']
    for (const m of chain) b[m] = () => b
    b.single = () => Promise.resolve(response.current)
    b.then = (ok) => Promise.resolve(response.current).then(ok)
    return b
  })
})

function renderRoute(id = 'p1') {
  return renderWithProviders(
    <Routes>
      <Route path="/produto/:id" element={<ProductDetail />} />
    </Routes>,
    { route: `/produto/${id}` }
  )
}

describe('ProductDetail page', () => {
  it('renders product name, prices, description and breadcrumb', async () => {
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByTestId('product-loading'))
    expect(screen.getByRole('heading', { level: 1, name: 'Fone Bluetooth' })).toBeInTheDocument()
    expect(screen.getByText('Som incrível')).toBeInTheDocument()
    expect(screen.getByText(/79,90/)).toBeInTheDocument()
    expect(screen.getByText(/149,90/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Eletrônicos' })).toHaveAttribute('href', '/categoria/eletronicos')
  })

  it('quantity selector increments and respects minimum of 1', async () => {
    const user = userEvent.setup()
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByTestId('product-loading'))

    await user.click(screen.getByTestId('increase-qty'))
    await user.click(screen.getByTestId('increase-qty'))
    expect(screen.getByText('3')).toBeInTheDocument()
    await user.click(screen.getByTestId('decrease-qty'))
    expect(screen.getByText('2')).toBeInTheDocument()
    await user.click(screen.getByTestId('decrease-qty'))
    await user.click(screen.getByTestId('decrease-qty'))
    await user.click(screen.getByTestId('decrease-qty'))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('Adicionar a Sacola calls addItem with chosen quantity', async () => {
    const user = userEvent.setup()
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByTestId('product-loading'))

    await user.click(screen.getByTestId('increase-qty'))
    await user.click(screen.getByRole('button', { name: /Adicionar à Sacola/i }))

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ product_id: 'p1', name: 'Fone Bluetooth', price: 79.9, image: 'a.jpg', quantity: 2 })
  })

  it('shows "Produto esgotado" and hides Add button for out_of_stock', async () => {
    response.current = { data: PRODUCT_OOS, error: null }
    renderRoute('p2')
    await waitForElementToBeRemoved(() => screen.queryByTestId('product-loading'))
    expect(screen.getByText(/Produto temporariamente esgotado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Adicionar à Sacola/i })).not.toBeInTheDocument()
  })

  it('shows "Produto não encontrado" when product is missing', async () => {
    response.current = { data: null, error: { message: 'not found' } }
    renderRoute('zzz')
    await waitForElementToBeRemoved(() => screen.queryByTestId('product-loading'))
    expect(screen.getByText(/Produto não encontrado/i)).toBeInTheDocument()
  })

  it('shows free shipping hint for price >= 100', async () => {
    response.current = { data: { ...PRODUCT_AVAILABLE, price: 200 }, error: null }
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByTestId('product-loading'))
    expect(screen.getByText(/Frete grátis/i)).toBeInTheDocument()
  })

  it('shows paid shipping hint for price < 100', async () => {
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByTestId('product-loading'))
    expect(screen.getByText(/Frete: R\$ 15,90/)).toBeInTheDocument()
  })
})
