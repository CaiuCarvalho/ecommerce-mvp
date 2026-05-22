import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, User, Menu, Headset, Bell, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export default function Header({ onOpenSidebar }) {
  const { user, isAdmin } = useAuth()
  const { totalItems } = useCart()
  const location = useLocation()

  const navLinks = [
    { name: 'Catálogo', path: '/' },
    { name: 'Suporte', path: '/suporte' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Mobile: Hamburger Menu */}
        <div className="flex lg:hidden flex-1">
          <button 
            onClick={onOpenSidebar}
            className="p-2 -ml-2 text-foreground hover:bg-muted rounded-md transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex justify-center lg:justify-start flex-1 lg:flex-none">
          <Link to="/" className="flex flex-col items-center group">
            <span className="text-xl font-black tracking-widest uppercase text-foreground group-hover:text-agon-orange transition-colors">
              AGON
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className={`transition-colors hover:text-agon-orange ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center justify-end flex-1 gap-2 lg:gap-4">
          <Link 
            to="/sacola" 
            className="p-2 text-foreground hover:bg-muted rounded-md transition-colors relative"
            aria-label="Sacola de compras"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-agon-orange text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
          
          {isAdmin && (
            <Link 
              to="/admin" 
              className="hidden lg:flex p-2 text-foreground hover:bg-muted rounded-md transition-colors"
              aria-label="Painel Admin"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}

          <Link 
            to={user ? "/minha-conta" : "/login"} 
            className="hidden lg:flex p-2 text-foreground hover:bg-muted rounded-md transition-colors"
            aria-label="Minha conta"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
        
      </div>
    </header>
  )
}
