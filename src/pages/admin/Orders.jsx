import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import formatPrice from '../../lib/formatPrice'

const STATUS_LABELS = {
  awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, profiles(full_name, phone), order_items(*, products(name))')
      .order('created_at', { ascending: false })

    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(orderId, newStatus) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    loadOrders()
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8"><p>Carregando pedidos...</p></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">Nenhum pedido ainda.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
            const address = order.shipping_address || {}
            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-mono text-gray-400">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm font-medium">{order.profiles?.full_name || 'Cliente'}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="text-lg font-bold mt-1">{formatPrice(order.total)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-100 pt-3 mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Itens:</p>
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-700">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>{formatPrice(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Frete</span>
                    <span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : 'Grátis'}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="border-t border-gray-100 pt-3 mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Endereço:</p>
                  <p className="text-sm text-gray-700">
                    {address.street}, {address.number} {address.complement ? `- ${address.complement}` : ''}
                    <br />{address.neighborhood} — {address.city}/{address.state} — CEP: {address.cep}
                  </p>
                </div>

                {/* Status update */}
                <div className="border-t border-gray-100 pt-3 flex items-center gap-3">
                  <label className="text-xs text-gray-500">Atualizar status:</label>
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="awaiting_payment">Aguardando Pagamento</option>
                    <option value="processing">Processando</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
