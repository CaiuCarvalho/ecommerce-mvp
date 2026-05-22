import { useState } from 'react'
import { Link } from 'react-router-dom'
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

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="max-w-6xl mx-auto px-4 py-8 mb-20"
    >
      <Helmet>
        <title>Agon Imports | Melhores Produtos</title>
        <meta name="description" content="Encontre os melhores produtos em diversas categorias com frete grátis acima de R$100." />
      </Helmet>
      
      {/* Clean Apple-style Hero Banner */}
      <motion.div variants={slideUp} className="mb-16 mt-8 md:mt-16 text-center flex flex-col items-center justify-center">
        <h1 className="text-display-xl md:text-display-giant font-display font-semibold text-foreground mb-4 max-w-4xl tracking-tight">
          O melhor da utilidade e inovação para o seu <span className="text-agon-orange">dia a dia.</span>
        </h1>
        <p className="text-subheading text-muted-foreground max-w-2xl mx-auto mb-8 font-sans">
          Produtos selecionados rigorosamente para garantir qualidade, design e um excelente custo-benefício. Entregamos para todo o Brasil.
        </p>
        <div className="flex items-center gap-4">
           <Button size="lg" className="rounded-full px-8" onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}>
             Ver Ofertas
           </Button>
           <Button variant="outline" size="lg" className="rounded-full px-8 text-foreground" onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}>
             Categorias
           </Button>
        </div>
      </motion.div>

      {/* Category filter */}
      <motion.div variants={slideUp} className="hidden md:flex flex-wrap justify-center gap-3 mb-12">
        <Button
          variant={!activeCategory ? "secondary" : "ghost"}
          onClick={() => setActiveCategory(null)}
          className={`rounded-full px-5 h-10 transition-all duration-300 font-medium text-sm ${!activeCategory ? 'bg-foreground text-background hover:bg-foreground/90' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          Todos os Produtos
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "secondary" : "ghost"}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-full px-5 h-10 transition-all duration-300 font-medium text-sm ${activeCategory === cat.id ? 'bg-foreground text-background hover:bg-foreground/90' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            {cat.name}
          </Button>
        ))}
      </motion.div>

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
        ) : products.length === 0 ? (
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
            {products.map((product, index) => {
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
    </motion.div>
  )
}
