import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Store,
  Wallet,
  Headset,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  Settings
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useTheme } from './ThemeProvider'
import { Button } from './ui/Button'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { user, isAdmin, signOut } = useAuth()
  const { totalItems } = useCart()

  // Fechar sidebar ao mudar de rota no mobile
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const menuItems = [
    { name: 'Catálogo de Produtos', path: '/', icon: Store },
    { name: 'Minha Sacola', path: '/sacola', icon: ShoppingBag, badge: totalItems > 0 ? totalItems : null },
    { name: 'Minha Conta', path: '/minha-conta', icon: Wallet },
    { name: 'Suporte', path: '/suporte', icon: Headset },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-agon-navy text-white">
      {/* Logo */}
      <div className="p-6 pb-10 flex items-center justify-center">
        <Link to="/" className="flex flex-col items-center gap-2 group">
          <svg width="80" height="40" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-agon-orange group-hover:scale-105 transition-transform">
            <path d="M10,40 Q30,10 50,40 Q70,20 90,40" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="75" cy="25" r="4" fill="currentColor" />
          </svg>
          <span className="text-2xl font-black tracking-widest uppercase mt-2">AGON</span>
        </Link>
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
          const Icon = item.icon
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold uppercase text-xs tracking-wider ${
                isActive 
                  ? 'bg-agon-orange text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-agon-navy-light'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-white text-agon-orange w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold uppercase text-xs tracking-wider text-gray-400 hover:text-white hover:bg-agon-navy-light mt-4 border border-white/10"
          >
            <Settings className="w-5 h-5" />
            <span>Painel Admin</span>
          </Link>
        )}
      </nav>

      {/* Footer da Sidebar */}
      <div className="p-6">
        {user ? (
           <Button 
            variant="outline" 
            onClick={signOut}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        ) : (
          <Button 
            className="w-full bg-white text-agon-navy hover:bg-gray-100 font-bold uppercase tracking-wider text-xs py-3 rounded-full"
            asChild
          >
            <Link to="/cadastro">Crie um Cadastro</Link>
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-50 bg-agon-navy">
        <SidebarContent />
      </aside>

      {/* Mobile Topbar & Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-agon-navy z-40 flex items-center justify-between px-4">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-white hover:bg-white/10 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-white font-black tracking-widest text-lg">AGON</span>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm z-50 bg-agon-navy lg:hidden shadow-2xl"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
