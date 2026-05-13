import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import formatPrice from '../../lib/formatPrice'
import toast from 'react-hot-toast'

const STATUS_LABELS = {
  awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

const MP_STATUS_LABELS = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Recusado',
  refunded: 'Estornado',
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [id])

  async function loadOrder() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(full_name, phone), order_items(*, products(name))')
      .eq('id', id)
      .single()

    if (error || !data) {
      toast.error('Pedido nao encontrado')
      navigate('/admin/pedidos')
      return
    }
    setOrder(data)
    setLoading(false)
  }

  async function updateStatus(newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao atualizar status')
      return
    }
    toast.success('Status atualizado')
    loadOrder()
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><p>Carregando...</p></div>
  if (!order) return null

  const address = order.shipping_address || {}
  const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/pedidos')} className="text-gray-500 hover:text-gray-700">
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>{status.label}</span>
        </div>
        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Itens do Pedido</h2>
            <div className="space-y-3">
              {order.order_items?.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-gray-500">{item.quantity}x {formatPrice(item.unit_price)}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : 'Gratis'}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Endereco de Entrega</h2>
            <p className="text-sm text-gray-700">
              {address.street}, {address.number}
              {address.complement && ` - ${address.complement}`}
            </p>
            <p className="text-sm text-gray-700">
              {address.neighborhood} — {address.city}/{address.state}
            </p>
            <p className="text-sm text-gray-500">CEP: {address.cep}</p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Cliente</h2>
            <p className="text-sm font-medium text-gray-900">{order.profiles?.full_name || 'N/A'}</p>
            <p className="text-sm text-gray-500">{order.profiles?.phone || 'Sem telefone'}</p>
            <p className="text-xs text-gray-400 mt-1">ID: {order.user_id?.slice(0, 8)}</p>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Pagamento (MP)</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status MP</dt>
                <dd className="font-medium">{MP_STATUS_LABELS[order.mp_status] || order.mp_status || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">ID Pagamento</dt>
                <dd className="font-mono text-xs">{order.mp_payment_id || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Atualizar Status</h2>
            <select
              value={order.status}
              onChange={e => updateStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </section>
        </div>
      </div>
    </div>
  )
}
