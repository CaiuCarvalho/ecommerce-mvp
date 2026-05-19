import * as Sentry from '@sentry/react'

/**
 * Reporta Web Vitals para o console em dev e para o Sentry em produção.
 * Métricas: CLS, FCP, LCP, TTFB
 *
 * Referência: https://web.dev/vitals/
 */
export function reportWebVitals() {
  if (!('performance' in window) || !('PerformanceObserver' in window)) return

  const reportMetric = (name, value) => {
    if (import.meta.env.DEV) {
      console.info(`[Web Vitals] ${name}: ${Math.round(value)}`)
    }

    // Envia como breadcrumb rastreável no Sentry (compatível com todas as versões)
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: name,
      data: { value: Math.round(value) },
      level: 'info',
    })
  }

  // --- LCP ---
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const last = entries[entries.length - 1]
    reportMetric('LCP', last.startTime)
  })
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

  // --- CLS ---
  let clsValue = 0
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) clsValue += entry.value
    }
    reportMetric('CLS', clsValue * 1000) // × 1000 para consistência de escala
  })
  clsObserver.observe({ type: 'layout-shift', buffered: true })

  // --- FCP ---
  const fcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        reportMetric('FCP', entry.startTime)
        fcpObserver.disconnect()
      }
    }
  })
  fcpObserver.observe({ type: 'paint', buffered: true })

  // --- TTFB ---
  const navEntry = performance.getEntriesByType('navigation')[0]
  if (navEntry) {
    reportMetric('TTFB', navEntry.responseStart)
  }
}
