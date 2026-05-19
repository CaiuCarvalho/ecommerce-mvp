import * as Sentry from '@sentry/react'

/**
 * Inicializa o Sentry para Error Tracking e Performance Monitoring.
 *
 * A variável VITE_SENTRY_DSN deve ser configurada no .env (não commitada).
 * Em dev (sem DSN), o Sentry opera em modo silencioso (noop).
 *
 * Integrations incluídas:
 * - BrowserTracing: rastreia carregamento de páginas e navegação entre rotas
 * - Replay: grava sessão (apenas em erro ou sample rate definido)
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  // Sem DSN configurado, não inicializa (desenvolvimento local)
  if (!dsn) {
    console.info('[Sentry] DSN não configurado — tracking desativado.')
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'development' | 'production'

    // Performance: traça 10% das transações em produção
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session Replay: captura 10% de sessões normais, 100% com erro
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mascara inputs sensíveis por padrão
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],
  })
}
