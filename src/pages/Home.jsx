import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import toast from 'react-hot-toast'

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    supabase.from('categories').select('*').order('id').then(({ data }) => {
      setCategories(data || [])
    })
  }, [])

  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      try {
        let query = supabase
          .from('products')
          .select('*, product_images(url, position), categories(name)')
          .eq('is_active', true)
          .eq('stock_status', 'available')
          .order('created_at', { ascending: false })

        if (activeCategory) {
          query = query.eq('category_id', activeCategory)
        }

        const { data, error } = await query

        if (error) {
          console.error('Erro ao carregar produtos:', error)
          toast.error('Erro ao carregar produtos')
        }

        setProducts(data || [])
      } catch (err) {
        console.error('Erro inesperado:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [activeCategory])

  function handleAddToCart(product) {
    const mainImage = product.product_images
      ?.sort((a, b) => a.position - b.position)?.[0]
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: mainImage?.url || null,
    })
    toast.success('Adicionado à sacola!')
  }

  function formatPrice(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Produtos</h1>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-sm border ${!activeCategory ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm border ${activeCategory === cat.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <p className="text-gray-500">Carregando produtos...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => {
            const mainImage = product.product_images
              ?.sort((a, b) => a.position - b.position)?.[0]
            return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Link to={`/produto/${product.id}`}>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {mainImage ? (
                      <img src={mainImage.url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm">Sem imagem</span>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link to={`/produto/${product.id}`}>
                    <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                  </Link>
                  <p className="text-xs text-gray-500 mb-2">{product.categories?.name}</p>
                  <div className="flex items-center gap-2 mb-2">
                    {product.compare_price && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                    )}
                    <span className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Adicionar à Sacola
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
