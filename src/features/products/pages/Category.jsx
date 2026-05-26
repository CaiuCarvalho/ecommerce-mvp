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

  // Fetch the category by slug
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

  // If this is a child category, fetch its parent for breadcrumb
  const { data: parentCategory } = useQuery({
    queryKey: ['categories', 'parent', category?.parent_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', category.parent_id)
        .single()
      if (error) throw error
      return data || null
    },
    enabled: !!category?.parent_id
  })

  // Fetch child categories if this is a parent
  const { data: childCategories = [] } = useQuery({
    queryKey: ['categories', 'children', category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', category.id)
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data || []
    },
    enabled: !!category?.id && !category?.parent_id // only for parent categories
  })

  // Determine which category IDs to fetch products from
  // If parent: this category + all children. If child: only this category.
  const categoryIds = category
    ? category.parent_id
      ? [category.id] // child category: only its own products
      : [category.id, ...childCategories.map(c => c.id)] // parent: include children
    : []

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: queryKeys.products.list({ categoryIds }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(url, position), categories(name, slug)')
        .eq('is_active', true)
        .in('category_id', categoryIds)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: categoryIds.length > 0
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
      <div className="max-w-7xl mx-auto px-4 py-8 mb-20">
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-48 mb-8" />
        <div data-testid="category-loading" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="aspect-[4/5] rounded-md w-full" />
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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center border border-dashed border-border rounded-md mt-8">
        <h1 className="text-heading-md font-semibold mb-4">Categoria não encontrada</h1>
        <Button asChild variant="outline">
          <Link to="/">Voltar para a loja</Link>
        </Button>
      </div>
    )
  }

  const isParent = !category.parent_id

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mb-20">
      <Helmet>
        <title>{category.name} | Agon Imports</title>
        <meta name="description" content={`Produtos da categoria ${category.name}. Encontre as melhores ofertas na Agon Imports.`} />
      </Helmet>
      
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
        <span>/</span>
        {parentCategory ? (
          <>
            <Link to={`/categoria/${parentCategory.slug}`} className="hover:text-foreground transition-colors">
              {parentCategory.name}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{category.name}</span>
          </>
        ) : (
          <span className="text-foreground font-medium">{category.name}</span>
        )}
      </nav>

      <div className="mb-10">
        <h1 className="text-heading-xl md:text-display-sm font-semibold tracking-tight">{category.name}</h1>
      </div>

      {/* Subcategories navigation (only for parent categories with children) */}
      {isParent && childCategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            to={`/categoria/${category.slug}`}
            className="px-4 py-2 text-sm font-medium rounded-full bg-agon-orange text-white transition-colors"
          >
            Todos
          </Link>
          {childCategories.map(child => (
            <Link
              key={child.id}
              to={`/categoria/${child.slug}`}
              className="px-4 py-2 text-sm font-medium rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 border border-border border-dashed rounded-lg">
          <p className="text-muted-foreground">Nenhum produto nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map(product => {
            const mainImage = product.product_images
              ?.sort((a, b) => a.position - b.position)?.[0]
            const catLabel = product.categories?.name || category.name
            return (
              <div key={product.id} className="flex flex-col h-full">
                <Card className="overflow-hidden border border-border bg-card hover:shadow-apple-img transition-all duration-500 group rounded-md h-full flex flex-col">
                  <Link to={`/produto/${product.id}`} className="relative block flex-1 overflow-hidden bg-secondary">
                    {mainImage ? (
                      <img 
                        src={mainImage.url} 
                        alt={product.name} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full aspect-[4/5] flex items-center justify-center bg-secondary">
                        <span className="text-muted-foreground text-xs font-medium">Sem imagem</span>
                      </div>
                    )}
                  </Link>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-agon-orange mb-1 block">
                        {catLabel}
                      </span>
                      <Link to={`/produto/${product.id}`}>
                        <h3 className="text-base font-semibold text-foreground line-clamp-2 transition-colors tracking-tight leading-tight">
                          {product.name}
                        </h3>
                      </Link>
                    </div>
                    
                    <div className="mt-auto pt-2 flex items-end justify-between">
                      <div className="flex flex-col">
                        {product.compare_price && (
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
                        )}
                        <span className="text-lg font-bold text-foreground tracking-tight">{formatPrice(product.price)}</span>
                      </div>
                      
                      {product.stock_status === 'available' ? (
                        <Button
                          size="icon"
                          variant="primary"
                          aria-label="Adicionar"
                          onClick={() => handleAddToCart(product)}
                          className="rounded-full w-8 h-8 shadow-sm transition-transform hover:scale-105"
                        >
                          +
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full font-medium text-muted-foreground border-border bg-secondary">
                          Esgotado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

