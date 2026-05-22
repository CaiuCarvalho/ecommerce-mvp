import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../../contexts/AuthContext'
import { useCart } from '../../../contexts/CartContext'
import { supabase } from '../../../lib/supabase'
import formatPrice from '../../../lib/formatPrice'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { Spinner } from '../../../components/ui/Spinner'
import { ShoppingBag } from 'lucide-react'

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
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 mb-20">
      <Helmet>
        <title>Checkout | Agon Imports</title>
      </Helmet>
      
      <div className="mb-10">
        <h1 className="text-heading-xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground mt-1">Finalize sua compra com segurança.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Formulário (Esquerda) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Registration or Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-sm font-semibold">{user ? 'Seus Dados' : 'Dados Pessoais'}</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-2 text-sm bg-muted/30 p-4 rounded-lg border border-border">
                  <p><span className="text-muted-foreground font-medium w-20 inline-block">Nome:</span> {profile?.full_name}</p>
                  <p><span className="text-muted-foreground font-medium w-20 inline-block">Email:</span> {user.email}</p>
                  {profile?.phone && <p><span className="text-muted-foreground font-medium w-20 inline-block">Telefone:</span> {profile.phone}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg border border-border mb-6">
                    <p className="text-sm text-muted-foreground">
                      Já tem conta? <Link to="/login" className="text-foreground font-medium hover:underline transition-colors">Entrar agora</Link>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ck-name">Nome completo *</Label>
                      <Input id="ck-name" type="text" value={regName} onChange={e => setRegName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ck-email">Email *</Label>
                      <Input id="ck-email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ck-phone">Telefone</Label>
                      <Input id="ck-phone" type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="(11) 99999-9999" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ck-password">Senha *</Label>
                      <Input id="ck-password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-sm font-semibold">Endereço de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ck-cep">CEP *</Label>
                <div className="flex gap-2">
                  <Input id="ck-cep" type="text" value={cep} onChange={e => setCep(e.target.value)}
                    onBlur={handleCepBlur} required maxLength={9} placeholder="01000-000" className="max-w-[200px]" />
                  {cepLoading && <span className="text-sm text-muted-foreground self-center flex items-center gap-2"><Spinner size="sm" /> Buscando...</span>}
                </div>
                {cepError && <p className="text-xs text-destructive mt-1">{cepError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-street">Rua *</Label>
                <Input id="ck-street" type="text" value={street} onChange={e => setStreet(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ck-number">Número *</Label>
                  <Input id="ck-number" type="text" value={number} onChange={e => setNumber(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ck-complement">Complemento</Label>
                  <Input id="ck-complement" type="text" value={complement} onChange={e => setComplement(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ck-neighborhood">Bairro *</Label>
                <Input id="ck-neighborhood" type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="ck-city">Cidade *</Label>
                  <Input id="ck-city" type="text" value={city} onChange={e => setCity(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ck-state">UF *</Label>
                  <Input id="ck-state" type="text" value={state} onChange={e => setState(e.target.value)} required maxLength={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo (Direita) */}
        <div className="lg:col-span-5">
          <Card className="sticky top-24">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-heading-sm font-semibold">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.product_id} className="flex gap-4">
                    <div className="w-16 h-16 bg-muted rounded-md border border-border flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <p className="text-sm font-medium line-clamp-2 leading-tight mb-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-foreground">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/30 rounded-lg p-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Frete</span>
                  <span className={shipping === 0 ? "text-green-500 font-medium" : "text-foreground"}>
                    {shipping === 0 ? 'Grátis' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-border">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold tracking-tight text-foreground">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full h-14 text-base shadow-sm"
              >
                {submitting && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
                {submitting ? 'Processando...' : `Pagar com Mercado Pago`}
              </Button>
              <div className="mt-4 flex justify-center">
                <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png" alt="Mercado Pago" className="h-6 opacity-60 grayscale hover:grayscale-0 transition-all" />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
