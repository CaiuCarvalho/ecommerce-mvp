import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import formatPrice from '../../../lib/formatPrice'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').order('id').then(({ data }) => {
      setCategories(data || [])
    })
  }, [])

  useEffect(() => {
    loadProducts()
  }, [filterCategory, filterStatus])

  async function loadProducts() {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, product_images(url, position), categories(name)')
      .order('created_at', { ascending: false })

    if (filterCategory) query = query.eq('category_id', parseInt(filterCategory))
    if (filterStatus === 'active') query = query.eq('is_active', true)
    if (filterStatus === 'inactive') query = query.eq('is_active', false)
    if (filterStatus === 'out_of_stock') query = query.eq('stock_status', 'out_of_stock')

    const { data } = await query
    setProducts(data || [])
    setLoading(false)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link
          to="/admin/produtos/novo"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          + Novo Produto
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas categorias</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="out_of_stock">Sem estoque</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">Nenhum produto encontrado</p>
          <Link to="/admin/produtos/novo" className="text-blue-600 hover:underline text-sm">
            Criar primeiro produto
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Produto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Preço</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estoque</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(product => {
                const mainImage = product.product_images
                  ?.sort((a, b) => a.position - b.position)?.[0]
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                          {mainImage ? (
                            <img src={mainImage.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">—</div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[200px]">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.categories?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        product.stock_status === 'available'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stock_status === 'available' ? 'Disponível' : 'Esgotado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        product.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span className="ml-1.5 text-gray-600">
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/produtos/${product.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        {filtered.length} produto(s) encontrado(s)
      </p>
    </div>
  )
}
