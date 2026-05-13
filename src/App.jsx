import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Sacola from './pages/Sacola'
import ProductDetail from './pages/ProductDetail'
import Category from './pages/Category'

// Admin pages
import Dashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import ProductNew from './pages/admin/ProductNew'
import ProductEdit from './pages/admin/ProductEdit'
import Orders from './pages/admin/Orders'
import OrderDetail from './pages/admin/OrderDetail'

export default function App() {
  return (
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
              <Route path="/sacola" element={<Sacola />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
              <Route path="/categoria/:slug" element={<Category />} />

              {/* Admin */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Dashboard />
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
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
