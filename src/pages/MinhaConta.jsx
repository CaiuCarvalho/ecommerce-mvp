import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import formatPrice from '../lib/formatPrice'

const STATUS_LABELS = {
  awaiting_payment: 'Aguardando Pagamento',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const STATUS_COLORS = {
  awaiting_payment: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function MinhaConta() {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase
        .from('orders')
        .select('id, status, total, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setOrders(data || [])
      setLoading(false)
    }
    if (user) fetchOrders()
  }, [user])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Helmet>
        <title>Minha Conta | Loja MVP</title>
      </Helmet>
      <h1 className="text-2xl font-bold mb-6">Minha Conta</h1>

      {/* Profile */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Dados Pessoais</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-1">
          <p className="text-sm"><strong>Nome:</strong> {profile?.full_name || '—'}</p>
          <p className="text-sm"><strong>Email:</strong> {user?.email}</p>
          <p className="text-sm"><strong>Telefone:</strong> {profile?.phone || '—'}</p>
        </div>
      </section>

      {/* Orders */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Meus Pedidos</h2>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">Nenhum pedido ainda.</p>
            <Link to="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Explorar produtos</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y">
            {orders.map(order => (
              <Link
                key={order.id}
                to={`/pedido/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
