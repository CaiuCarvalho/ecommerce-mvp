import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

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
    setSubmitting(true)

    try {
      await signIn(email, password)
      toast.success('Login realizado!')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Erro ao autenticar')
      // Cooldown de 3s após erro para dificultar força bruta no cliente
      setCooldown(true)
      setTimeout(() => setCooldown(false), 3000)
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg border border-gray-200">
      <Helmet>
        <title>Entrar | Loja MVP</title>
      </Helmet>
      <h1 className="text-2xl font-bold mb-6">Entrar</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <Link to="/recuperar-senha" className="text-xs text-blue-600 hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <input
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
          {submitting ? 'Aguarde...' : cooldown ? 'Aguarde...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-gray-600">
        Nao tem conta?{' '}
        <Link to="/cadastro" className="text-blue-600 hover:underline">Criar conta</Link>
      </p>
    </div>
  )
}
