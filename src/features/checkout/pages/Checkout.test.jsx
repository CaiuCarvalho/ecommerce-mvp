import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '../../../test/utils'
import { useCartStore } from '../../../stores/cartStore'

const { authMock, supabaseMock, toastApi } = vi.hoisted(() => ({
  authMock: {
    user: null,
    profile: null,
    signUp: null,
  },
  supabaseMock: { auth: { getSession: null } },
  toastApi: { error: null },
}))

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authMock.user,
    profile: authMock.profile,
    signUp: authMock.signUp,
  }),
}))

vi.mock('../../../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: (m) => toastApi.error(m) },
}))

import Checkout from './Checkout'

const ITEMS = [
  { product_id: 'p1', name: 'Fone', price: 79.9, image: 'a.jpg', quantity: 1 },
  { product_id: 'p2', name: 'Cabo', price: 25, image: null, quantity: 2 },
]

beforeEach(() => {
  useCartStore.setState({ items: [...ITEMS] })
  authMock.user = { id: 'u1', email: 'test@test.com' }
  authMock.profile = { full_name: 'Ana', phone: '11999' }
  authMock.signUp = vi.fn()
  supabaseMock.auth = { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } }) }
  toastApi.error = vi.fn()
  globalThis.fetch = vi.fn()
})

function renderCheckout() {
  return renderWithProviders(
    <Routes>
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/sacola" element={<div>Sacola</div>} />
    </Routes>,
    { route: '/checkout' }
  )
}

describe('Checkout page', () => {
  it('renders cart summary with items and totals', () => {
    renderCheckout()
    expect(screen.getByText('Fone')).toBeInTheDocument()
    expect(screen.getByText('Cabo')).toBeInTheDocument()
    expect(screen.getByText(/Frete/)).toBeInTheDocument()
    expect(screen.getByText(/Total/)).toBeInTheDocument()
  })

  it('shows profile info when logged in', () => {
    renderCheckout()
    expect(screen.getByText(/Ana/)).toBeInTheDocument()
    expect(screen.getByText(/test@test.com/)).toBeInTheDocument()
  })

  it('shows registration form when not logged in', () => {
    authMock.user = null
    authMock.profile = null
    renderCheckout()
    expect(screen.getByLabelText(/Nome completo/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Senha/)).toBeInTheDocument()
  })

  it('renders address form with CEP field', () => {
    renderCheckout()
    expect(screen.getByLabelText(/CEP/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Rua/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Número/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Bairro/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cidade/)).toBeInTheDocument()
    expect(screen.getByLabelText(/UF/)).toBeInTheDocument()
  })

  it('shows shipping as free when subtotal >= 100', () => {
    // Add items that sum up to >= 100
    useCartStore.setState({ items: [{ product_id: 'p1', name: 'Expensive', price: 150, image: null, quantity: 1 }] })
    renderCheckout()
    expect(screen.getByText('Grátis')).toBeInTheDocument()
  })

  it('shows shipping cost when subtotal < 100', () => {
    useCartStore.setState({ items: [{ product_id: 'p1', name: 'Fone', price: 50, image: null, quantity: 1 }] })
    renderCheckout()
    expect(screen.getByText(/15,90/)).toBeInTheDocument()
  })

  it('shows CEP error message on invalid CEP', async () => {
    const user = userEvent.setup()
    renderCheckout()

    const cepInput = screen.getByLabelText(/CEP/)
    await user.type(cepInput, '123')
    await user.tab()

    await waitFor(() => expect(screen.getByText(/CEP deve ter 8 digitos/)).toBeInTheDocument())
  })

  it('shows fallback message when ViaCEP fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('network'))
    const user = userEvent.setup()
    renderCheckout()

    const cepInput = screen.getByLabelText(/CEP/)
    await user.type(cepInput, '01000000')
    await user.tab()

    await waitFor(() => expect(screen.getByText(/Erro ao buscar CEP, preencha manualmente/)).toBeInTheDocument())
  })

  it('auto-fills address fields on valid CEP', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({
        logradouro: 'Rua Teste',
        bairro: 'Centro',
        localidade: 'Sao Paulo',
        uf: 'SP',
      }),
    })
    const user = userEvent.setup()
    renderCheckout()

    const cepInput = screen.getByLabelText(/CEP/)
    await user.type(cepInput, '01001000')
    await user.tab()

    await waitFor(() => expect(screen.getByLabelText(/Rua/).value).toBe('Rua Teste'))
    expect(screen.getByLabelText(/Bairro/).value).toBe('Centro')
    expect(screen.getByLabelText(/Cidade/).value).toBe('Sao Paulo')
    expect(screen.getByLabelText(/UF/).value).toBe('SP')
  })

  it('redirects to sacola when cart is empty', () => {
    useCartStore.setState({ items: [] })
    renderCheckout()
    expect(screen.getByText('Sacola')).toBeInTheDocument()
  })
})
