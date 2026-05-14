import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import formatPrice from '../lib/formatPrice'

const STATUS_CONFIG = {
  approved: { label: 'Pagamento aprovado!', bg: 'bg-green-100 text-green-800 border-green-300' },
  pending: { label: 'Aguardando pagamento...', bg: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  failure: { label: 'Pagamento nao aprovado', bg: 'bg-red-100 text-red-800 border-red-300' },
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
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">Carregando...</div>
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Pedido nao encontrado</h1>
        <p className="text-gray-500 mb-6">Este pedido nao existe ou voce nao tem permissao para ve-lo.</p>
        <Link to="/" className="text-blue-600 hover:underline">Voltar ao inicio</Link>
      </div>
    )
  }

  const statusInfo = STATUS_CONFIG[paymentStatus] || null
  const addr = order.shipping_address

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Helmet>
        <title>Pedido #{order.id.slice(0, 8)} | Loja MVP</title>
      </Helmet>
      {/* Payment status banner */}
      {statusInfo && (
        <div className={`p-5 rounded-lg border mb-8 ${statusInfo.bg}`}>
          <div className="flex items-start gap-3">
            {paymentStatus === 'approved' && (
              <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <p className="font-bold text-lg mb-1">{statusInfo.label}</p>
              {paymentStatus === 'approved' ? (
                <div className="space-y-2 mt-2 text-sm opacity-90">
                  <p>Oba! Recebemos seu pedido com sucesso.</p>
                  <p>O processo de faturamento e separacao em nosso estoque ja foi iniciado. Assim que seu pacote for despachado, voce recebera o codigo de rastreio por email.</p>
                </div>
              ) : paymentStatus === 'failure' ? (
                <p className="text-sm mt-1">
                  Houve um problema com o pagamento. Tente novamente ou entre em contato.
                </p>
              ) : (
                <p className="text-sm mt-1">
                  Estamos aguardando a confirmacao do Mercado Pago.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-1">Resumo do Pedido #{order.id.slice(0, 8)}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Realizado em {new Date(order.created_at).toLocaleDateString('pt-BR')} — Status Atual: <span className="font-semibold text-gray-700">{ORDER_STATUS_LABELS[order.status] || order.status}</span>
      </p>

      {/* Items */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Itens</h2>
        <div className="bg-white border border-gray-200 rounded-lg divide-y">
          {order.order_items.map(item => (
            <div key={item.id} className="flex justify-between p-3">
              <div>
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-gray-500">{item.quantity}x {formatPrice(item.unit_price)}</p>
              </div>
              <p className="text-sm font-bold">{formatPrice(item.unit_price * item.quantity)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Totals */}
      <section className="mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Frete</span>
            <span>{Number(order.shipping_cost) === 0 ? 'Gratis' : formatPrice(order.shipping_cost)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>

      {/* Shipping address */}
      {addr && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Endereco de Entrega</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
            <p>{addr.street}, {addr.number}{addr.complement ? ` — ${addr.complement}` : ''}</p>
            <p>{addr.neighborhood} — {addr.city}/{addr.state}</p>
            <p>CEP: {addr.cep}</p>
          </div>
        </section>
      )}

      <div className="flex gap-4">
        <Link to="/minha-conta" className="text-blue-600 hover:underline text-sm">Meus pedidos</Link>
        <Link to="/" className="text-blue-600 hover:underline text-sm">Continuar comprando</Link>
      </div>
    </div>
  )
}
