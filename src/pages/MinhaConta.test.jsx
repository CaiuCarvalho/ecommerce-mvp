import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { supabaseMock, authMock } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
  authMock: {
    user: { id: 'u1', email: 'ana@test.com' },
    profile: { full_name: 'Ana Silva', phone: '11999990000' },
  },
}))

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authMock.user,
    profile: authMock.profile,
  }),
}))

import MinhaConta from './MinhaConta'

const ORDERS = [
  { id: 'aaaaaaaa-1111', status: 'delivered', total: '120.00', created_at: '2026-05-10T10:00:00Z' },
  { id: 'bbbbbbbb-2222', status: 'processing', total: '50.00', created_at: '2026-05-12T10:00:00Z' },
]

beforeEach(() => {
  authMock.user = { id: 'u1', email: 'ana@test.com' }
  authMock.profile = { full_name: 'Ana Silva', phone: '11999990000' }
  supabaseMock.from = vi.fn(() => {
    const b = {}
    const chain = ['select', 'eq', 'order', 'limit']
    for (const m of chain) b[m] = () => b
    b.then = (ok) => Promise.resolve({ data: ORDERS, error: null }).then(ok)
    return b
  })
})

function renderPage() {
  return render(<MemoryRouter><MinhaConta /></MemoryRouter>)
}

describe('MinhaConta page', () => {
  it('renders profile info', async () => {
    renderPage()
    expect(screen.getByText(/Ana Silva/)).toBeInTheDocument()
    expect(screen.getByText(/ana@test.com/)).toBeInTheDocument()
    expect(screen.getByText(/11999990000/)).toBeInTheDocument()
  })

  it('renders order history with status badges', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(/#aaaaaaaa/)).toBeInTheDocument())
    expect(screen.getByText(/#bbbbbbbb/)).toBeInTheDocument()
    expect(screen.getByText('Entregue')).toBeInTheDocument()
    expect(screen.getByText('Processando')).toBeInTheDocument()
  })

  it('shows links to order detail pages', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(/#aaaaaaaa/)).toBeInTheDocument())
    const links = screen.getAllByRole('link')
    const orderLink = links.find(l => l.getAttribute('href')?.includes('/pedido/'))
    expect(orderLink).toBeTruthy()
  })

  it('shows "Nenhum pedido ainda." when no orders exist', async () => {
    supabaseMock.from = vi.fn(() => {
      const b = {}
      const chain = ['select', 'eq', 'order', 'limit']
      for (const m of chain) b[m] = () => b
      b.then = (ok) => Promise.resolve({ data: [], error: null }).then(ok)
      return b
    })
    renderPage()
    await waitFor(() => expect(screen.getByText(/Nenhum pedido ainda/)).toBeInTheDocument())
  })
})
