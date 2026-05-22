import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { supabase } from '../../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { registerSchema } from '../../../lib/schemas'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (cooldown) return

    // Normalização simples: remove parênteses, espaços e traços do telefone
    const cleanPhone = phone.replace(/\D/g, '')

    // Validação com Zod
    const validation = registerSchema.safeParse({
      email,
      password,
      full_name: fullName,
      phone: cleanPhone
    })

    if (!validation.success) {
      const firstError = validation.error.errors[0].message
      return toast.error(firstError)
    }

    setSubmitting(true)

    try {
      // 1. Checagem de segurança: verifica se o telefone já existe
      const { data: existing } = await supabase
        .from('profiles')
        .select('phone')
        .eq('phone', cleanPhone)
        .maybeSingle()

      if (existing) {
        throw new Error('Este telefone já está em uso por outra conta.')
      }

      await signUp(email, password, fullName, cleanPhone)
      toast.success('Conta criada! Verifique seu email.')
      navigate('/')
    } catch (err) {
      const msg = err.message || ''
      
      // Tratamento amigável para erros de duplicidade
      if (msg.includes('profiles_phone_unique')) {
        toast.error('Este telefone já está em uso.')
      } else if (msg.includes('User already registered')) {
        toast.error('Este e-mail já está cadastrado.')
      } else {
        toast.error(msg || 'Erro ao criar conta')
      }
      
      setCooldown(true)
      setTimeout(() => setCooldown(false), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 mb-20">
      <Helmet>
        <title>Criar Conta | Agon Imports</title>
      </Helmet>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-heading-md font-semibold">Criar Conta</CardTitle>
          <CardDescription>
            Preencha seus dados para começar a comprar
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-fullname">Nome completo</Label>
              <Input
                id="reg-fullname"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-phone">Telefone</Label>
              <Input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password">Senha</Label>
              <Input
                id="reg-password"
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
              {submitting ? 'Criando...' : cooldown ? 'Aguarde...' : 'Criar Conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link to="/login" className="text-foreground font-medium hover:underline transition-colors">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
