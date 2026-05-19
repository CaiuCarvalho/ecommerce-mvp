import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitForElementToBeRemoved, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test/utils'
import { useCartStore } from '../../../stores/cartStore'

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    from: (() => () => ({}))(),
  },
}))

vi.mock('../../../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

import Home from './Home'

const CATEGORIES = [
  { id: 1, name: 'Eletrônicos', slug: 'eletronicos' },
  { id: 2, name: 'Pets', slug: 'pets' },
]
const PRODUCTS = [
  {
    id: 'p1', name: 'Fone Bluetooth', price: 79.9, compare_price: 149.9,
    stock_status: 'available', category_id: 1,
    product_images: [{ url: 'fone.jpg', position: 0 }],
    categories: { name: 'Eletrônicos' },
  },
  {
    id: 'p2', name: 'Ração Premium', price: 50, compare_price: null,
    stock_status: 'out_of_stock', category_id: 2,
    product_images: [],
    categories: { name: 'Pets' },
  },
]

function makeProductsBuilder() {
  const filters = {}
  const b = {}
  const chain = ['select', 'order', 'limit', 'gte', 'lte', 'in', 'match', 'ilike', 'is']
  for (const m of chain) b[m] = () => b
  b.eq = (col, val) => { filters[col] = val; return b }
  b.then = (ok, err) => {
    let rows = PRODUCTS
    if (filters.category_id !== undefined) rows = rows.filter(r => r.category_id === filters.category_id)
    return Promise.resolve({ data: rows, error: null }).then(ok, err)
  }
  return b
}

function makeCategoriesBuilder() {
  const b = {}
  const chain = ['select', 'order', 'eq', 'limit']
  for (const m of chain) b[m] = () => b
  b.then = (ok) => Promise.resolve({ data: CATEGORIES, error: null }).then(ok)
  return b
}

beforeEach(() => {
  useCartStore.setState({ items: [] })
  supabaseMock.from = vi.fn((table) => {
    if (table === 'categories') return makeCategoriesBuilder()
    if (table === 'products') return makeProductsBuilder()
    return makeCategoriesBuilder()
  })
})

function renderHome() {
  return renderWithProviders(<Home />)
}

describe('Home page', () => {
  it('renders products and category filter buttons', async () => {
    renderHome()
    await waitForElementToBeRemoved(() => screen.queryByTestId('home-loading'))
    expect(screen.getByText('Fone Bluetooth')).toBeInTheDocument()
    expect(screen.getByText('Ração Premium')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eletrônicos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pets' })).toBeInTheDocument()
  })

  it('shows compare_price along with current price for promo items', async () => {
    renderHome()
    await waitForElementToBeRemoved(() => screen.queryByTestId('home-loading'))
    expect(screen.getByText(/149,90/)).toBeInTheDocument()
    expect(screen.getByText(/79,90/)).toBeInTheDocument()
  })

  it('shows "Esgotado" for out_of_stock products and Add button for available ones', async () => {
    renderHome()
    await waitForElementToBeRemoved(() => screen.queryByTestId('home-loading'))
    expect(screen.getByRole('button', { name: /^Adicionar$/i })).toBeInTheDocument()
    expect(screen.getByText('Esgotado')).toBeInTheDocument()
  })

  it('clicking a category filter filters the products', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitForElementToBeRemoved(() => screen.queryByTestId('home-loading'))
    await user.click(screen.getByRole('button', { name: 'Pets' }))
    await waitFor(() => {
      expect(screen.queryByText('Fone Bluetooth')).not.toBeInTheDocument()
      expect(screen.getByText('Ração Premium')).toBeInTheDocument()
    })
  })

  it('Add to cart calls addItem with product data', async () => {
    const user = userEvent.setup()
    renderHome()
    await waitForElementToBeRemoved(() => screen.queryByTestId('home-loading'))
    await user.click(screen.getByRole('button', { name: /^Adicionar$/i }))
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ product_id: 'p1', name: 'Fone Bluetooth', price: 79.9 })
  })
})
