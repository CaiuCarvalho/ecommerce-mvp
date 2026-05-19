import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import CookieBanner from './components/CookieBanner'
import { ThemeProvider } from './components/ThemeProvider'
import DesignSystem from './pages/DesignSystem'

// Public pages (carregadas imediatamente no bundle principal)
import Home from './features/products/pages/Home'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Sacola from './features/checkout/pages/Sacola'
import Checkout from './features/checkout/pages/Checkout'
import OrderConfirmation from './features/checkout/pages/OrderConfirmation'
import MinhaConta from './features/auth/pages/MinhaConta'
import ProductDetail from './features/products/pages/ProductDetail'
import Category from './features/products/pages/Category'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfUse from './pages/TermsOfUse'

// Admin pages — lazy loaded (chunk separado, não polui o bundle do cliente)
const Dashboard  = lazy(() => import('./features/admin/pages/Dashboard'))
const Categories = lazy(() => import('./features/admin/pages/Categories'))
const Products   = lazy(() => import('./features/admin/pages/Products'))
const ProductNew = lazy(() => import('./features/admin/pages/ProductNew'))
const ProductEdit= lazy(() => import('./features/admin/pages/ProductEdit'))
const Orders     = lazy(() => import('./features/admin/pages/Orders'))
const OrderDetail= lazy(() => import('./features/admin/pages/OrderDetail'))

// Fallback leve para rotas admin enquanto o chunk carrega
function AdminFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="h-64 w-full bg-muted rounded-2xl" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
              <Toaster position="top-right" />
            <Routes>
              <Route path="/design-system" element={<DesignSystem />} />
              <Route element={<Layout />}>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Register />} />
                <Route path="/recuperar-senha" element={<ForgotPassword />} />
                <Route path="/resetar-senha" element={<ResetPassword />} />
                <Route path="/sacola" element={<Sacola />} />
                <Route path="/produto/:id" element={<ProductDetail />} />
                <Route path="/categoria/:slug" element={<Category />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/pedido/:id" element={<OrderConfirmation />} />
                <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
                <Route path="/termos-de-uso" element={<TermsOfUse />} />
                <Route path="/minha-conta" element={
                  <ProtectedRoute>
                    <MinhaConta />
                  </ProtectedRoute>
                } />

                {/* Admin — chunk separado, carregado apenas por admins */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<AdminFallback />}>
                      <Dashboard />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/categorias" element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<AdminFallback />}>
                      <Categories />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/produtos" element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<AdminFallback />}>
                      <Products />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/produtos/novo" element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<AdminFallback />}>
                      <ProductNew />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/produtos/:id" element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<AdminFallback />}>
                      <ProductEdit />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/pedidos" element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<AdminFallback />}>
                      <Orders />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/admin/pedidos/:id" element={
                  <ProtectedRoute requireAdmin>
                    <Suspense fallback={<AdminFallback />}>
                      <OrderDetail />
                    </Suspense>
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
            <CookieBanner />
          </ThemeProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    </HelmetProvider>
    </QueryClientProvider>
  )
}
