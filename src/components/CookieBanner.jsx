import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const COOKIE_CONSENT_KEY = 'agon_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!accepted) {
      // Exibe o banner com pequeno delay para não atrapalhar o carregamento inicial
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white px-4 py-4 shadow-lg"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-300 flex-1">
          Usamos cookies essenciais para manter sua sessão ativa e salvar sua sacola de compras.
          Ao continuar navegando, você concorda com nossa{' '}
          <Link
            to="/politica-de-privacidade"
            className="underline text-white hover:text-gray-200"
          >
            Política de Privacidade
          </Link>
          {' '}e{' '}
          <Link
            to="/termos-de-uso"
            className="underline text-white hover:text-gray-200"
          >
            Termos de Uso
          </Link>
          .
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 bg-white text-gray-900 text-sm font-semibold px-5 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
