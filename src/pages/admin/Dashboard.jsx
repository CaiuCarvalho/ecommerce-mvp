import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import formatPrice from '../../lib/formatPrice'

const STATUS_LABELS = {
  awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

function getDateRange(period) {
  const now = new Date()
  const start = new Date(now)

  if (period === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    start.setMonth(now.getMonth() - 1)
  }

  return start.toISOString()
}

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ count }, { data: allOrders }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('id, status, total, created_at, profiles(full_name)').order('created_at', { ascending: false }),
      ])

      setProductCount(count || 0)
      setOrders(allOrders || [])
      setLoading(false)
    }
    load()
  }, [])

  function calcStats(period) {
    const since = getDateRange(period)
    const filtered = orders.filter(o => o.created_at >= since && o.status !== 'cancelled')
    const count = orders.filter(o => o.created_at >= since).length
    const revenue = filtered.reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
    return { count, revenue }
  }

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const recentOrders = orders.slice(0, 10)

  const today = calcStats('today')
  const week = calcStats('week')
  const month = calcStats('month')

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8"><p>Carregando...</p></div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Produtos cadastrados</p>
          <p className="text-3xl font-bold mt-1">{productCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Hoje</p>
          <p className="text-2xl font-bold mt-1">{today.count} <span className="text-sm font-normal text-gray-400">pedidos</span></p>
          <p className="text-sm text-green-600 font-medium">{formatPrice(today.revenue)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Ultimos 7 dias</p>
          <p className="text-2xl font-bold mt-1">{week.count} <span className="text-sm font-normal text-gray-400">pedidos</span></p>
          <p className="text-sm text-green-600 font-medium">{formatPrice(week.revenue)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Ultimos 30 dias</p>
          <p className="text-2xl font-bold mt-1">{month.count} <span className="text-sm font-normal text-gray-400">pedidos</span></p>
          <p className="text-sm text-green-600 font-medium">{formatPrice(month.revenue)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
          <div key={key} className={`px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
            {label}: {statusCounts[key] || 0}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Pedidos recentes</h2>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-500 text-sm">Nenhum pedido ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-2 font-medium text-gray-600">Pedido</th>
                <th className="text-left px-5 py-2 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-5 py-2 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-2 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map(order => {
                const s = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2">
                      <Link to={`/admin/pedidos/${order.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-2 text-gray-700">{order.profiles?.full_name || 'Cliente'}</td>
                    <td className="px-5 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-2 text-right font-medium">{formatPrice(order.total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex gap-4">
        <Link to="/admin/produtos" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          Gerenciar Produtos
        </Link>
        <Link to="/admin/pedidos" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          Ver Todos os Pedidos
        </Link>
      </div>
    </div>
  )
}
