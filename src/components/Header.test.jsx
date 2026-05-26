import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { renderWithProviders } from '../test/utils'
import { useCartStore } from '../stores/cartStore'
import Header from './Header'

const { supabaseMock, authMock } = vi.hoisted(() => ({
  supabaseMock: { from: () => ({}) },
  authMock: {
    user: null,
    profile: null,
    isAdmin: false,
    signOut: null,
  }
}))

vi.mock('../lib/supabase', () => ({ supabase: supabaseMock }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: authMock.user,
    profile: authMock.profile,
    isAdmin: authMock.isAdmin,
    signOut: authMock.signOut,
  })
}))

const CATEGORIES = [
  { id: 1, name: 'Eletrônicos', slug: 'eletronicos', parent_id: null, is_active: true },
  { id: 2, name: 'Smartphones', slug: 'smartphones', parent_id: 1, is_active: true },
  { id: 3, name: 'Acessórios', slug: 'acessorios', parent_id: 1, is_active: true },
  { id: 4, name: 'Eletrodomésticos', slug: 'eletrodomesticos', parent_id: null, is_active: true },
]

const FAVORITE_ADDRESS = {
  id: 'addr1',
  user_id: 'u1',
  cep: '12345-678',
  city: 'São Paulo',
  state: 'SP',
  is_favorite: true
}

function makeSupabaseBuilder(table) {
  const b = {}
  const chain = ['select', 'eq', 'order', 'limit', 'single']
  for (const m of chain) {
    b[m] = () => b
  }
  b.then = (ok) => {
    if (table === 'categories') {
      return Promise.resolve({ data: CATEGORIES, error: null }).then(ok)
    }
    if (table === 'addresses') {
      return Promise.resolve({ data: authMock.user ? FAVORITE_ADDRESS : null, error: null }).then(ok)
    }
    return Promise.resolve({ data: null, error: null }).then(ok)
  }
  return b
}

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location-display">{location.pathname}{location.search}</div>
}

function renderHeader(props = {}) {
  return renderWithProviders(
    <>
      <Header onOpenSidebar={props.onOpenSidebar || vi.fn()} />
      <LocationDisplay />
    </>,
    { route: props.route || '/' }
  )
}

beforeEach(() => {
  useCartStore.setState({ items: [] })
  authMock.user = null
  authMock.profile = null
  authMock.isAdmin = false
  authMock.signOut = vi.fn()
  supabaseMock.from = vi.fn((table) => makeSupabaseBuilder(table))
})

