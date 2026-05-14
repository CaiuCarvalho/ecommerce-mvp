import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useCart } from '../contexts/CartContext'
import formatPrice from '../lib/formatPrice'

export default function Sacola() {
  const { items, removeItem, updateQuantity, subtotal } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Sacola vazia</h1>
        <p className="text-gray-500 mb-6">Adicione produtos para continuar.</p>
        <Link to="/" className="text-blue-600 hover:underline">Ver produtos</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Helmet>
        <title>Sacola | Loja MVP</title>
      </Helmet>
      <h1 className="text-2xl font-bold mb-6">Sacola</h1>

      <div className="space-y-4">
        {items.map(item => (
          <div key={item.product_id} className="flex items-center gap-4 bg-white p-4 border border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">{item.name}</h3>
              <p className="text-sm text-gray-900 font-bold">{formatPrice(item.price)}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                className="w-7 h-7 border rounded text-sm hover:bg-gray-100"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                className="w-7 h-7 border rounded text-sm hover:bg-gray-100"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeItem(item.product_id)}
              className="text-red-500 text-sm hover:underline"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white p-4 border border-gray-200 rounded-lg">
        <div className="flex justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {subtotal >= 100 ? '✓ Frete grátis' : 'Frete: R$ 15,90 (grátis acima de R$ 100)'}
        </p>
        <Link
          to="/checkout"
          className="block mt-4 w-full py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700"
        >
          Finalizar Compra
        </Link>
      </div>
    </div>
  )
}
