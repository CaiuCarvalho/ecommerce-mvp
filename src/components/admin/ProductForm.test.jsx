import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { supabaseMock, navigateFn, toastApi } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
  navigateFn: { current: null },
  toastApi: { success: null, error: null },
}))

vi.mock('../../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('react-hot-toast', () => ({
  default: {
    success: (m) => toastApi.success(m),
    error: (m) => toastApi.error(m),
  },
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateFn.current }
})
vi.mock('./ImageUploader', () => ({ default: () => <div data-testid="image-uploader" /> }))

import ProductForm from './ProductForm'

const CATEGORIES = [
  { id: 1, name: 'Eletrônicos' },
  { id: 2, name: 'Pets' },
]
const PRODUCT = {
  id: 'p1', name: 'Fone', description: 'desc', price: 79.9, compare_price: 149.9,
  category_id: 1, stock_status: 'available', is_active: true, product_images: [],
}

let updateCalls
let productOnLoad

function makeBuilder(table) {
  const ops = []
  const builder = {}
  const chain = ['select', 'order', 'limit']
  for (const m of chain) builder[m] = () => builder
  builder.eq = () => builder
  builder.update = (vals) => { ops.push(['update', vals]); updateCalls.push({ table, vals }); return builder }
  builder.insert = () => builder
  builder.delete = () => builder
  builder.single = () => {
    if (table === 'products') return Promise.resolve({ data: productOnLoad, error: null })
    return Promise.resolve({ data: null, error: null })
  }
  builder.then = (ok) => {
    if (table === 'categories') return Promise.resolve({ data: CATEGORIES, error: null }).then(ok)
    return Promise.resolve({ data: null, error: null }).then(ok)
  }
  return builder
}

beforeEach(() => {
  updateCalls = []
  productOnLoad = PRODUCT
  navigateFn.current = vi.fn()
  toastApi.success = vi.fn()
  toastApi.error = vi.fn()
  supabaseMock.from = vi.fn((table) => makeBuilder(table))
  window.confirm = vi.fn(() => true)
})

function renderForm(props = {}) {
  return render(
    <MemoryRouter>
      <ProductForm {...props} />
    </MemoryRouter>
  )
}

describe('ProductForm — soft delete', () => {
  it('on edit, "Desativar" sends update is_active=false (not a hard delete) and navigates back', async () => {
    const user = userEvent.setup()
    renderForm({ productId: 'p1' })

    await waitFor(() => expect(screen.getByDisplayValue('Fone')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Desativar/i }))

    await waitFor(() => expect(updateCalls).toHaveLength(1))
    expect(updateCalls[0].table).toBe('products')
    expect(updateCalls[0].vals).toEqual({ is_active: false })
    expect(toastApi.success).toHaveBeenCalledWith('Produto desativado')
    expect(navigateFn.current).toHaveBeenCalledWith('/admin/produtos')
  })

  it('does NOT delete the product (no hard delete builder call)', async () => {
    const user = userEvent.setup()
    renderForm({ productId: 'p1' })
    await waitFor(() => expect(screen.getByDisplayValue('Fone')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Desativar/i }))
    await waitFor(() => expect(toastApi.success).toHaveBeenCalled())

    const sawDelete = updateCalls.find(c => c.vals?.is_active === undefined)
    expect(sawDelete).toBeUndefined()
  })

  it('button label flips to "Desativando..." while in-flight', async () => {
    const user = userEvent.setup()
    let resolveUpdate
    const updatePromise = new Promise(r => { resolveUpdate = r })

    supabaseMock.from = vi.fn((table) => {
      const b = makeBuilder(table)
      const origUpdate = b.update
      b.update = (vals) => {
        const chained = origUpdate(vals)
        chained.then = (ok) => updatePromise.then(() => ok({ data: null, error: null }))
        return chained
      }
      return b
    })

    renderForm({ productId: 'p1' })
    await waitFor(() => expect(screen.getByDisplayValue('Fone')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Desativar/i }))
    expect(await screen.findByRole('button', { name: /Desativando/i })).toBeDisabled()
    resolveUpdate()
  })

  it('aborts when user cancels the confirm dialog', async () => {
    window.confirm = vi.fn(() => false)
    const user = userEvent.setup()
    renderForm({ productId: 'p1' })
    await waitFor(() => expect(screen.getByDisplayValue('Fone')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Desativar/i }))
    expect(updateCalls).toHaveLength(0)
    expect(navigateFn.current).not.toHaveBeenCalled()
  })
})
