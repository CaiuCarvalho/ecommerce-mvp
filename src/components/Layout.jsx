import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      
      {/* Header Fixo Global */}
      <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

      {/* Sidebar Controlada Pelo Layout */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full relative">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  )
}
