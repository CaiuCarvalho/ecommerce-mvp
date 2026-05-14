import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import Footer from './Footer'

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Loja MVP
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Início</Link>
            <Link to="/sacola" className="text-gray-600 hover:text-gray-900 relative">
              Sacola
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link to="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
                Admin
              </Link>
            )}

            {user ? (
              <>
                <Link to="/minha-conta" className="text-gray-600 hover:text-gray-900">Minha Conta</Link>
                <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700">
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-blue-600 hover:text-blue-800">
                  Entrar
                </Link>
                <Link to="/cadastro" className="text-gray-600 hover:text-gray-900">
                  Cadastro
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
