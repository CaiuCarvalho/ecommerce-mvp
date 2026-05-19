import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { loginSchema } from '../../../lib/schemas'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (cooldown) return

    // Validação com Zod
    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      return toast.error(validation.error.errors[0].message)
    }

    setSubmitting(true)

    try {
      await signIn(email, password)
      toast.success('Login realizado!')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Erro ao autenticar')
      setCooldown(true)
      setTimeout(() => setCooldown(false), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Helmet>
        <title>Entrar | Agon Imports</title>
      </Helmet>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
          <CardDescription>
            Insira suas credenciais para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                <Link to="/recuperar-senha" className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || cooldown}
              className="w-full mt-6"
            >
              {(submitting || cooldown) && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {submitting ? 'Aguarde...' : cooldown ? 'Aguarde...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-foreground font-medium hover:underline transition-colors">
              Criar conta
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
