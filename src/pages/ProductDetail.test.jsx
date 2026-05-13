import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { supabaseMock, addItem, response } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
  addItem: { current: null },
  response: { current: null },
}))

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('../contexts/CartContext', () => ({
  useCart: () => ({ addItem: addItem.current }),
}))
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
  addItem.current = vi.fn()
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
  return render(
    <MemoryRouter initialEntries={[`/produto/${id}`]}>
      <Routes>
        <Route path="/produto/:id" element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProductDetail page', () => {
  it('renders product name, prices, description and breadcrumb', async () => {
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByText(/Carregando/))
    expect(screen.getByRole('heading', { level: 1, name: 'Fone Bluetooth' })).toBeInTheDocument()
    expect(screen.getByText('Som incrível')).toBeInTheDocument()
    expect(screen.getByText(/79,90/)).toBeInTheDocument()
    expect(screen.getByText(/149,90/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Eletrônicos' })).toHaveAttribute('href', '/categoria/eletronicos')
  })

  it('quantity selector increments and respects minimum of 1', async () => {
    const user = userEvent.setup()
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByText(/Carregando/))

    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '+' }))
    expect(screen.getByText('3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '-' }))
    expect(screen.getByText('2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '-' }))
    await user.click(screen.getByRole('button', { name: '-' }))
    await user.click(screen.getByRole('button', { name: '-' }))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('Adicionar a Sacola calls addItem with chosen quantity', async () => {
    const user = userEvent.setup()
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByText(/Carregando/))

    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: /Adicionar a Sacola/i }))

    expect(addItem.current).toHaveBeenCalledTimes(1)
    const [productArg, qty] = addItem.current.mock.calls[0]
    expect(productArg).toMatchObject({ id: 'p1', name: 'Fone Bluetooth', price: 79.9, image_url: 'a.jpg' })
    expect(qty).toBe(2)
  })

  it('shows "Produto esgotado" and hides Add button for out_of_stock', async () => {
    response.current = { data: PRODUCT_OOS, error: null }
    renderRoute('p2')
    await waitForElementToBeRemoved(() => screen.queryByText(/Carregando/))
    expect(screen.getByText(/Produto esgotado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Adicionar a Sacola/i })).not.toBeInTheDocument()
  })

  it('shows "Produto nao encontrado" when product is missing', async () => {
    response.current = { data: null, error: { message: 'not found' } }
    renderRoute('zzz')
    await waitForElementToBeRemoved(() => screen.queryByText(/Carregando/))
    expect(screen.getByText(/Produto nao encontrado/i)).toBeInTheDocument()
  })

  it('shows free shipping hint for price >= 100', async () => {
    response.current = { data: { ...PRODUCT_AVAILABLE, price: 200 }, error: null }
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByText(/Carregando/))
    expect(screen.getByText(/Frete gratis/i)).toBeInTheDocument()
  })

  it('shows paid shipping hint for price < 100', async () => {
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByText(/Carregando/))
    expect(screen.getByText(/Frete: R\$ 15,90/)).toBeInTheDocument()
  })
})
