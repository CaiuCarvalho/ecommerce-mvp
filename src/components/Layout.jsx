import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import Footer from './Footer'
import { useTheme } from './ThemeProvider'
import { Moon, Sun, ShoppingBag, User, Settings, LogOut } from 'lucide-react'
import { Button } from './ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { slideDown } from '../lib/animations'
import { useEffect, useState } from 'react'

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Human-Crafted Elements */}
      <div className="grain-overlay" />
      <motion.div 
        className="custom-cursor hidden md:block"
        animate={{ x: mousePos.x - 10, y: mousePos.y - 10 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150, mass: 0.5 }}
      />

      <motion.header 
        initial="initial"
        animate="animate"
        variants={slideDown}
        className="sticky top-2 z-50 w-full px-4"
      >
        <div className="max-w-4xl mx-auto glass-dark rounded-full px-5 h-11 flex items-center justify-between shadow-xl shadow-black/10">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-[10px] group-hover:scale-110 transition-transform">
              A
            </div>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase group-hover:opacity-80 transition-opacity">
              Agon Imports
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Início</Link>

            <Link to="/sacola" className="text-muted-foreground hover:text-foreground transition-colors relative flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              Sacola
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-primary text-primary-foreground text-[7px] w-3 h-3 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link to="/admin" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            )}

            <div className="h-4 w-px bg-white/10" />

            {user ? (
              <div className="flex items-center gap-6">
                <Link to="/minha-conta" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Conta
                </Link>
                <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
                <Link to="/cadastro" className="bg-white text-black px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors">
                  Criar Conta
                </Link>
              </div>
            )}

            <button
              className="p-2 text-muted-foreground hover:text-white transition-colors"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </nav>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col mt-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
