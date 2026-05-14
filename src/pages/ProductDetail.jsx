import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import formatPrice from '../lib/formatPrice'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), categories(name, slug)')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (cancelled) return

      if (error || !data) {
        setProduct(null)
      } else {
        data.product_images = (data.product_images || []).sort((a, b) => a.position - b.position)
        setProduct(data)
      }
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
  }, [id])

  function handleAddToCart() {
    const mainImage = product.product_images?.[0]
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: mainImage?.url || null,
    }, quantity)
    toast.success(`${quantity}x ${product.name} adicionado a sacola!`)
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Carregando...</div>
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Produto nao encontrado</h1>
        <Link to="/" className="text-blue-600 hover:underline">Voltar para a loja</Link>
      </div>
    )
  }

  const images = product.product_images || []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>{product.name} | Loja MVP</title>
        <meta name="description" content={product.description ? product.description.slice(0, 160) : `Compre ${product.name} na Loja MVP com frete grátis acima de R$100.`} />
      </Helmet>
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-700">Inicio</Link>
        {product.categories && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/categoria/${product.categories.slug}`} className="hover:text-gray-700">
              {product.categories.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Sem imagem
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden ${
                    idx === selectedImage ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {product.categories && (
            <p className="text-sm text-gray-500 mb-4">{product.categories.name}</p>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            {product.compare_price && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.compare_price)}
              </span>
            )}
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          </div>

          {product.stock_status === 'available' ? (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-gray-600">Quantidade:</label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-center min-w-[40px]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Adicionar a Sacola
              </button>
            </div>
          ) : (
            <div className="mb-6 py-3 text-center text-gray-500 border border-gray-200 rounded-lg">
              Produto esgotado
            </div>
          )}

          <p className="text-sm text-gray-500">
            {product.price >= 100
              ? 'Frete gratis para este produto'
              : 'Frete: R$ 15,90 (gratis acima de R$ 100)'}
          </p>

          {product.description && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Descricao</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
