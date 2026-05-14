import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { supabase } from '../lib/supabase'
import formatPrice from '../lib/formatPrice'
import toast from 'react-hot-toast'

const SHIPPING_THRESHOLD = 100
const SHIPPING_COST = 15.9

export default function Checkout() {
  const { user, profile, signUp } = useAuth()
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)

  // Registration fields (only if not logged in)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')

  // Address fields
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')

  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal + shipping

  useEffect(() => {
    if (items.length === 0) navigate('/sacola', { replace: true })
  }, [items.length, navigate])

  async function handleCepBlur() {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) {
      setCepError('CEP deve ter 8 digitos')
      return
    }
    setCepLoading(true)
    setCepError('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError('CEP nao encontrado, preencha manualmente')
      } else {
        setStreet(data.logradouro || '')
        setNeighborhood(data.bairro || '')
        setCity(data.localidade || '')
        setState(data.uf || '')
      }
    } catch {
      setCepError('Erro ao buscar CEP, preencha manualmente')
    } finally {
      setCepLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    try {
      let currentUser = user

      if (!currentUser) {
        const { user: newUser } = await signUp(regEmail, regPassword, regName, regPhone)
        currentUser = newUser
      }

      const address = {
        cep: cep.replace(/\D/g, ''),
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      }

      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            address,
            origin: window.location.origin,
          }),
        }
      )

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Erro ao criar pedido')
      }

      clearCart()

      if (result.checkout_url) {
        window.location.href = result.checkout_url
      } else {
        navigate(`/pedido/${result.order_id}?status=pending`)
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao processar checkout')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <Helmet>
        <title>Checkout | Loja MVP</title>
      </Helmet>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cart Summary */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Resumo da Sacola</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y">
            {items.map(item => (
              <div key={item.product_id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity}x {formatPrice(item.price)}</p>
                  </div>
                </div>
                <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frete</span>
              <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        {/* Registration or Profile */}
        <section>
          <h2 className="text-lg font-semibold mb-3">
            {user ? 'Seus Dados' : 'Dados Pessoais'}
          </h2>

          {user ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm"><strong>Nome:</strong> {profile?.full_name}</p>
              <p className="text-sm"><strong>Email:</strong> {user.email}</p>
              {profile?.phone && <p className="text-sm"><strong>Telefone:</strong> {profile.phone}</p>}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-600 mb-2">
                Ja tem conta? <Link to="/login" className="text-blue-600 hover:underline">Entrar</Link>
              </p>
              <div>
                <label htmlFor="ck-name" className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input id="ck-name" type="text" value={regName} onChange={e => setRegName(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="ck-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input id="ck-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="ck-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input id="ck-phone" type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="ck-password" className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <input id="ck-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}
        </section>

        {/* Address */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Endereco de Entrega</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <label htmlFor="ck-cep" className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
              <div className="flex gap-2">
                <input id="ck-cep" type="text" value={cep} onChange={e => setCep(e.target.value)}
                  onBlur={handleCepBlur} required maxLength={9} placeholder="01000-000"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {cepLoading && <span className="text-sm text-gray-500 self-center">Buscando...</span>}
              </div>
              {cepError && <p className="text-xs text-amber-600 mt-1">{cepError}</p>}
            </div>

            <div>
              <label htmlFor="ck-street" className="block text-sm font-medium text-gray-700 mb-1">Rua *</label>
              <input id="ck-street" type="text" value={street} onChange={e => setStreet(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ck-number" className="block text-sm font-medium text-gray-700 mb-1">Numero *</label>
                <input id="ck-number" type="text" value={number} onChange={e => setNumber(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="ck-complement" className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input id="ck-complement" type="text" value={complement} onChange={e => setComplement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label htmlFor="ck-neighborhood" className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
              <input id="ck-neighborhood" type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label htmlFor="ck-city" className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                <input id="ck-city" type="text" value={city} onChange={e => setCity(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="ck-state" className="block text-sm font-medium text-gray-700 mb-1">UF *</label>
                <input id="ck-state" type="text" value={state} onChange={e => setState(e.target.value)} required maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Processando...' : `Pagar com Mercado Pago — ${formatPrice(total)}`}
        </button>
      </form>
    </div>
  )
}
