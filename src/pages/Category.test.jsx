import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { supabaseMock, addItem } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
  addItem: { current: null },
}))

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('../contexts/CartContext', () => ({
  useCart: () => ({ addItem: addItem.current }),
}))
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
  categoryResponse = { data: CATEGORY, error: null }
  addItem.current = vi.fn()
  supabaseMock.from = vi.fn((table) => {
    const b = {}
    const chain = ['select', 'eq', 'order', 'limit']
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
  return render(
    <MemoryRouter initialEntries={[`/categoria/${slug}`]}>
      <Routes>
        <Route path="/categoria/:slug" element={<Category />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Category page', () => {
  it('renders category title, breadcrumb and product list', async () => {
    renderRoute()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Eletrônicos' })).toBeInTheDocument())
    expect(screen.getByText('Fone')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
  })

  it('Add to cart calls addItem with product', async () => {
    const user = userEvent.setup()
    renderRoute()
    await waitFor(() => expect(screen.getByText('Fone')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Adicionar a Sacola/i }))
    expect(addItem.current).toHaveBeenCalledTimes(1)
    expect(addItem.current.mock.calls[0][0]).toMatchObject({ id: 'p1', name: 'Fone' })
  })

  it('shows "Categoria nao encontrada" for invalid slug', async () => {
    categoryResponse = { data: null, error: null }
    renderRoute('inexistente')
    await waitFor(() => expect(screen.getByText(/Categoria nao encontrada/i)).toBeInTheDocument())
  })
})
