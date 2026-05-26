import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../../../test/utils'
import { useCartStore } from '../../../stores/cartStore'

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
}))

vi.mock('../../../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

import Category from './Category'

const CATEGORY = { id: 1, name: 'Eletrônicos', slug: 'eletronicos' }
const PRODUCTS = [
  {
    id: 'p1', name: 'Fone', price: 79.9, compare_price: null,
    stock_status: 'available', category_id: 1,
    product_images: [{ url: 'a.jpg', position: 0 }],
    categories: { name: 'Eletrônicos' },
  },
]

let categoryResponse
beforeEach(() => {
  useCartStore.setState({ items: [] })
  categoryResponse = { data: CATEGORY, error: null }
  supabaseMock.from = vi.fn((table) => {
    const b = {}
    const chain = ['select', 'eq', 'order', 'limit', 'in']
    for (const m of chain) b[m] = () => b
    b.single = () => Promise.resolve(categoryResponse)
    b.then = (ok) => {
      if (table === 'products') return Promise.resolve({ data: PRODUCTS, error: null }).then(ok)
      return Promise.resolve({ data: null, error: null }).then(ok)
    }
    return b
  })
})

function renderRoute(slug = 'eletronicos') {
  return renderWithProviders(
    <Routes>
      <Route path="/categoria/:slug" element={<Category />} />
    </Routes>,
    { route: `/categoria/${slug}` }
  )
}

describe('Category page', () => {
  it('renders category title, breadcrumb and product list', async () => {
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByTestId('category-loading'))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Eletrônicos' })).toBeInTheDocument())
    expect(screen.getByText('Fone')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/')
  })

  it('Add to cart calls addItem with product', async () => {
    const user = userEvent.setup()
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByTestId('category-loading'))
    await waitFor(() => expect(screen.getByText('Fone')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^Adicionar$/i }))
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ product_id: 'p1', name: 'Fone' })
  })

  it('shows "Categoria não encontrada" for invalid slug', async () => {
    categoryResponse = { data: null, error: null }
    renderRoute('inexistente')
    await waitForElementToBeRemoved(() => screen.queryByTestId('category-loading'))
    await waitFor(() => expect(screen.getByText(/Categoria não encontrada/i)).toBeInTheDocument())
  })
})
