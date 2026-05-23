import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../../lib/supabase'
import { useCart } from '../../../contexts/CartContext'
import toast from 'react-hot-toast'
import formatPrice from '../../../lib/formatPrice'
import { Card, CardContent } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../../lib/queryKeys'
import { motion, AnimatePresence } from 'framer-motion'
import { slideUp, staggerContainer, fadeIn, hoverScale } from '../../../lib/animations'

export default function Home() {
  const [activeCategory, setActiveCategory] = useState(null)
  const { addItem } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('id')
      if (error) throw error
      return data || []
    }
  })

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.products.list({ activeCategory }),
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, product_images(url, position), categories(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (activeCategory) {
        query = query.eq('category_id', activeCategory)
      }

      const { data, error } = await query
      if (error) {
        toast.error('Erro ao carregar produtos')
        throw error
      }
      return data || []
    }
  })

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

  // Filter products by search query (client-side)
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products
    const q = searchQuery.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    )
  }, [products, searchQuery])

  function clearSearch() {
    setSearchParams({})
  }

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="w-full pb-20 bg-background"
    >
      <Helmet>
        <title>Agon Imports | Melhores Produtos</title>
        <meta name="description" content="Encontre os melhores produtos em diversas categorias com frete grátis acima de R$100." />
      </Helmet>
      
      {/* Search Results Banner or Hero */}
      {searchQuery ? (
        <div className="max-w-[1400px] mx-auto px-4 pt-8">
          <motion.div variants={slideUp} className="mb-10 mt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-secondary/60 border border-border rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">Resultados para:</p>
                <h1 className="text-heading-lg font-semibold tracking-tight text-foreground">"{searchQuery}"</h1>
                <p className="text-sm text-muted-foreground mt-1">{filteredProducts.length} produto(s) encontrado(s)</p>
              </div>
              <Button variant="outline" onClick={clearSearch} className="rounded-full px-6 flex-shrink-0">
                Limpar busca
              </Button>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Amazon-style Full-width Banner */}
          <div className="relative w-full h-[300px] md:h-[450px] lg:h-[550px] bg-agon-navy overflow-hidden">
            {/* Imagem de fundo do banner (placeholder) */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop')" }}
            />
            {/* Gradiente para mesclar com o fundo da página */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-agon-navy/80 via-transparent to-transparent" />
            
            {/* Conteúdo do Banner (Opcional, texto chamativo) */}
            <div className="absolute top-1/4 left-0 w-full max-w-[1400px] mx-auto px-8 md:px-12 flex flex-col items-start z-10 pointer-events-none">
              <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg mb-2 max-w-lg leading-tight tracking-tight">
                Super Ofertas e <span className="text-agon-orange">Lançamentos</span>
              </h2>
              <p className="text-white/90 text-lg md:text-xl font-medium drop-shadow-md max-w-md">
                Tudo o que você precisa com frete grátis para todo o Brasil.
              </p>
            </div>
          </div>
        </>
      )}

      {/* AMAZON-STYLE SECTIONS */}
      {!searchQuery && products.length > 0 && (
        <motion.div variants={slideUp} className="max-w-[1400px] mx-auto px-4 relative z-20 -mt-24 md:-mt-40 lg:-mt-64 mb-12">
          {/* Highlight Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            
            {/* Card 1: 4 Products (2x2) */}
            <Card className="bg-card border-border overflow-hidden rounded-md flex flex-col h-[380px]">
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-foreground mb-4">Destaques em Tecnologia</h3>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  {products.slice(0, 4).map((p, i) => {
                    const img = p.product_images?.sort((a, b) => a.position - b.position)?.[0]
                    return (
                      <Link key={i} to={`/produto/${p.id}`} className="flex flex-col group h-full">
                        <div className="flex-1 bg-secondary rounded-sm overflow-hidden mb-1 flex items-center justify-center p-2">
                           {img ? <img src={img.url} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" /> : <span className="text-[10px] text-muted-foreground">Sem Img</span>}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">{p.name.split(' ')[0]}</span>
                      </Link>
                    )
                  })}
                </div>
                <Link to="/" className="text-action-interactive hover:text-action-blue-hover text-sm font-medium mt-4">Ver mais</Link>
              </CardContent>
            </Card>

            {/* Card 2: Single Promo */}
            <Card className="bg-card border-border overflow-hidden rounded-md flex flex-col h-[380px]">
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-foreground mb-4 leading-tight">Oferta Exclusiva</h3>
                {products[4] && (
                  <Link to={`/produto/${products[4].id}`} className="flex-1 flex flex-col group">
                    <div className="flex-1 bg-secondary rounded-sm overflow-hidden flex items-center justify-center p-4 relative">
                      <Badge className="absolute top-2 left-2 bg-destructive text-white border-none">15% OFF</Badge>
                      {products[4].product_images?.[0] && <img src={products[4].product_images[0].url} alt={products[4].name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />}
                    </div>
                    <span className="text-sm font-medium text-foreground mt-3 line-clamp-2">{products[4].name}</span>
                  </Link>
                )}
                <Link to="/" className="text-action-interactive hover:text-action-blue-hover text-sm font-medium mt-4">Comprar agora</Link>
              </CardContent>
            </Card>

            {/* Card 3: 4 Products (2x2) */}
            <Card className="bg-card border-border overflow-hidden rounded-md flex flex-col h-[380px]">
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-foreground mb-4 leading-tight">Mais Buscados</h3>
                <div className="grid grid-cols-2 gap-2 flex-1">
                  {products.slice(2, 6).map((p, i) => {
                    const img = p.product_images?.sort((a, b) => a.position - b.position)?.[0]
                    return (
                      <Link key={i} to={`/produto/${p.id}`} className="flex flex-col group h-full">
                        <div className="flex-1 bg-secondary rounded-sm overflow-hidden mb-1 flex items-center justify-center p-2">
                           {img ? <img src={img.url} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" /> : <span className="text-[10px] text-muted-foreground">Sem Img</span>}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">{p.name.split(' ')[0]}</span>
                      </Link>
                    )
                  })}
                </div>
                <Link to="/" className="text-action-interactive hover:text-action-blue-hover text-sm font-medium mt-4">Explorar catálogo</Link>
              </CardContent>
            </Card>

            {/* Card 4: Single Promo */}
            <Card className="bg-card border-border overflow-hidden rounded-md flex flex-col h-[380px]">
              <CardContent className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-foreground mb-4 leading-tight">Frete Grátis AGON</h3>
                {products[0] && (
                  <Link to={`/produto/${products[0].id}`} className="flex-1 flex flex-col group">
                    <div className="flex-1 bg-secondary rounded-sm overflow-hidden flex items-center justify-center p-4">
                      {products[0].product_images?.[0] && <img src={products[0].product_images[0].url} alt={products[0].name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" />}
                    </div>
                    <span className="text-sm font-medium text-foreground mt-3 line-clamp-2">{products[0].name}</span>
                  </Link>
                )}
                <Link to="/" className="text-action-interactive hover:text-action-blue-hover text-sm font-medium mt-4">Veja mais produtos</Link>
              </CardContent>
            </Card>
          </div>

          {/* Horizontal Carousel Section */}
          <div className="bg-card border border-border rounded-md p-5 mb-12">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Mais Vendidos</h2>
              <Link to="/" className="text-sm text-action-interactive hover:text-action-blue-hover font-medium">Ver todos</Link>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {products.slice(0, 10).map((product) => {
                const img = product.product_images?.sort((a, b) => a.position - b.position)?.[0]
                return (
                  <Link 
                    key={product.id} 
                    to={`/produto/${product.id}`}
                    className="flex-none w-[160px] flex flex-col group snap-start"
                  >
                    <div className="bg-secondary rounded-md aspect-square mb-3 flex items-center justify-center overflow-hidden p-2">
                      {img ? (
                        <img src={img.url} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                         <span className="text-[10px] text-muted-foreground">Sem Foto</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-agon-orange mb-1 block truncate">
                       {product.categories?.name}
                    </span>
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1 group-hover:text-action-interactive transition-colors leading-tight">
                      {product.name}
                    </h4>
                    <span className="text-base font-bold text-foreground mt-auto">
                      {formatPrice(product.price)}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Product Grid Title (if not searching) */}
      <div className="max-w-[1400px] mx-auto px-4">
        {!searchQuery && (
          <h2 className="text-2xl font-bold text-foreground mb-6 pl-1 border-l-4 border-agon-orange">Todos os Produtos</h2>
        )}

        {/* Product grid */}
        <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            data-testid="home-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[4/5] rounded-lg w-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredProducts.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border border-border border-dashed rounded-md"
          >
            <p className="text-muted-foreground text-sm font-medium">Nenhum item disponível.</p>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {filteredProducts.map((product, index) => {
              const mainImage = product.product_images
                ?.sort((a, b) => a.position - b.position)?.[0]
              
              // Featured logic removed for a cleaner uniform grid typical of Apple Store
              return (
                <motion.div 
                  key={product.id}
                  variants={slideUp}
                  {...hoverScale}
                  className="flex flex-col h-full"
                >
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
                          <span className="text-muted-foreground text-xs font-medium">Sem Imagem</span>
                        </div>
                      )}
                    </Link>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="mb-3">
                         <span className="text-xs font-semibold text-agon-orange mb-1 block">
                           {product.categories?.name}
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
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  )
}
