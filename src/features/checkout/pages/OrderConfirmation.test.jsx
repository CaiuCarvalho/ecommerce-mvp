import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../../../test/utils'

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
}))

vi.mock('../../../lib/supabase', () => ({ supabase: supabaseMock }))

import OrderConfirmation from './OrderConfirmation'

const ORDER = {
  id: 'aaaaaaaa-1111-2222-3333-444444444444',
  status: 'processing',
  subtotal: 129.9,
  shipping_cost: 0,
  total: 129.9,
  created_at: '2026-05-13T10:00:00Z',
  shipping_address: {
    street: 'Rua A',
    number: '100',
    complement: 'Apto 2',
    neighborhood: 'Centro',
    city: 'SP',
    state: 'SP',
    cep: '01000-000',
  },
  order_items: [
    { id: 'i1', product_name: 'Fone', quantity: 1, unit_price: 79.9 },
    { id: 'i2', product_name: 'Cabo', quantity: 2, unit_price: 25 },
  ],
}

let response
beforeEach(() => {
  response = { data: ORDER, error: null }
  supabaseMock.from = vi.fn(() => {
    const b = {}
    const chain = ['select', 'eq', 'order', 'limit']
    for (const m of chain) b[m] = () => b
    b.single = () => Promise.resolve(response)
    return b
  })
})

function renderRoute(id = 'aaaaaaaa-1111-2222-3333-444444444444', status = 'approved') {
  return renderWithProviders(
    <Routes>
      <Route path="/pedido/:id" element={<OrderConfirmation />} />
    </Routes>,
    { route: `/pedido/${id}?status=${status}` }
  )
}


describe('OrderConfirmation page', () => {
  it('renders order details with items and totals', async () => {
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByTestId('order-loading'))
    await waitFor(() => expect(screen.getByText(/Pedido #aaaaaaaa/)).toBeInTheDocument())

    expect(screen.getByText('Fone')).toBeInTheDocument()
    expect(screen.getByText('Cabo')).toBeInTheDocument()
    expect(screen.getAllByText(/129,90/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows green banner for approved status', async () => {
    renderRoute('aaaaaaaa-1111-2222-3333-444444444444', 'approved')
    await waitForElementToBeRemoved(() => screen.queryByTestId('order-loading'))
    await waitFor(() => expect(screen.getByText('Pagamento aprovado!')).toBeInTheDocument())
  })

  it('shows yellow banner for pending status', async () => {
    renderRoute('aaaaaaaa-1111-2222-3333-444444444444', 'pending')
    await waitForElementToBeRemoved(() => screen.queryByTestId('order-loading'))
    await waitFor(() => expect(screen.getByText('Aguardando pagamento...')).toBeInTheDocument())
  })

  it('shows red banner for failure status', async () => {
    renderRoute('aaaaaaaa-1111-2222-3333-444444444444', 'failure')
    await waitForElementToBeRemoved(() => screen.queryByTestId('order-loading'))
    await waitFor(() => expect(screen.getByText('Pagamento não aprovado')).toBeInTheDocument())
  })

  it('renders shipping address from snapshot', async () => {
    renderRoute()
    await waitForElementToBeRemoved(() => screen.queryByTestId('order-loading'))
    await waitFor(() => expect(screen.getByText(/Rua A, 100/)).toBeInTheDocument())
    expect(screen.getByText(/CEP: 01000-000/)).toBeInTheDocument()
  })

  it('shows "Pedido não encontrado" when order does not exist', async () => {
    response = { data: null, error: { message: 'not found' } }
    renderRoute('zzz')
    await waitForElementToBeRemoved(() => screen.queryByTestId('order-loading'))
    await waitFor(() => expect(screen.getByText('Pedido não encontrado')).toBeInTheDocument())
  })
})
