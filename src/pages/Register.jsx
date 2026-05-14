import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

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

    if (cleanPhone.length < 10) {
      return toast.error('Telefone inválido. Informe o DDD e o número.')
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
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg border border-gray-200">
      <Helmet>
        <title>Criar Conta | Loja MVP</title>
      </Helmet>
      <h1 className="text-2xl font-bold mb-6">Criar Conta</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-fullname" className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input
            id="reg-fullname"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || cooldown}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Criando...' : cooldown ? 'Aguarde...' : 'Criar Conta'}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-gray-600">
        Ja tem conta?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">Entrar</Link>
      </p>
    </div>
  )
}
