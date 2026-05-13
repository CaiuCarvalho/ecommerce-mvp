import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext({})

const CART_KEY = 'ecommerce_cart'

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  function addItem(product, qty = 1) {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i
        )
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        quantity: qty,
      }]
    })
  }

  function removeItem(productId) {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) return removeItem(productId)
    setItems(prev => prev.map(i =>
      i.product_id === productId ? { ...i, quantity } : i
    ))
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
