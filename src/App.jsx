import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import CookieBanner from './components/CookieBanner'

// Public pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Sacola from './pages/Sacola'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import MinhaConta from './pages/MinhaConta'
import ProductDetail from './pages/ProductDetail'
import Category from './pages/Category'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfUse from './pages/TermsOfUse'

// Admin pages
import Dashboard from './pages/admin/Dashboard'
import Categories from './pages/admin/Categories'
import Products from './pages/admin/Products'
import ProductNew from './pages/admin/ProductNew'
import ProductEdit from './pages/admin/ProductEdit'
import Orders from './pages/admin/Orders'
import OrderDetail from './pages/admin/OrderDetail'

export default function App() {
  return (
    <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" />
          <Routes>
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

              {/* Admin */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/categorias" element={
                <ProtectedRoute requireAdmin>
                  <Categories />
                </ProtectedRoute>
              } />
              <Route path="/admin/produtos" element={
                <ProtectedRoute requireAdmin>
                  <Products />
                </ProtectedRoute>
              } />
              <Route path="/admin/produtos/novo" element={
                <ProtectedRoute requireAdmin>
                  <ProductNew />
                </ProtectedRoute>
              } />
              <Route path="/admin/produtos/:id" element={
                <ProtectedRoute requireAdmin>
                  <ProductEdit />
                </ProtectedRoute>
              } />
              <Route path="/admin/pedidos" element={
                <ProtectedRoute requireAdmin>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/admin/pedidos/:id" element={
                <ProtectedRoute requireAdmin>
                  <OrderDetail />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
          <CookieBanner />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    </HelmetProvider>
  )
}
