import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useCart } from '../../../contexts/CartContext'
import formatPrice from '../../../lib/formatPrice'
import { Card, CardContent } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

export default function Sacola() {
  const { items, removeItem, updateQuantity, subtotal } = useCart()

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-20">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Sua sacola está vazia</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          Você ainda não adicionou nenhum produto. Continue navegando para encontrar o que procura.
        </p>
        <Button asChild size="lg">
          <Link to="/">Explorar Produtos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <Helmet>
        <title>Sua Sacola | Agon Imports</title>
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sua Sacola</h1>
        <p className="text-muted-foreground mt-1">Revise seus itens antes do checkout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <Card key={item.product_id} data-testid="cart-item" className="overflow-hidden">
              <div className="flex flex-col sm:flex-row p-4 gap-4 items-start sm:items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border border-border">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-foreground line-clamp-2 mb-1">{item.name}</h3>
                  <p className="text-lg font-bold text-foreground">{formatPrice(item.price)}</p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                  <div className="flex items-center border border-border rounded-md bg-muted/30">
                    <Button
                      data-testid="decrease-cart-qty"
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="h-8 w-8 rounded-none hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      data-testid="increase-cart-qty"
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="h-8 w-8 rounded-none hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <Button
                    data-testid="remove-cart-item"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.product_id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Remover item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 border-b border-border pb-4">Resumo do Pedido</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({items.length} itens)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Frete</span>
                  <span className={subtotal >= 100 ? "text-green-500 font-medium" : ""}>
                    {subtotal >= 100 ? 'Grátis' : 'R$ 15,90'}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {formatPrice(subtotal + (subtotal >= 100 ? 0 : 15.90))}
                  </span>
                </div>
                {subtotal < 100 && (
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    Faltam {formatPrice(100 - subtotal)} para frete grátis
                  </p>
                )}
              </div>
              
              <Button asChild size="lg" className="w-full text-base">
                <Link to="/checkout">
                  Continuar para o Checkout
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