describe('Header component', () => {
  it('renders brand logo, search input and main elements', async () => {
    renderHeader()
    expect(screen.getByText('AGON')).toBeInTheDocument()
    expect(screen.getByText('IMPORTS')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Pesquisar na Agon')).toBeInTheDocument()
  })

  it('triggers search navigation on submit', async () => {
    const user = userEvent.setup()
    renderHeader()
    const input = screen.getByPlaceholderText('Pesquisar na Agon')
    await user.type(input, 'Teclado')
    const submitButton = screen.getByRole('button', { name: /Buscar/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/?q=Teclado')
    })
  })

  it('opens and closes custom category dropdown in search bar and navigates correctly', async () => {
    const user = userEvent.setup()
    renderHeader()

    // O botão inicial exibe "Todos" por padrão (filtramos pela classe do dropdown da busca)
    const todosButtons = screen.getAllByRole('button', { name: /Todos/i })
    const dropdownBtn = todosButtons.find(el => el.className.includes('bg-gray-100'))
    expect(dropdownBtn).toBeInTheDocument()

    // Abre o dropdown
    await user.click(dropdownBtn)

    // Deve exibir as categorias pai e filhas no menu
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Eletrônicos' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Smartphones' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Acessórios' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Eletrodomésticos' })).toBeInTheDocument()
    })

    // Clicar em Smartphones (subcategoria) deve navegar para /categoria/smartphones
    await user.click(screen.getByRole('button', { name: 'Smartphones' }))
    
    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/categoria/smartphones')
    })
  })

  it('opens "Todos" dropdown in bottom bar and navigates to categories', async () => {
    const user = userEvent.setup()
    renderHeader()

    // O botão "Todos" da barra inferior
    const todosButtons = screen.getAllByRole('button', { name: /Todos/i })
    const todosBtn = todosButtons.find(el => el.className.includes('text-sm font-bold'))
    expect(todosBtn).toBeInTheDocument()

    // Abre o menu inferior do botão "Todos"
    await user.click(todosBtn)

    // Deve renderizar "Todos os Produtos" e os links das categorias
    // Categorias pai aparecem no menu horizontal E no dropdown (2 ocorrências)
    // Subcategorias aparecem apenas no dropdown (1 ocorrência)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Todos os Produtos' })).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'Eletrônicos' }).length).toBe(2)
      expect(screen.getByRole('link', { name: 'Smartphones' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Acessórios' })).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'Eletrodomésticos' }).length).toBe(2)
    })

    // Ao clicar em uma subcategoria, navega para a URL correspondente
    await user.click(screen.getByRole('link', { name: 'Acessórios' }))
    
    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/categoria/acessorios')
    })
  })

  it('renders guest address info when not authenticated', async () => {
    renderHeader()
    expect(screen.getByText('Informe seu')).toBeInTheDocument()
    expect(screen.getByText('CEP')).toBeInTheDocument()
  })

  it('renders user favorite address when authenticated', async () => {
    authMock.user = { id: 'u1', email: 'user@example.com' }
    authMock.profile = { full_name: 'Gabriel Silva', role: 'customer' }

    renderHeader()
    await waitFor(() => {
      expect(screen.getByText('Enviar para')).toBeInTheDocument()
      expect(screen.getByText('São Paulo, SP 12345-678')).toBeInTheDocument()
    })
  })

  it('shows account popover details for logged-out users', async () => {
    renderHeader()
    // Devem existir os atalhos
    expect(screen.getByText('Olá, faça seu login')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Faça seu login' })).toBeInTheDocument()
    expect(screen.getByText('Comece aqui.')).toBeInTheDocument()
  })

  it('shows account popover details and sign out option for logged-in users', async () => {
    authMock.user = { id: 'u1', email: 'user@example.com' }
    authMock.profile = { full_name: 'Gabriel Silva', role: 'customer' }

    renderHeader()

    expect(screen.getAllByText(/Olá, Gabriel/).length).toBe(2)
    expect(screen.getByText('Sair da conta')).toBeInTheDocument()

    // Clicar em Sair da Conta deve chamar a função signOut
    const user = userEvent.setup()
    await user.click(screen.getByText('Sair da conta'))
    expect(authMock.signOut).toHaveBeenCalled()
  })

  it('shows admin panel shortcut in popover when user is admin', async () => {
    authMock.user = { id: 'admin1', email: 'admin@example.com' }
    authMock.profile = { full_name: 'Admin User', role: 'admin' }
    authMock.isAdmin = true

    renderHeader()
    const adminLinks = screen.getAllByRole('link', { name: /Painel Admin/i })
    expect(adminLinks.length).toBe(2)
    expect(adminLinks[0]).toHaveAttribute('href', '/admin')
  })

  it('renders empty cart and cart item popover information', async () => {
    renderHeader()
    
    // Carrinho está inicialmente vazio
    expect(screen.getByText('Sua sacola está vazia')).toBeInTheDocument()
    const verProdutosLinks = screen.getAllByRole('link', { name: /Ver Produtos/i })
    expect(verProdutosLinks.length).toBeGreaterThan(0)
  })

  it('renders cart items and subtotal in the popover', async () => {
    useCartStore.setState({
      items: [
        { product_id: 'p1', name: 'Smartphone Pro', price: 2000, quantity: 2, image: 'phone.jpg' }
      ]
    })

    renderHeader()

    await waitFor(() => {
      expect(screen.getByText('Sacola (2 itens)')).toBeInTheDocument()
      expect(screen.getByText('Smartphone Pro')).toBeInTheDocument()
      expect(screen.getByText('Qtd: 2')).toBeInTheDocument()
      expect(screen.getAllByText('R$ 4000,00').length).toBe(2)
    })

    // Testa remoção de item
    const user = userEvent.setup()
    const removeBtn = screen.getByRole('button', { name: /Remover Smartphone Pro/i })
    await user.click(removeBtn)

    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
