import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../../lib/supabase'
import { useCart } from '../../../contexts/CartContext'
import formatPrice from '../../../lib/formatPrice'
import toast from 'react-hot-toast'
import { Button } from '../../../components/ui/Button'
import { Skeleton } from '../../../components/ui/Skeleton'
import { ChevronRight, Minus, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../lib/queryKeys'

export default function ProductDetail() {
  const { id } = useParams()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  const { data: product, isLoading: loading } = useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), categories(name, slug)')
        .eq('id', id)
        .eq('is_active', true)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      
      if (data) {
        data.product_images = (data.product_images || []).sort((a, b) => a.position - b.position)
      }
      return data || null
    }
  })

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
    return (
      <div data-testid="product-loading" className="max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="h-4 w-48 mb-8 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <Skeleton className="aspect-square rounded-lg w-full" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-10 w-1/3 rounded" />
            <div className="space-y-2 mt-8">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <Skeleton className="h-14 w-full rounded-full mt-8" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center border border-dashed border-border rounded-lg mt-8">
        <h1 className="text-heading-sm font-semibold mb-4">Produto não encontrado</h1>
        <Button asChild variant="outline">
          <Link to="/">Voltar para a loja</Link>
        </Button>
      </div>
    )
  }

  const images = product.product_images || []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 mb-20">
      <Helmet>
        <title>{product.name} | Agon Imports</title>
        <meta name="description" content={product.description ? product.description.slice(0, 160) : `Compre ${product.name} na Loja MVP com frete grátis acima de R$100.`} />
      </Helmet>
      
      <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-1 font-medium">
        <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
        {product.categories && (
          <>
            <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
            <Link to={`/categoria/${product.categories.slug}`} className="hover:text-foreground transition-colors">
              {product.categories.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
        <span className="text-foreground font-semibold truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-secondary rounded-lg overflow-hidden border border-border">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                Sem imagem
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                    idx === selectedImage 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                      : 'opacity-70 hover:opacity-100 border border-border'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-heading-lg font-display font-semibold tracking-tight text-foreground mb-2 leading-tight">{product.name}</h1>

          {product.categories && (
            <p className="text-sm text-agon-orange font-semibold mb-6 tracking-wide uppercase">{product.categories.name}</p>
          )}

          <div className="flex items-baseline gap-3 mb-8">
            {product.compare_price && (
              <span className="text-subheading text-muted-foreground line-through decoration-muted-foreground/50">
                {formatPrice(product.compare_price)}
              </span>
            )}
            <span className="text-display-xl font-display font-bold tracking-tight text-foreground">
              {formatPrice(product.price)}
            </span>
          </div>

          {product.stock_status === 'available' ? (
            <div className="mb-8 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground uppercase tracking-wide">Quantidade</label>
                <div className="flex items-center w-max bg-secondary border border-border rounded-inputs p-1">
                  <Button
                    data-testid="decrease-qty"
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="h-8 w-8 rounded-sm hover:bg-background transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    data-testid="increase-qty"
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(q => q + 1)}
                    className="h-8 w-8 rounded-sm hover:bg-background transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleAddToCart}
                className="w-full text-base h-14 font-bold tracking-wide rounded-full"
              >
                Adicionar à Sacola
              </Button>
            </div>
          ) : (
            <div className="mb-8 py-4 text-center font-semibold text-muted-foreground bg-secondary border border-border rounded-inputs">
              Produto temporariamente esgotado
            </div>
          )}

          <div className="bg-secondary p-4 rounded-inputs border border-border mb-8">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></span>
              {product.price >= 100
                ? 'Frete grátis garantido para este produto'
                : 'Frete: R$ 15,90 (Grátis acima de R$ 100)'}
            </p>
          </div>

          {product.description && (
            <div className="pt-8 border-t border-border mt-auto">
              <h2 className="text-subheading font-semibold text-foreground mb-4">Sobre o produto</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <p className="whitespace-pre-line leading-relaxed text-body-sm">{product.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
