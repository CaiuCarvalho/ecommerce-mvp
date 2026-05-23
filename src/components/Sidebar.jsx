import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Store,
  Wallet,
  Headset,
  X,
  LogOut,
  Settings,
  ChevronDown,
  Tag
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { Button } from './ui/Button'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { supabase } from '../lib/supabase'

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { user, isAdmin, signOut } = useAuth()
  const { totalItems } = useCart()
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.active(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data || []
    }
  })

  const menuItems = [
    { name: 'Catálogo de Produtos', path: '/', icon: Store },
    { name: 'Minha Sacola', path: '/sacola', icon: ShoppingBag, badge: totalItems > 0 ? totalItems : null },
    { name: 'Minha Conta', path: '/minha-conta', icon: Wallet },
    { name: 'Suporte', path: '/suporte', icon: Headset },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-agon-navy text-white">
      {/* Logo */}
      <div className="p-6 pb-10 flex items-center justify-center relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="w-6 h-6" />
        </button>
        <Link to="/" onClick={onClose} className="flex flex-col items-center leading-none group mt-4">
          <span className="text-2xl font-black tracking-widest uppercase text-agon-orange group-hover:brightness-110 transition-all">
            AGON
          </span>
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/90 group-hover:text-agon-orange transition-all mt-1">
            IMPORTS
          </span>
        </Link>
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
          const Icon = item.icon
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
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

        <div className="mt-2">
          <button
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors font-bold uppercase text-xs tracking-wider text-gray-400 hover:text-white hover:bg-agon-navy-light`}
          >
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5" />
              <span>Categorias</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isCategoriesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col pl-12 pr-4 py-2 space-y-3 mt-1 bg-agon-navy-light/30 rounded-xl">
                  {categories.map(cat => (
                    <Link
                      key={cat.id}
                      to={`/categoria/${cat.slug}`}
                      onClick={onClose}
                      className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isAdmin && (
          <Link
            to="/admin"
            onClick={onClose}
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
            onClick={() => {
              signOut()
              onClose()
            }}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        ) : (
          <Button 
            className="w-full bg-white text-agon-navy hover:bg-gray-100 font-bold uppercase tracking-wider text-xs py-3 rounded-full"
            onClick={onClose}
            asChild
          >
            <Link to="/cadastro">Crie um Cadastro</Link>
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Escuro */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          />
          {/* Menu Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-3/4 max-w-sm z-50 bg-agon-navy lg:hidden shadow-2xl"
          >
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
