import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

const COOKIE_CONSENT_KEY = 'agon_cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!accepted) {
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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <Card className="p-4 shadow-lg border-border">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Usamos cookies essenciais para manter sua sessão ativa e salvar sua sacola de compras.
            Ao continuar, você concorda com nossa{' '}
            <Link to="/politica-de-privacidade" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            {' '}e{' '}
            <Link to="/termos-de-uso" className="text-foreground underline underline-offset-2 hover:text-primary transition-colors">
              Termos de Uso
            </Link>.
          </p>
          <div className="flex justify-end mt-1">
            <Button size="sm" onClick={handleAccept} className="w-full sm:w-auto">
              Entendi
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
