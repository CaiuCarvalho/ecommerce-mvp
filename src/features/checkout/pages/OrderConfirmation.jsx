import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../../lib/supabase'
import { useCart } from '../../../contexts/CartContext'
import formatPrice from '../../../lib/formatPrice'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Skeleton } from '../../../components/ui/Skeleton'
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

const STATUS_CONFIG = {
  approved: { 
    label: 'Pagamento aprovado!', 
    bg: 'bg-green-500/10 text-green-600 border-green-500/20',
    icon: <CheckCircle2 className="w-6 h-6" />
  },
  pending: { 
    label: 'Aguardando pagamento...', 
    bg: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    icon: <Clock className="w-6 h-6" />
  },
  failure: { 
    label: 'Pagamento não aprovado', 
    bg: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: <AlertTriangle className="w-6 h-6" />
  },
}

const ORDER_STATUS_LABELS = {
  awaiting_payment: 'Aguardando Pagamento',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export default function OrderConfirmation() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const paymentStatus = searchParams.get('status')
  const { clearCart } = useCart()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Limpa o carrinho quando o pagamento é aprovado pelo Mercado Pago.
  // Isso garante que o cliente não veja os itens comprados ainda na sacola.
  useEffect(() => {
    if (paymentStatus === 'approved') {
      clearCart()
    }
  }, [paymentStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function fetchOrder() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setOrder(data)
      }
      setLoading(false)
    }
    fetchOrder()
  }, [id])

  if (loading) {
    return (
      <div data-testid="order-loading" className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Skeleton className="h-24 w-full mb-8 rounded-xl" />
        <div className="space-y-4 mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="md:col-span-5 space-y-8">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center border border-dashed border-border rounded-lg mt-8">
        <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
        <p className="text-muted-foreground mb-6">Este pedido não existe ou você não tem permissão para vê-lo.</p>
        <Button asChild variant="outline">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    )
  }

  const statusInfo = STATUS_CONFIG[paymentStatus] || null
  const addr = order.shipping_address

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <Helmet>
        <title>Pedido #{order.id.slice(0, 8)} | Agon Imports</title>
      </Helmet>
      
      {/* Payment status banner */}
      {statusInfo && (
        <div className={`p-6 rounded-xl border mb-8 flex gap-4 items-start ${statusInfo.bg}`}>
          <div className="mt-0.5 flex-shrink-0">
            {statusInfo.icon}
          </div>
          <div>
            <h2 className="font-bold text-lg mb-1">{statusInfo.label}</h2>
            {paymentStatus === 'approved' ? (
              <div className="space-y-2 mt-2 text-sm opacity-90">
                <p>Oba! Recebemos seu pedido com sucesso.</p>
                <p>O processo de faturamento e separação em nosso estoque já foi iniciado. Assim que seu pacote for despachado, você receberá o código de rastreio por email.</p>
              </div>
            ) : paymentStatus === 'failure' ? (
              <p className="text-sm mt-1 opacity-90">
                Houve um problema com o pagamento. Tente novamente ou entre em contato.
              </p>
            ) : (
              <p className="text-sm mt-1 opacity-90">
                Estamos aguardando a confirmação do Mercado Pago.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Resumo do Pedido #{order.id.slice(0, 8)}</h1>
        <p className="text-sm text-muted-foreground">
          Realizado em {new Date(order.created_at).toLocaleDateString('pt-BR')} — Status Atual: <span className="font-semibold text-foreground">{ORDER_STATUS_LABELS[order.status] || order.status}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-8">
          {/* Items */}
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg">Itens</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Qtd: {item.quantity} × {formatPrice(item.unit_price)}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">{formatPrice(item.unit_price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-5 space-y-8">
          {/* Totals */}
          <Card>
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg">Valores</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Frete</span>
                <span className={Number(order.shipping_cost) === 0 ? "text-green-500 font-medium" : ""}>
                  {Number(order.shipping_cost) === 0 ? 'Grátis' : formatPrice(order.shipping_cost)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-4 mt-2">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          {addr && (
            <Card>
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-lg">Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm text-muted-foreground space-y-1">
                <p className="text-foreground font-medium mb-2">{addr.street}, {addr.number}{addr.complement ? ` — ${addr.complement}` : ''}</p>
                <p>{addr.neighborhood}</p>
                <p>{addr.city} - {addr.state}</p>
                <p>CEP: {addr.cep}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-border">
        <Button asChild variant="outline">
          <Link to="/minha-conta">Meus pedidos</Link>
        </Button>
        <Button asChild>
          <Link to="/">Continuar comprando</Link>
        </Button>
      </div>
    </div>
  )
}
