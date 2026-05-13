import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 })

  useEffect(() => {
    async function loadStats() {
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      const { data: orders } = await supabase
        .from('orders')
        .select('total, status')

      const totalOrders = orders?.length || 0
      const revenue = orders
        ?.filter(o => o.status !== 'cancelled')
        ?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0

      setStats({ products: productCount || 0, orders: totalOrders, revenue })
    }

    loadStats()
  }, [])

  function formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Produtos cadastrados</p>
          <p className="text-3xl font-bold mt-1">{stats.products}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Total de pedidos</p>
          <p className="text-3xl font-bold mt-1">{stats.orders}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Receita total</p>
          <p className="text-3xl font-bold mt-1">{formatPrice(stats.revenue)}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          to="/admin/produtos"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          Gerenciar Produtos →
        </Link>
        <Link
          to="/admin/pedidos"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          Ver Pedidos →
        </Link>
      </div>
    </div>
  )
}
