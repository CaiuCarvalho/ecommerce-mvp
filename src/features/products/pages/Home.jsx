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
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <Helmet>
        <title>Agon Imports | Melhores Produtos com Frete Grátis</title>
        <meta name="description" content="Encontre os melhores produtos em diversas categorias com frete grátis acima de R$100. Utilidades domésticas, ferramentas, beleza, brinquedos e mais." />
      </Helmet>
      
      {/* Hero Banner */}
      <motion.div variants={slideUp} className="mb-10 relative rounded-3xl overflow-hidden shadow-2xl h-64 md:h-80 flex items-center justify-center">
        <div className="absolute inset-0 bg-agon-navy/60 z-10" />
        <img src="/warehouse_hero.png" alt="AGON Imports Warehouse" className="absolute inset-0 w-full h-full object-cover" />
        
        <div className="relative z-20 text-center px-4 w-full max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-black tracking-widest text-white mb-6 uppercase drop-shadow-md">
            Catálogo de Produtos
          </h1>
          <div className="flex bg-white rounded-full p-1.5 max-w-xl mx-auto shadow-xl">
             <input type="text" placeholder="Digite o nome do produto" className="flex-1 bg-transparent border-none px-5 outline-none text-sm font-medium text-agon-navy placeholder:text-gray-400" />
             <Button className="rounded-full px-8 py-3 font-bold tracking-widest text-xs h-auto uppercase">Buscar</Button>
          </div>
        </div>
      </motion.div>

      {/* Category filter */}
      <motion.div variants={slideUp} className="flex flex-wrap justify-center gap-2 mb-10">
        <Button
          variant={!activeCategory ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveCategory(null)}
          className="rounded-full px-4 h-8 transition-all duration-300 uppercase text-[9px] tracking-[0.15em] font-bold"
        >
          Todos
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className="rounded-full px-4 h-8 transition-all duration-300 uppercase text-[9px] tracking-[0.15em] font-bold"
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
                <Skeleton className="aspect-[4/5] rounded-xl w-full" />
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
            className="text-center py-20 border border-border border-dashed rounded-2xl"
          >
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Nenhum item disponível.</p>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {products.map((product, index) => {
              const mainImage = product.product_images
                ?.sort((a, b) => a.position - b.position)?.[0]
              
              // Featured item logic: The first item or items with a certain flag
              const isFeatured = index === 0 && !activeCategory;

              return (
                <motion.div 
                  key={product.id}
                  variants={slideUp}
                  {...hoverScale}
                  className={isFeatured ? "col-span-2 row-span-1 md:col-span-2 md:row-span-2" : ""}
                >
                  <Card className={`overflow-hidden border-none bg-agon-white hover:bg-gray-50 transition-colors group rounded-2xl h-full flex flex-col shadow-sm hover:shadow-md border border-agon-border ${isFeatured ? 'bg-agon-light-bg shadow-xl shadow-agon-orange/10 border-agon-orange/20' : ''}`}>
                    <Link to={`/produto/${product.id}`} className="relative block flex-1 overflow-hidden">
                      {mainImage ? (
                        <img 
                          src={mainImage.url} 
                          alt={product.name} 
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-[8px] uppercase tracking-widest">Sem imagem</span>
                        </div>
                      )}
                      {isFeatured && (
                        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                          Destaque da Coleção
                        </div>
                      )}
                    </Link>
                    <CardContent className={isFeatured ? "p-6" : "p-3.5 flex-1 flex flex-col"}>
                      <div className="mb-2">
                         <span className="text-[8px] font-bold text-primary uppercase tracking-[0.25em]">{product.categories?.name}</span>
                        <Link to={`/produto/${product.id}`}>
                          <h3 className={`${isFeatured ? 'text-2xl' : 'text-xs'} font-bold text-foreground mt-1 line-clamp-2 group-hover:text-primary transition-colors tracking-tight`}>
                            {product.name}
                          </h3>
                        </Link>
                      </div>
                      
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <div className="flex flex-col">
                          {product.compare_price && (
                            <span className="text-[9px] text-muted-foreground line-through opacity-60">{formatPrice(product.compare_price)}</span>
                          )}
                          <span className={`${isFeatured ? 'text-xl' : 'text-sm'} font-black text-foreground tracking-tight`}>{formatPrice(product.price)}</span>
                        </div>
                        
                        {product.stock_status === 'available' ? (
                          <Button
                            size={isFeatured ? "default" : "icon"}
                            variant="primary"
                            aria-label="Adicionar"
                            onClick={() => handleAddToCart(product)}
                            className={isFeatured ? "rounded-full px-6" : "rounded-full w-7 h-7 shadow-lg shadow-primary/10 text-xs"}
                          >
                            {isFeatured ? "Comprar Agora" : "+"}
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[7px] px-2 py-0.5 rounded-full uppercase tracking-widest opacity-60">Esgotado</Badge>
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
