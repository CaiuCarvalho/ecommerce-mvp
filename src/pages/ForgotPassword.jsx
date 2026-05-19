import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card'
import { Label } from '../components/ui/Label'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetar-senha`,
    })

    if (error) {
      toast.error('Erro ao enviar email: ' + error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-16">
      <Helmet>
        <title>Recuperar Senha | Agon Imports</title>
      </Helmet>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          {!sent && (
            <CardDescription>
              Digite o e-mail associado à sua conta para receber um link de recuperação.
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-primary" />
              <p className="text-muted-foreground text-sm">
                Se houver uma conta associada a este email, você receberá um link para redefinir sua senha.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/login">Voltar para o Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nome@exemplo.com"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-6"
              >
                {loading && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}
        </CardContent>
        
        {!sent && (
          <CardFooter className="flex justify-center border-t border-border pt-6">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground font-medium hover:underline transition-colors">
              Lembrei minha senha
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
