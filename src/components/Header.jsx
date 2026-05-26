import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import CepModal from './CepModal'
import { ShoppingCart, Search, MapPin, Menu, User, ChevronDown, Package, Settings, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { supabase } from '../lib/supabase'

export default function Header({ onOpenSidebar }) {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { items: cartItems, totalItems, subtotal, removeItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isTodosDropdownOpen, setIsTodosDropdownOpen] = useState(false)
  const [isCepModalOpen, setIsCepModalOpen] = useState(false)
  const [guestAddress, setGuestAddress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('guest_address')) } catch { return null }
  })

  // Sincroniza o select de categorias com a URL ativa
  const match = location.pathname.match(/^\/categoria\/([^/]+)/)
  const currentCategorySlug = match ? match[1] : 'all'

  function handleCategoryChange(val) {
    if (val === 'all') {
      navigate('/')
    } else {
      navigate(`/categoria/${val}`)
    }
  }

  // Fetch categories for bottom bar
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

  // Organize into hierarchy
  const parentCategories = categories.filter(c => !c.parent_id)
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId)

  // Fetch favorite address for logged-in user
  const { data: favoriteAddress } = useQuery({
    queryKey: ['addresses', 'favorite', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data || null
    },
    enabled: !!user?.id,
  })

  function handleSearch(e) {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      navigate(`/?q=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/')
    }
  }

  const activeAddress = favoriteAddress || guestAddress
  const locationText = activeAddress
    ? `${activeAddress.city}, ${activeAddress.state} ${activeAddress.cep}`
    : null

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* ======= TOP BAR ======= */}
      <div className="bg-agon-navy text-white">
        <div className="container mx-auto px-3 md:px-4 h-[60px] flex items-center gap-3 md:gap-4">

          {/* Mobile Hamburger */}
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group mr-1 md:mr-3 flex flex-col items-start justify-center leading-none">
            <span className="text-xl md:text-2xl font-black tracking-widest uppercase text-agon-orange group-hover:brightness-110 transition-all">
              AGON
            </span>
            <span className="text-[9px] md:text-[10px] font-bold tracking-[0.25em] uppercase text-white/90 group-hover:text-agon-orange transition-all -mt-0.5 self-stretch text-left">
              IMPORTS
            </span>
          </Link>

          {/* Location / CEP */}
          <button
            type="button"
            onClick={() => setIsCepModalOpen(true)}
            className="hidden md:flex items-end gap-1 hover:outline hover:outline-1 hover:outline-white/40 rounded px-2 py-1.5 transition-all flex-shrink-0 min-w-0"
          >
            <MapPin className="w-4 h-4 text-white/70 flex-shrink-0 mb-0.5" />
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[11px] text-gray-400 leading-tight truncate">
                {user ? 'Enviar para' : 'Informe seu'}
              </span>
              <span className="text-[13px] font-bold leading-tight truncate">
                {locationText || (user ? 'Adicionar CEP' : 'CEP')}
              </span>
            </div>
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 flex h-[38px] min-w-0">
            {/* Category select — custom dropdown */}
            <div className="hidden lg:block relative border-r border-gray-300 h-full">
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="h-full flex items-center bg-gray-100 px-3 hover:bg-gray-200 transition-colors text-xs text-gray-700 font-medium gap-1 whitespace-nowrap rounded-l-md"
              >
                <span>{categories.find(cat => cat.slug === currentCategorySlug)?.name || 'Todos'}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              {/* Menu Dropdown */}
              {isCategoryDropdownOpen && (
                <>
                  {/* Overlay invisível para fechar ao clicar fora */}
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setIsCategoryDropdownOpen(false)}
                  />
                  <ul className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 text-left max-h-80 overflow-y-auto">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          handleCategoryChange('all')
                          setIsCategoryDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-100 transition-colors ${
                          currentCategorySlug === 'all' ? 'text-agon-orange font-bold' : 'text-gray-700'
                        }`}
                      >
                        Todos
                      </button>
                    </li>
                    {parentCategories.map(parent => {
                      const children = getChildren(parent.id)
                      return (
                        <li key={parent.id}>
                          <div className="border-t border-gray-100 my-0.5" />
                          <button
                            type="button"
                            onClick={() => {
                              handleCategoryChange(parent.slug)
                              setIsCategoryDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-gray-100 transition-colors ${
                              currentCategorySlug === parent.slug ? 'text-agon-orange' : 'text-gray-800'
                            }`}
                          >
                            {parent.name}
                          </button>
                          {children.map(child => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => {
                                handleCategoryChange(child.slug)
                                setIsCategoryDropdownOpen(false)
                              }}
                              className={`w-full text-left pl-7 pr-4 py-1.5 text-xs hover:bg-gray-100 transition-colors ${
                                currentCategorySlug === child.slug ? 'text-agon-orange font-bold' : 'text-gray-600'
                              }`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar na Agon"
              className="flex-1 px-3 text-sm text-gray-900 bg-white outline-none placeholder:text-gray-400 min-w-0 rounded-l-md lg:rounded-none"
            />
            <button
              type="submit"
              className="bg-agon-orange hover:bg-agon-orange-hover transition-colors px-3 flex items-center justify-center flex-shrink-0 rounded-r-md"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">

            {/* Account */}
            <div className="hidden md:block relative group">
              <Link
                to={user ? "/minha-conta" : "/login"}
                className="flex flex-col items-start hover:outline hover:outline-1 hover:outline-white/40 rounded px-2 py-1.5 transition-all"
              >
                <span className="text-[11px] text-gray-400 leading-tight whitespace-nowrap">
                  {user ? `Olá, ${profile?.full_name?.split(' ')[0] || 'Conta'}` : 'Olá, faça seu login'}
                </span>
                <span className="text-[13px] font-bold leading-tight whitespace-nowrap flex items-center gap-0.5">
                  Conta e Dados <ChevronDown className="w-3 h-3 inline" />
                </span>
              </Link>

              {/* Popover/Dropdown da Amazon */}
              <div className="absolute right-0 top-full pt-1.5 w-[380px] transition-all opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto duration-200 z-50">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-md shadow-2xl p-6 relative">
                  {/* Pequena setinha apontando para cima */}
                  <div className="absolute right-10 top-0 -mt-1.5 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45"></div>
                  
                  {/* Sessão de Login se não estiver logado */}
                  {!user ? (
                    <div className="flex flex-col items-center border-b border-gray-200 pb-4 mb-4 w-full">
                      <Link 
                        to="/login"
                        className="w-full bg-agon-orange hover:bg-agon-orange-hover text-white font-bold text-center text-sm py-2.5 rounded-lg shadow-sm transition-colors"
                      >
                        Faça seu login
                      </Link>
                      <span className="text-xs text-gray-500 mt-2">
                        Cliente novo? <Link to="/cadastro" className="text-agon-orange hover:underline font-semibold">Comece aqui.</Link>
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4 w-full">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-gray-800 truncate">Olá, {profile?.full_name?.split(' ')[0] || 'Cliente'}</span>
                        <span className="text-[11px] text-gray-400 truncate">{user.email}</span>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline font-bold transition-colors flex-shrink-0"
                      >
                        Sair da conta
                      </button>
                    </div>
                  )}

                  {/* Colunas do Menu */}
                  <div className="grid grid-cols-2 gap-6 text-left">
                    {/* Coluna 1 */}
                    <div className="border-r border-gray-100 pr-2">
                      <h3 className="text-xs font-bold text-gray-900 mb-2.5 uppercase tracking-wider">Seus Atalhos</h3>
                      <ul className="space-y-2 text-xs">
                        <li>
                          <Link to="/sacola" className="text-gray-600 hover:text-agon-orange hover:underline transition-colors block py-0.5">
                            Minha Sacola
                          </Link>
                        </li>
                        <li>
                          <Link to="/" className="text-gray-600 hover:text-agon-orange hover:underline transition-colors block py-0.5">
                            Ver Produtos
                          </Link>
                        </li>
                        <li>
                          <Link to="/suporte" className="text-gray-600 hover:text-agon-orange hover:underline transition-colors block py-0.5">
                            Falar com Suporte
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Coluna 2 */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 mb-2.5 uppercase tracking-wider">Sua Conta</h3>
                      <ul className="space-y-2 text-xs">
                        <li>
                          <Link to={user ? "/minha-conta" : "/login"} className="text-gray-600 hover:text-agon-orange hover:underline transition-colors block py-0.5">
                            Minha Conta
                          </Link>
                        </li>
                        <li>
                          <Link to={user ? "/minha-conta" : "/login"} className="text-gray-600 hover:text-agon-orange hover:underline transition-colors block py-0.5">
                            Meus Pedidos
                          </Link>
                        </li>
                        <li>
                          <Link to={user ? "/minha-conta" : "/login"} className="text-gray-600 hover:text-agon-orange hover:underline transition-colors block py-0.5">
                            Meus Endereços
                          </Link>
                        </li>
                        {isAdmin && (
                          <li>
                            <Link to="/admin" className="text-agon-orange hover:underline font-bold transition-colors block py-0.5">
                              Painel Admin
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: User icon */}
            <Link
              to={user ? "/minha-conta" : "/login"}
              className="md:hidden p-1.5 hover:bg-white/10 rounded transition-colors"
              aria-label="Conta"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Orders / Returns */}
            <Link
              to={user ? "/minha-conta" : "/login"}
              className="hidden lg:flex flex-col items-start hover:outline hover:outline-1 hover:outline-white/40 rounded px-2 py-1.5 transition-all"
            >
              <span className="text-[11px] text-gray-400 leading-tight">Meus</span>
              <span className="text-[13px] font-bold leading-tight">Pedidos</span>
            </Link>

            {/* Admin */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden lg:flex p-2 hover:bg-white/10 rounded transition-colors"
                aria-label="Painel Admin"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {/* Cart */}
            <div className="relative group/cart">
              <Link
                to="/sacola"
                className="flex items-end gap-0.5 hover:outline hover:outline-1 hover:outline-white/40 rounded px-2 py-1.5 transition-all relative"
                aria-label="Sacola de compras"
              >
                <div className="relative">
                  <ShoppingCart className="w-7 h-7 md:w-8 md:h-8" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-agon-orange text-[11px] font-black text-white">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </div>
              </Link>

              {/* Popover da Sacola */}
              <div className="hidden md:block absolute right-0 top-full pt-1.5 w-[360px] transition-all opacity-0 pointer-events-none group-hover/cart:opacity-100 group-hover/cart:pointer-events-auto duration-200 z-50">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-md shadow-2xl relative">
                  {/* Setinha */}
                  <div className="absolute right-6 top-0 -mt-1.5 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45"></div>

                  {cartItems.length === 0 ? (
                    /* Sacola Vazia */
                    <div className="flex flex-col items-center justify-center py-10 px-6">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm font-semibold text-gray-700 mb-1">Sua sacola está vazia</p>
                      <p className="text-xs text-gray-400 mb-4 text-center">Explore nossos produtos e adicione itens à sua sacola.</p>
                      <Link
                        to="/"
                        className="bg-agon-orange hover:bg-agon-orange-hover text-white text-xs font-bold py-2 px-6 rounded-lg transition-colors"
                      >
                        Ver Produtos
                      </Link>
                    </div>
                  ) : (
                    /* Sacola com Itens */
                    <>
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Sacola ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                      </div>
                      <ul className="max-h-[260px] overflow-y-auto divide-y divide-gray-100">
                        {cartItems.slice(0, 4).map(item => (
                          <li key={item.product_id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                            {/* Imagem */}
                            <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-300" />
                                </div>
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">Qtd: {item.quantity}</p>
                              <p className="text-xs font-bold text-agon-orange mt-0.5">
                                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            {/* Remover */}
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(item.product_id); }}
                              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-md hover:bg-red-50 flex-shrink-0"
                              aria-label={`Remover ${item.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      {cartItems.length > 4 && (
                        <div className="text-center py-1.5 text-[11px] text-gray-400 border-t border-gray-100">
                          + {cartItems.length - 4} {cartItems.length - 4 === 1 ? 'outro item' : 'outros itens'}
                        </div>
                      )}
                      {/* Footer — Subtotal + CTA */}
                      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-md">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-500 font-medium">Subtotal</span>
                          <span className="text-sm font-bold text-gray-900">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <Link
                          to="/sacola"
                          className="block w-full bg-agon-orange hover:bg-agon-orange-hover text-white text-center text-sm font-bold py-2.5 rounded-lg transition-colors"
                        >
                          Ver Sacola
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======= BOTTOM BAR ======= */}
      <div className="bg-agon-navy-light text-white overflow-hidden">
        <div className="container mx-auto px-3 md:px-4 h-[38px] flex items-center gap-1">
          {/* "Todos" button — dropdown de categorias */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsTodosDropdownOpen(!isTodosDropdownOpen)}
              className="flex items-center gap-1.5 hover:outline hover:outline-1 hover:outline-white/40 rounded px-2.5 py-1 transition-all text-sm font-bold"
            >
              <Menu className="w-4 h-4" />
              <span>Todos</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isTodosDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTodosDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsTodosDropdownOpen(false)} />
                <ul className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-30 text-left max-h-96 overflow-y-auto">
                  <li>
                    <Link
                      to="/"
                      onClick={() => setIsTodosDropdownOpen(false)}
                      className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-gray-100 transition-colors ${
                        location.pathname === '/' && currentCategorySlug === 'all' ? 'text-agon-orange font-bold' : 'text-gray-700'
                      }`}
                    >
                      Todos os Produtos
                    </Link>
                  </li>
                  {parentCategories.map(parent => {
                    const children = getChildren(parent.id)
                    return (
                      <li key={parent.id}>
                        <div className="border-t border-gray-100 my-0.5" />
                        <Link
                          to={`/categoria/${parent.slug}`}
                          onClick={() => setIsTodosDropdownOpen(false)}
                          className={`block w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-gray-100 transition-colors ${
                            currentCategorySlug === parent.slug ? 'text-agon-orange' : 'text-gray-800'
                          }`}
                        >
                          {parent.name}
                        </Link>
                        {children.map(child => (
                          <Link
                            key={child.id}
                            to={`/categoria/${child.slug}`}
                            onClick={() => setIsTodosDropdownOpen(false)}
                            className={`block w-full text-left pl-7 pr-4 py-2 text-xs hover:bg-gray-100 transition-colors ${
                              currentCategorySlug === child.slug ? 'text-agon-orange font-bold' : 'text-gray-600'
                            }`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-white/20 flex-shrink-0" />

          {/* Quick Links + Categories — horizontal scrollable */}
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide whitespace-nowrap flex-1">
            <Link
              to="/"
              className="text-[13px] font-medium hover:outline hover:outline-1 hover:outline-white/40 rounded px-2 py-1 transition-all flex-shrink-0"
            >
              Ofertas do Dia
            </Link>
            <Link
              to="/"
              className="text-[13px] font-medium hover:outline hover:outline-1 hover:outline-white/40 rounded px-2 py-1 transition-all flex-shrink-0"
            >
              Mais Vendidos
            </Link>
            <Link
              to="/"
              className="text-[13px] font-medium hover:outline hover:outline-1 hover:outline-white/40 rounded px-2 py-1 transition-all flex-shrink-0"
            >
              Lançamentos
            </Link>

            {/* Category links — only parent categories shown in bottom bar */}
            {parentCategories.map(parent => (
              <Link
                key={parent.id}
                to={`/categoria/${parent.slug}`}
                className={`text-[13px] font-medium hover:outline hover:outline-1 hover:outline-white/40 rounded px-2 py-1 transition-all flex-shrink-0 ${
                  location.pathname === `/categoria/${parent.slug}` ? 'text-agon-orange' : ''
                }`}
              >
                {parent.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <CepModal 
        isOpen={isCepModalOpen} 
        onClose={() => setIsCepModalOpen(false)} 
        onAddressAdded={setGuestAddress} 
      />
    </header>
  )
}
