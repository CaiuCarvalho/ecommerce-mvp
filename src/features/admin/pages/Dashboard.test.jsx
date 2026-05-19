import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { supabaseMock } = vi.hoisted(() => ({ supabaseMock: { from: () => ({}) } }))
vi.mock('../../../lib/supabase', () => ({ supabase: supabaseMock }))

import Dashboard from './Dashboard'

function isoDaysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const ORDERS = [
  { id: 'aaaaaaaa1111', status: 'delivered', total: '120.00', created_at: isoDaysAgo(0), profiles: { full_name: 'Ana' } },
  { id: 'bbbbbbbb2222', status: 'processing', total: '50.00', created_at: isoDaysAgo(2), profiles: { full_name: 'Bruno' } },
  { id: 'cccccccc3333', status: 'cancelled', total: '999.00', created_at: isoDaysAgo(0), profiles: { full_name: 'Carla' } },
  { id: 'dddddddd4444', status: 'shipped', total: '300.00', created_at: isoDaysAgo(20), profiles: { full_name: 'Dado' } },
  { id: 'eeeeeeee5555', status: 'delivered', total: '80.00', created_at: isoDaysAgo(45), profiles: { full_name: 'Eva' } },
]

beforeEach(() => {
  supabaseMock.from = vi.fn((table) => {
    const b = {}
    const chain = ['select', 'eq', 'order', 'limit']
    for (const m of chain) b[m] = () => b
    if (table === 'products') {
      b.then = (ok) => Promise.resolve({ count: 7, data: null, error: null }).then(ok)
    } else if (table === 'orders') {
      b.then = (ok) => Promise.resolve({ data: ORDERS, error: null }).then(ok)
    } else {
      b.then = (ok) => Promise.resolve({ data: [], error: null }).then(ok)
    }
    return b
  })
})

function renderDashboard() {
  return render(<MemoryRouter><Dashboard /></MemoryRouter>)
}

describe('Admin Dashboard', () => {
  it('renders product count and period revenue cards (cancelled excluded from revenue)', async () => {
    renderDashboard()
    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument())

    // Today: 1 delivered (120) + 1 cancelled (excluded) → 120,00. 2 pedidos total today.
    expect(screen.getByText(/Hoje/)).toBeInTheDocument()
    expect(screen.getAllByText(/120,00/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders status counter chips with correct counts', async () => {
    renderDashboard()
    await waitFor(() => expect(screen.getByText(/Aguardando Pagamento: 0/)).toBeInTheDocument())
    expect(screen.getByText(/Processando: 1/)).toBeInTheDocument()
    expect(screen.getByText(/Enviado: 1/)).toBeInTheDocument()
    expect(screen.getByText(/Entregue: 2/)).toBeInTheDocument()
    expect(screen.getByText(/Cancelado: 1/)).toBeInTheDocument()
  })

  it('lists recent orders with link to detail page', async () => {
    renderDashboard()
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument())
    const link = screen.getByRole('link', { name: /aaaaaaaa/ })
    expect(link).toHaveAttribute('href', '/admin/pedidos/aaaaaaaa1111')
  })

  it('shows "Nenhum pedido ainda." when orders list is empty', async () => {
    supabaseMock.from = vi.fn((table) => {
      const b = {}
      const chain = ['select', 'eq', 'order', 'limit']
      for (const m of chain) b[m] = () => b
      b.then = (ok) => {
        if (table === 'products') return Promise.resolve({ count: 0, error: null }).then(ok)
        return Promise.resolve({ data: [], error: null }).then(ok)
      }
      return b
    })
    renderDashboard()
    await waitFor(() => expect(screen.getByText(/Nenhum pedido ainda/)).toBeInTheDocument())
  })
})
