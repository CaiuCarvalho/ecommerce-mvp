import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider } from '../contexts/CartContext'

export function renderWithProviders(ui, { route = '/' } = {}) {
  // Cria um QueryClient novo e limpo para cada teste, evitando cache compartilhado
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Sem retries nos testes
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <CartProvider>
          {ui}
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}
