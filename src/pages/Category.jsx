import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import formatPrice from '../lib/formatPrice'
import toast from 'react-hot-toast'

export default function Category() {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (cancelled) return

      if (!cat) {
        setCategory(null)
        setLoading(false)
        return
      }

      setCategory(cat)

      const { data: prods } = await supabase
        .from('products')
        .select('*, product_images(url, position), categories(name)')
        .eq('is_active', true)
        .eq('category_id', cat.id)
        .order('created_at', { ascending: false })

      if (cancelled) return

      setProducts(prods || [])
      setLoading(false)
    }
    load()

    function handlePageShow(e) {
      if (e.persisted) load()
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      cancelled = true
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [slug])

  function handleAddToCart(product) {
    const mainImage = product.product_images
      ?.sort((a, b) => a.position - b.position)?.[0]
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: mainImage?.url || null,
    })
    toast.success('Adicionado a sacola!')
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Carregando...</div>
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Categoria nao encontrada</h1>
        <Link to="/" className="text-blue-600 hover:underline">Voltar para a loja</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>{category.name} | Loja MVP</title>
        <meta name="description" content={`Produtos da categoria ${category.name}. Encontre as melhores ofertas na Loja MVP com frete grátis acima de R$100.`} />
      </Helmet>
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-gray-700">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{category.name}</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">{category.name}</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">Nenhum produto nesta categoria.</p>
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
                  <div className="flex items-center gap-2 mb-2">
                    {product.compare_price && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                    )}
                    <span className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>
                  </div>
                  {product.stock_status === 'available' ? (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Adicionar a Sacola
                    </button>
                  ) : (
                    <span className="block w-full py-1.5 text-xs text-center text-gray-400 border border-gray-200 rounded">
                      Esgotado
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
