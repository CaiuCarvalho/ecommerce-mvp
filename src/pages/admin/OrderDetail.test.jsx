import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { supabaseMock, toastApi, updateCalls, navigateFn } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
  toastApi: { success: null, error: null },
  updateCalls: { ref: [] },
  navigateFn: { current: null },
}))

vi.mock('../../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('react-hot-toast', () => ({
  default: { success: (m) => toastApi.success(m), error: (m) => toastApi.error(m) },
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateFn.current }
})

import OrderDetail from './OrderDetail'

const ORDER = {
  id: 'aaaaaaaa1111-bbbb',
  user_id: 'user-1234',
  status: 'processing',
  total: 200,
  subtotal: 180,
  shipping_cost: 20,
  mp_status: 'approved',
  mp_payment_id: 'MP123',
  created_at: '2026-05-13T10:00:00Z',
  profiles: { full_name: 'Ana Silva', phone: '11999990000' },
  order_items: [
    { id: 'i1', product_name: 'Fone', quantity: 2, unit_price: 90 },
  ],
  shipping_address: {
    street: 'Rua A', number: '100', complement: 'Apto 2',
    neighborhood: 'Centro', city: 'SP', state: 'SP', cep: '01000-000',
  },
}

let response
beforeEach(() => {
  response = { data: ORDER, error: null }
  updateCalls.ref = []
  toastApi.success = vi.fn()
  toastApi.error = vi.fn()
  navigateFn.current = vi.fn()

  supabaseMock.from = vi.fn(() => {
    const b = {}
    const chain = ['select', 'eq', 'order', 'limit']
    for (const m of chain) b[m] = () => b
    b.update = (vals) => { updateCalls.ref.push(vals); b.eq = () => Promise.resolve({ data: null, error: null }); return b }
    b.single = () => Promise.resolve(response)
    b.then = (ok) => Promise.resolve({ data: null, error: null }).then(ok)
    return b
  })
})

function renderRoute(id = 'aaaaaaaa1111-bbbb') {
  return render(
    <MemoryRouter initialEntries={[`/admin/pedidos/${id}`]}>
      <Routes>
        <Route path="/admin/pedidos/:id" element={<OrderDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Admin OrderDetail', () => {
  it('renders order header, items, totals and address', async () => {
    renderRoute()
    await waitFor(() => expect(screen.getByText(/Pedido #aaaaaaaa/)).toBeInTheDocument())

    expect(screen.getByText('Fone')).toBeInTheDocument()
    expect(screen.getByText(/2x/)).toBeInTheDocument()
    expect(screen.getAllByText(/180,00/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/200,00/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Rua A, 100/)).toBeInTheDocument()
    expect(screen.getByText(/CEP: 01000-000/)).toBeInTheDocument()
  })

  it('renders client and payment block', async () => {
    renderRoute()
    await waitFor(() => expect(screen.getByText('Ana Silva')).toBeInTheDocument())
    expect(screen.getByText('11999990000')).toBeInTheDocument()
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
    expect(screen.getByText('MP123')).toBeInTheDocument()
  })

  it('changing status select sends an update and shows success toast', async () => {
    const user = userEvent.setup()
    renderRoute()
    await waitFor(() => expect(screen.getByText(/Pedido #aaaaaaaa/)).toBeInTheDocument())

    await user.selectOptions(screen.getByRole('combobox'), 'shipped')

    await waitFor(() => expect(updateCalls.ref).toEqual([{ status: 'shipped' }]))
    await waitFor(() => expect(toastApi.success).toHaveBeenCalledWith('Status atualizado'))
  })

  it('redirects when the order is not found', async () => {
    response = { data: null, error: { message: 'not found' } }
    renderRoute('zzz')
    await waitFor(() => expect(navigateFn.current).toHaveBeenCalledWith('/admin/pedidos'))
    expect(toastApi.error).toHaveBeenCalledWith('Pedido nao encontrado')
  })
})
