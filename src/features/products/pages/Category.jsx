import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../../lib/supabase'
import { useCart } from '../../../contexts/CartContext'
import formatPrice from '../../../lib/formatPrice'
import toast from 'react-hot-toast'
import { Card, CardContent } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../lib/queryKeys'

export default function Category() {
  const { slug } = useParams()
  const { addItem } = useCart()

  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: queryKeys.categories.bySlug(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data || null
    }
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: queryKeys.products.list({ categoryId: category?.id }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(url, position), categories(name)')
        .eq('is_active', true)
        .eq('category_id', category.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!category?.id
  })

  const loading = loadingCategory || loadingProducts

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
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-48 mb-8" />
        <div data-testid="category-loading" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="aspect-square rounded-2xl w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/4 mt-2" />
                <Skeleton className="h-10 w-full rounded-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center border border-dashed border-border rounded-lg mt-8">
        <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
        <Button asChild variant="outline">
          <Link to="/">Voltar para a loja</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>{category.name} | Agon Imports</title>
        <meta name="description" content={`Produtos da categoria ${category.name}. Encontre as melhores ofertas na Loja MVP com frete grátis acima de R$100.`} />
      </Helmet>
      
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 border border-border border-dashed rounded-lg">
          <p className="text-muted-foreground">Nenhum produto nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => {
            const mainImage = product.product_images
              ?.sort((a, b) => a.position - b.position)?.[0]
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <Link to={`/produto/${product.id}`}>
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {mainImage ? (
                      <img 
                        src={mainImage.url} 
                        alt={product.name} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem imagem</span>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <div className="min-h-[4rem]">
                    <Link to={`/produto/${product.id}`}>
                      <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    {product.compare_price && (
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
                    )}
                    <span className="text-sm font-bold text-foreground">{formatPrice(product.price)}</span>
                  </div>
                  
                  {product.stock_status === 'available' ? (
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      className="w-full"
                    >
                      Adicionar
                    </Button>
                  ) : (
                    <div className="flex justify-center">
                       <Badge variant="outline" className="w-full justify-center py-1.5">Esgotado</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
