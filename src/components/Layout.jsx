import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import Footer from './Footer'
import { useTheme } from './ThemeProvider'
import { Moon, Sun, ShoppingBag, User, Settings, LogOut, Bell, Headset } from 'lucide-react'
import { Button } from './ui/Button'
import { motion } from 'framer-motion'
import { slideDown } from '../lib/animations'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/30">
      
      <Sidebar />

      {/* Main Content Area - margin-left on desktop to account for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 relative">
        
        {/* Top Action Bar (Desktop only, mobile has it in sidebar/topbar) */}
        <header className="hidden lg:flex h-20 items-center justify-end px-8 sticky top-0 z-30 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <button className="text-muted-foreground hover:text-primary transition-colors flex flex-col items-center gap-1 group">
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black tracking-widest text-agon-orange uppercase">NOT</span>
            </button>
            <button className="text-muted-foreground hover:text-primary transition-colors flex flex-col items-center gap-1 group">
              <Headset className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black tracking-widest text-agon-orange uppercase">SUP</span>
            </button>
            <Link to={user ? "/minha-conta" : "/login"} className="text-muted-foreground hover:text-primary transition-colors flex flex-col items-center gap-1 group">
              <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black tracking-widest text-agon-orange uppercase">PER</span>
            </Link>

            <div className="h-6 w-px bg-border mx-2" />

            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors bg-secondary rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col pt-20 lg:pt-0">
          <Outlet />
        </main>
        
        <Footer />
      </div>
    </div>
  )
}
