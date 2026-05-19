import { QueryClient } from '@tanstack/react-query'

/**
 * Instância global do QueryClient com configuração otimizada.
 *
 * - staleTime 60s: dados considerados frescos por 1 minuto (reduz refetches desnecessários)
 * - gcTime 5min: dados em cache por 5 minutos após sem subscritores (navegação rápida back/forward)
 * - retry 1: tenta 1 vez em caso de falha de rede (não spam de retries)
 * - refetchOnWindowFocus false: não refetch a cada troca de aba (comportamento menos agressivo)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,       // 60 segundos
      gcTime: 1000 * 60 * 5,      // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
