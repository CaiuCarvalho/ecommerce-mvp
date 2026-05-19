import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { supabaseMock, lastFilters } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
  lastFilters: { ref: {} },
}))
vi.mock('../../../lib/supabase', () => ({ supabase: supabaseMock }))

import Orders from './Orders'

const ALL_ORDERS = [
  { id: 'aaaaaaaa1', status: 'processing', total: '120.00', created_at: '2026-05-10T10:00:00Z', mp_status: 'approved', profiles: { full_name: 'Ana Silva' } },
  { id: 'bbbbbbbb2', status: 'delivered', total: '50.00', created_at: '2026-05-12T10:00:00Z', mp_status: 'approved', profiles: { full_name: 'Bruno' } },
  { id: 'cccccccc3', status: 'awaiting_payment', total: '300.00', created_at: '2026-05-13T10:00:00Z', mp_status: 'pending', profiles: { full_name: 'Carla' } },
]

beforeEach(() => {
  supabaseMock.from = vi.fn(() => {
    const filters = {}
    const b = {}
    const chain = ['select', 'order', 'limit', 'in']
    for (const m of chain) b[m] = () => b
    b.eq = (col, val) => { filters[col] = val; return b }
    b.gte = (col, val) => { filters['gte_' + col] = val; return b }
    b.then = (ok) => {
      lastFilters.ref = { ...filters }
      let rows = ALL_ORDERS
      if (filters.status) rows = rows.filter(o => o.status === filters.status)
      if (filters.gte_created_at) rows = rows.filter(o => o.created_at >= filters.gte_created_at)
      return Promise.resolve({ data: rows, error: null }).then(ok)
    }
    return b
  })
  lastFilters.ref = {}
})

function renderOrders() {
  return render(<MemoryRouter><Orders /></MemoryRouter>)
}

describe('Admin Orders — filters & list', () => {
  it('renders all orders initially', async () => {
    renderOrders()
    await waitFor(() => expect(screen.getByText('Ana Silva')).toBeInTheDocument())
    expect(screen.getByText('Bruno')).toBeInTheDocument()
    expect(screen.getByText('Carla')).toBeInTheDocument()
    expect(screen.getByText(/3 pedido\(s\)/)).toBeInTheDocument()
  })

  it('filtering by status sends eq(status, ...) and shows only matches', async () => {
    const user = userEvent.setup()
    renderOrders()
    await waitFor(() => expect(screen.getByText('Ana Silva')).toBeInTheDocument())

    await user.selectOptions(screen.getByRole('combobox'), 'awaiting_payment')

    await waitFor(() => expect(lastFilters.ref.status).toBe('awaiting_payment'))
    await waitFor(() => expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument())
    expect(screen.getByText('Carla')).toBeInTheDocument()
  })

  it('search filter narrows by client name (client-side)', async () => {
    const user = userEvent.setup()
    renderOrders()
    await waitFor(() => expect(screen.getByText('Ana Silva')).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText(/Buscar por nome/i), 'bruno')
    await waitFor(() => expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument())
    expect(screen.getByText('Bruno')).toBeInTheDocument()
  })

  it('"Limpar filtros" resets state and shows all', async () => {
    const user = userEvent.setup()
    renderOrders()
    await waitFor(() => expect(screen.getByText('Ana Silva')).toBeInTheDocument())

    await user.selectOptions(screen.getByRole('combobox'), 'awaiting_payment')
    await waitFor(() => expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Limpar filtros/i }))
    await waitFor(() => expect(screen.getByText('Ana Silva')).toBeInTheDocument())
  })

  it('every row exposes a "Ver detalhes" link to the right route', async () => {
    renderOrders()
    await waitFor(() => expect(screen.getByText('Ana Silva')).toBeInTheDocument())
    const links = screen.getAllByRole('link', { name: /Ver detalhes/i })
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute('href', expect.stringMatching(/^\/admin\/pedidos\//))
  })
})
