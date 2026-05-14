# Ecommerce MVP — Plano de Continuacao (Fases 2-3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar as Fases 2 e 3 do MVP: corrigir bugs, implementar paginas publicas faltantes (produto detalhe, categoria, cadastro), completar admin (dashboard, pedidos), e adicionar Footer.

**Architecture:** SPA React com React Router v7. Todas as queries usam o Supabase JS Client diretamente. Estado global via React Context (auth, cart). Carrinho 100% localStorage. UI em portugues (BR), codigo em ingles. Nao ha testes unitarios — validacao e manual no browser apos cada task (`npm run dev`).

**Tech Stack:** React 19, React Router DOM 7, Tailwind CSS 3, Supabase JS v2, react-hot-toast, Vite 6

**Projeto:** `C:\Users\caiul\OneDrive\Documentos\projetos\ferreira\ecommerce-mvp`

**Validacao apos cada task:** Apos cada commit, rodar `npm run dev`, abrir http://localhost:5173 no browser, e testar a feature implementada + regressao nas existentes. Checklist de smoke test:
1. Home carrega produtos com imagens e filtro de categorias
2. Sacola funciona (add, remove, alterar quantidade, badge no header)
3. Login/Logout funciona (admin ve link "Admin" no header)
4. Admin: listar/criar/editar produto funciona
5. Feature nova da task funciona conforme descrito

---

## File Structure

### Files to CREATE:
| Path | Responsibility |
|---|---|
| `src/lib/formatPrice.js` | Util: formata valor para BRL (`R$ X,XX`) — DRY |
| `src/pages/ProductDetail.jsx` | Pagina publica `/produto/:id` — galeria de fotos, descricao, preco, add sacola |
| `src/pages/Category.jsx` | Pagina publica `/categoria/:slug` — lista filtrada por categoria |
| `src/pages/Register.jsx` | Pagina publica `/cadastro` — formulario de criacao de conta |
| `src/pages/admin/OrderDetail.jsx` | Admin `/admin/pedidos/:id` — detalhe completo do pedido |
| `src/components/Footer.jsx` | Footer do site com info basica |

### Files to MODIFY:
| Path | Change |
|---|---|
| `src/components/admin/ProductForm.jsx` | Bug fix: hard delete → soft delete |
| `src/pages/Home.jsx` | Remover filtro `stock_status=available`, extrair `formatPrice` |
| `src/pages/Sacola.jsx` | Extrair `formatPrice` para util |
| `src/pages/admin/Dashboard.jsx` | Completar: periodos, pedidos recentes, contadores por status |
| `src/pages/admin/Orders.jsx` | Adicionar filtros (status, data, busca), link para detalhe |
| `src/pages/admin/Products.jsx` | Extrair `formatPrice` para util |
| `src/components/Layout.jsx` | Adicionar Footer, link para categorias, link cadastro |
| `src/App.jsx` | Adicionar rotas faltantes |

---

## Task 1: Extrair `formatPrice` para util compartilhado

**Files:**
- Create: `src/lib/formatPrice.js`
- Modify: `src/pages/Home.jsx`
- Modify: `src/pages/Sacola.jsx`
- Modify: `src/pages/admin/Products.jsx`
- Modify: `src/pages/admin/Dashboard.jsx`
- Modify: `src/pages/admin/Orders.jsx`

Atualmente `formatPrice` esta copiado em 5 arquivos. Extrair para um unico util.

- [ ] **Step 1: Criar o util**

```js
// src/lib/formatPrice.js
export default function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
```

- [ ] **Step 2: Substituir em todos os arquivos**

Em cada arquivo que define `function formatPrice(value)` localmente:
1. Adicionar `import formatPrice from '../lib/formatPrice'` (ou `'../../lib/formatPrice'` para admin)
2. Remover a funcao `formatPrice` local

Arquivos: `Home.jsx`, `Sacola.jsx`, `Products.jsx`, `Dashboard.jsx`, `Orders.jsx`

- [ ] **Step 3: Testar no browser**

Run: `npm run dev`
Verificar: precos aparecem formatados em R$ em todas as paginas (Home, Sacola, Admin Products, Dashboard, Orders)

- [ ] **Step 4: Commit**

```bash
git add src/lib/formatPrice.js src/pages/Home.jsx src/pages/Sacola.jsx src/pages/admin/Products.jsx src/pages/admin/Dashboard.jsx src/pages/admin/Orders.jsx
git commit -m "refactor: extract formatPrice to shared util"
```

---

## Task 2: Bug fix — hard delete para soft delete no ProductForm

**Files:**
- Modify: `src/components/admin/ProductForm.jsx:120-142`

O `handleDelete` atual faz `supabase.from('products').delete()` (hard delete). A spec diz "Excluir produto (soft delete via `is_active = false`)". O hard delete tambem apaga imagens do storage desnecessariamente.

- [ ] **Step 1: Substituir handleDelete**

Substituir a funcao `handleDelete` inteira (linhas ~120-142) por:

```jsx
async function handleDelete() {
  if (!window.confirm('Tem certeza que deseja desativar este produto?')) return

  setDeleting(true)
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)

    if (error) throw error

    toast.success('Produto desativado')
    navigate('/admin/produtos')
  } catch (err) {
    toast.error(err.message || 'Erro ao desativar')
    setDeleting(false)
  }
}
```

Tambem mudar o texto do botao de "Excluir" para "Desativar" e de "Excluindo..." para "Desativando...":

```jsx
<button
  type="button"
  onClick={handleDelete}
  disabled={deleting}
  className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
>
  {deleting ? 'Desativando...' : 'Desativar'}
</button>
```

- [ ] **Step 2: Testar no browser**

1. Ir para `/admin/produtos`, editar um produto
2. Clicar "Desativar" → confirmar
3. Verificar: produto some da Home (is_active=false), mas aparece na lista admin com status "Inativo"
4. Verificar: imagens do produto NAO foram apagadas do storage

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ProductForm.jsx
git commit -m "fix: change product delete to soft delete (is_active=false)"
```

---

## Task 3: Remover filtro `stock_status` da Home

**Files:**
- Modify: `src/pages/Home.jsx:27`

A Home filtra `.eq('stock_status', 'available')` mas a spec nao pede isso. Produtos esgotados devem aparecer na loja (sem botao de adicionar). O RLS ja filtra por `is_active=true`.

- [ ] **Step 1: Remover o filtro e ajustar o botao**

Na query de `loadProducts`, remover a linha:
```js
.eq('stock_status', 'available')
```

No grid de produtos, trocar o botao por versao condicional:
```jsx
{product.stock_status === 'available' ? (
  <button
    onClick={() => handleAddToCart(product)}
    className="w-full py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    Adicionar a Sacola
  </button>
) : (
  <span className="block w-full py-1.5 text-xs text-center text-gray-400 border border-gray-200 rounded">
    Esgotado
  </span>
)}
```

- [ ] **Step 2: Testar no browser**

1. No Supabase, setar um produto como `stock_status = 'out_of_stock'`
2. Home deve mostrar o produto com label "Esgotado" em vez do botao
3. Produtos disponiveis continuam com botao "Adicionar a Sacola"

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "fix: show out-of-stock products on Home with 'Esgotado' label"
```

---

## Task 4: Criar pagina de detalhe do produto (`/produto/:id`)

**Files:**
- Create: `src/pages/ProductDetail.jsx`
- Modify: `src/App.jsx` (adicionar rota)

Spec: "Fotos, descricao, preco, add sacola"

- [ ] **Step 1: Criar ProductDetail.jsx**

```jsx
// src/pages/ProductDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import formatPrice from '../lib/formatPrice'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*), categories(name, slug)')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setProduct(null)
      } else {
        data.product_images = (data.product_images || []).sort((a, b) => a.position - b.position)
        setProduct(data)
      }
      setLoading(false)
    }
    load()
  }, [id])

  function handleAddToCart() {
    const mainImage = product.product_images?.[0]
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: mainImage?.url || null,
    }, quantity)
    toast.success(`${quantity}x ${product.name} adicionado a sacola!`)
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Carregando...</div>
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Produto nao encontrado</h1>
        <Link to="/" className="text-blue-600 hover:underline">Voltar para a loja</Link>
      </div>
    )
  }

  const images = product.product_images || []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-700">Inicio</Link>
        {product.categories && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/categoria/${product.categories.slug}`} className="hover:text-gray-700">
              {product.categories.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]?.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Sem imagem
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden ${
                    idx === selectedImage ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {product.categories && (
            <p className="text-sm text-gray-500 mb-4">{product.categories.name}</p>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            {product.compare_price && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.compare_price)}
              </span>
            )}
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          </div>

          {product.stock_status === 'available' ? (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-gray-600">Quantidade:</label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-center min-w-[40px]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Adicionar a Sacola
              </button>
            </div>
          ) : (
            <div className="mb-6 py-3 text-center text-gray-500 border border-gray-200 rounded-lg">
              Produto esgotado
            </div>
          )}

          <p className="text-sm text-gray-500">
            {product.price >= 100
              ? 'Frete gratis para este produto'
              : 'Frete: R$ 15,90 (gratis acima de R$ 100)'}
          </p>

          {product.description && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Descricao</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Adicionar rota em App.jsx**

Adicionar import e rota:
```jsx
import ProductDetail from './pages/ProductDetail'

// Dentro de <Routes>, apos a rota /sacola:
<Route path="/produto/:id" element={<ProductDetail />} />
```

- [ ] **Step 3: Testar no browser**

1. Home → clicar na imagem ou nome de um produto → deve abrir `/produto/:id`
2. Galeria de imagens: clicar nas thumbnails troca a imagem principal
3. Botao "Adicionar a Sacola" funciona com quantidade
4. Breadcrumb navega corretamente
5. Produto esgotado mostra "Produto esgotado" sem botao
6. URL invalida (`/produto/abc123`) mostra "Produto nao encontrado"

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProductDetail.jsx src/App.jsx
git commit -m "feat: add product detail page with image gallery"
```

---

## Task 5: Criar pagina de categoria (`/categoria/:slug`)

**Files:**
- Create: `src/pages/Category.jsx`
- Modify: `src/App.jsx` (adicionar rota)
- Modify: `src/components/Layout.jsx` (link opcional no header)

- [ ] **Step 1: Criar Category.jsx**

```jsx
// src/pages/Category.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import formatPrice from '../lib/formatPrice'
import toast from 'react-hot-toast'

export default function Category() {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!cat) {
        setCategory(null)
        setLoading(false)
        return
      }

      setCategory(cat)

      const { data: prods } = await supabase
        .from('products')
        .select('*, product_images(url, position), categories(name)')
        .eq('is_active', true)
        .eq('category_id', cat.id)
        .order('created_at', { ascending: false })

      setProducts(prods || [])
      setLoading(false)
    }
    load()
  }, [slug])

  function handleAddToCart(product) {
    const mainImage = product.product_images
      ?.sort((a, b) => a.position - b.position)?.[0]
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: mainImage?.url || null,
    })
    toast.success('Adicionado a sacola!')
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">Carregando...</div>
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Categoria nao encontrada</h1>
        <Link to="/" className="text-blue-600 hover:underline">Voltar para a loja</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-gray-700">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{category.name}</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">{category.name}</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">Nenhum produto nesta categoria.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => {
            const mainImage = product.product_images
              ?.sort((a, b) => a.position - b.position)?.[0]
            return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Link to={`/produto/${product.id}`}>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {mainImage ? (
                      <img src={mainImage.url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm">Sem imagem</span>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link to={`/produto/${product.id}`}>
                    <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-2">
                    {product.compare_price && (
                      <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                    )}
                    <span className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>
                  </div>
                  {product.stock_status === 'available' ? (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Adicionar a Sacola
                    </button>
                  ) : (
                    <span className="block w-full py-1.5 text-xs text-center text-gray-400 border border-gray-200 rounded">
                      Esgotado
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Adicionar rota em App.jsx**

```jsx
import Category from './pages/Category'

// Dentro de <Routes>, apos a rota /produto/:id:
<Route path="/categoria/:slug" element={<Category />} />
```

- [ ] **Step 3: Testar no browser**

1. Navegar para `/categoria/eletronicos` → deve mostrar produtos da categoria Eletronicos
2. Navegar para `/categoria/pets` → deve mostrar produtos (ou "Nenhum produto")
3. Navegar para `/categoria/inexistente` → deve mostrar "Categoria nao encontrada"
4. Home → clicar num filtro de categoria → os cards na Home continuam funcionando (nao quebrou)
5. Breadcrumb funciona

- [ ] **Step 4: Commit**

```bash
git add src/pages/Category.jsx src/App.jsx
git commit -m "feat: add category page with product listing"
```

---

## Task 6: Criar pagina de cadastro separada (`/cadastro`)

**Files:**
- Create: `src/pages/Register.jsx`
- Modify: `src/App.jsx` (adicionar rota)
- Modify: `src/pages/Login.jsx` (link para /cadastro)

- [ ] **Step 1: Criar Register.jsx**

```jsx
// src/pages/Register.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)

    try {
      await signUp(email, password, fullName)
      toast.success('Conta criada! Verifique seu email.')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Erro ao criar conta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg border border-gray-200">
      <h1 className="text-2xl font-bold mb-6">Criar Conta</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Criando...' : 'Criar Conta'}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-gray-600">
        Ja tem conta?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">Entrar</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Simplificar Login.jsx**

Remover toda a logica de `isSignUp` e `fullName` do Login.jsx. Manter apenas login. Trocar o link de toggle para:

```jsx
<p className="mt-4 text-sm text-center text-gray-600">
  Nao tem conta?{' '}
  <Link to="/cadastro" className="text-blue-600 hover:underline">Criar conta</Link>
</p>
```

- [ ] **Step 3: Adicionar rota em App.jsx**

```jsx
import Register from './pages/Register'

// Dentro de <Routes>:
<Route path="/cadastro" element={<Register />} />
```

- [ ] **Step 4: Testar no browser**

1. `/login` → so mostra email + senha + link "Criar conta"
2. Clicar "Criar conta" → navega para `/cadastro`
3. `/cadastro` → formulario com nome, email, telefone, senha
4. Criar conta → toast "Conta criada!" → redirect para Home
5. Link "Ja tem conta? Entrar" volta para `/login`

- [ ] **Step 5: Commit**

```bash
git add src/pages/Register.jsx src/pages/Login.jsx src/App.jsx
git commit -m "feat: add separate registration page"
```

---

## Task 7: Adicionar Footer ao Layout

**Files:**
- Create: `src/components/Footer.jsx`
- Modify: `src/components/Layout.jsx`

- [ ] **Step 1: Criar Footer.jsx**

```jsx
// src/components/Footer.jsx
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Loja MVP</h3>
            <p className="text-sm text-gray-500">
              Produtos selecionados com entrega para todo o Brasil.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Categorias</h3>
            <ul className="space-y-1 text-sm text-gray-500">
              <li><Link to="/categoria/utilidade-domestica" className="hover:text-gray-700">Utilidade Domestica</Link></li>
              <li><Link to="/categoria/ferramentas" className="hover:text-gray-700">Ferramentas</Link></li>
              <li><Link to="/categoria/beleza-cuidados-pessoais" className="hover:text-gray-700">Beleza e Cuidados</Link></li>
              <li><Link to="/categoria/eletronicos" className="hover:text-gray-700">Eletronicos</Link></li>
              <li><Link to="/categoria/pets" className="hover:text-gray-700">Pets</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Ajuda</h3>
            <ul className="space-y-1 text-sm text-gray-500">
              <li><Link to="/sacola" className="hover:text-gray-700">Minha Sacola</Link></li>
              <li><Link to="/login" className="hover:text-gray-700">Minha Conta</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-4 text-center text-xs text-gray-400">
          Loja MVP {new Date().getFullYear()}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Adicionar Footer ao Layout.jsx**

Importar e renderizar abaixo do `<main>`:

```jsx
import Footer from './Footer'

// No return, apos </main>:
<Footer />
```

Tambem mudar o wrapper `<div>` para garantir que o footer fique no final:

```jsx
<div className="min-h-screen bg-gray-50 flex flex-col">
  <header>...</header>
  <main className="flex-1">
    <Outlet />
  </main>
  <Footer />
</div>
```

- [ ] **Step 3: Testar no browser**

1. Footer aparece no final de todas as paginas
2. Links de categorias no footer navegam corretamente
3. Com pouco conteudo, footer fica no bottom (flex layout)

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.jsx src/components/Layout.jsx
git commit -m "feat: add footer with category links"
```

---

## Task 8: Completar Dashboard admin

**Files:**
- Modify: `src/pages/admin/Dashboard.jsx`

Spec exige: totais por periodo (hoje/semana/mes), pedidos recentes (ultimos 10), contadores por status.

- [ ] **Step 1: Reescrever Dashboard.jsx**

```jsx
// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import formatPrice from '../../lib/formatPrice'

const STATUS_LABELS = {
  awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

function getDateRange(period) {
  const now = new Date()
  const start = new Date(now)

  if (period === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    start.setMonth(now.getMonth() - 1)
  }

  return start.toISOString()
}

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ count }, { data: allOrders }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('id, status, total, created_at, profiles(full_name)').order('created_at', { ascending: false }),
      ])

      setProductCount(count || 0)
      setOrders(allOrders || [])
      setLoading(false)
    }
    load()
  }, [])

  function calcStats(period) {
    const since = getDateRange(period)
    const filtered = orders.filter(o => o.created_at >= since && o.status !== 'cancelled')
    const count = orders.filter(o => o.created_at >= since).length
    const revenue = filtered.reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
    return { count, revenue }
  }

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const recentOrders = orders.slice(0, 10)

  const today = calcStats('today')
  const week = calcStats('week')
  const month = calcStats('month')

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8"><p>Carregando...</p></div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Period stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Produtos cadastrados</p>
          <p className="text-3xl font-bold mt-1">{productCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Hoje</p>
          <p className="text-2xl font-bold mt-1">{today.count} <span className="text-sm font-normal text-gray-400">pedidos</span></p>
          <p className="text-sm text-green-600 font-medium">{formatPrice(today.revenue)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Ultimos 7 dias</p>
          <p className="text-2xl font-bold mt-1">{week.count} <span className="text-sm font-normal text-gray-400">pedidos</span></p>
          <p className="text-sm text-green-600 font-medium">{formatPrice(week.revenue)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm text-gray-500">Ultimos 30 dias</p>
          <p className="text-2xl font-bold mt-1">{month.count} <span className="text-sm font-normal text-gray-400">pedidos</span></p>
          <p className="text-sm text-green-600 font-medium">{formatPrice(month.revenue)}</p>
        </div>
      </div>

      {/* Status counters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
          <div key={key} className={`px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
            {label}: {statusCounts[key] || 0}
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Pedidos recentes</h2>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-500 text-sm">Nenhum pedido ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-2 font-medium text-gray-600">Pedido</th>
                <th className="text-left px-5 py-2 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-5 py-2 font-medium text-gray-600">Status</th>
                <th className="text-right px-5 py-2 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map(order => {
                const s = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2">
                      <Link to={`/admin/pedidos/${order.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                        #{order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-2 text-gray-700">{order.profiles?.full_name || 'Cliente'}</td>
                    <td className="px-5 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-2 text-right font-medium">{formatPrice(order.total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex gap-4">
        <Link to="/admin/produtos" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          Gerenciar Produtos
        </Link>
        <Link to="/admin/pedidos" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          Ver Todos os Pedidos
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Testar no browser**

1. `/admin` → cards com totais por periodo (hoje, 7 dias, 30 dias)
2. Contadores por status aparecem (mesmo zerados)
3. Tabela "Pedidos recentes" mostra ate 10 pedidos com link para detalhe
4. Se nao ha pedidos, exibe "Nenhum pedido ainda."

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Dashboard.jsx
git commit -m "feat: complete admin dashboard with period stats, status counters, recent orders"
```

---

## Task 9: Adicionar filtros na lista de pedidos admin

**Files:**
- Modify: `src/pages/admin/Orders.jsx`

Spec: "Lista com filtros: status, data, busca por nome/email" + link para detalhe separado.

- [ ] **Step 1: Reescrever Orders.jsx com filtros**

```jsx
// src/pages/admin/Orders.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import formatPrice from '../../lib/formatPrice'

const STATUS_LABELS = {
  awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrders()
  }, [filterStatus, filterDate])

  async function loadOrders() {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select('*, profiles(full_name, phone)')
      .order('created_at', { ascending: false })

    if (filterStatus) query = query.eq('status', filterStatus)
    if (filterDate) query = query.gte('created_at', filterDate)

    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const filtered = orders.filter(o => {
    if (!search) return true
    const term = search.toLowerCase()
    const name = (o.profiles?.full_name || '').toLowerCase()
    const id = o.id.toLowerCase()
    return name.includes(term) || id.includes(term)
  })

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8"><p>Carregando pedidos...</p></div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou ID..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {(filterStatus || filterDate || search) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterDate(''); setSearch('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Orders table */}
      {filtered.length === 0 ? (
        <p className="text-gray-500">Nenhum pedido encontrado.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pedido</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pagamento</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(order => {
                const s = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-700">{order.profiles?.full_name || 'Cliente'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{order.mp_status || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/pedidos/${order.id}`} className="text-blue-600 hover:underline text-xs">
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">{filtered.length} pedido(s)</p>
    </div>
  )
}
```

- [ ] **Step 2: Testar no browser**

1. `/admin/pedidos` → tabela com todos pedidos
2. Filtro por status funciona (dropdown)
3. Filtro por data funciona (date picker)
4. Busca por nome/ID funciona
5. "Limpar filtros" reseta tudo
6. Link "Ver detalhes" aponta para `/admin/pedidos/:id` (vai dar 404 ate a proxima task)

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/Orders.jsx
git commit -m "feat: add filters to admin orders list (status, date, search)"
```

---

## Task 10: Criar pagina de detalhe do pedido admin (`/admin/pedidos/:id`)

**Files:**
- Create: `src/pages/admin/OrderDetail.jsx`
- Modify: `src/App.jsx` (adicionar rota)

- [ ] **Step 1: Criar OrderDetail.jsx**

```jsx
// src/pages/admin/OrderDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import formatPrice from '../../lib/formatPrice'
import toast from 'react-hot-toast'

const STATUS_LABELS = {
  awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

const MP_STATUS_LABELS = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Recusado',
  refunded: 'Estornado',
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [id])

  async function loadOrder() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(full_name, phone), order_items(*, products(name))')
      .eq('id', id)
      .single()

    if (error || !data) {
      toast.error('Pedido nao encontrado')
      navigate('/admin/pedidos')
      return
    }
    setOrder(data)
    setLoading(false)
  }

  async function updateStatus(newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao atualizar status')
      return
    }
    toast.success('Status atualizado')
    loadOrder()
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><p>Carregando...</p></div>
  if (!order) return null

  const address = order.shipping_address || {}
  const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/pedidos')} className="text-gray-500 hover:text-gray-700">
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>{status.label}</span>
        </div>
        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Itens do Pedido</h2>
            <div className="space-y-3">
              {order.order_items?.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-gray-500">{item.quantity}x {formatPrice(item.unit_price)}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : 'Gratis'}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Endereco de Entrega</h2>
            <p className="text-sm text-gray-700">
              {address.street}, {address.number}
              {address.complement && ` - ${address.complement}`}
            </p>
            <p className="text-sm text-gray-700">
              {address.neighborhood} — {address.city}/{address.state}
            </p>
            <p className="text-sm text-gray-500">CEP: {address.cep}</p>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client info */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Cliente</h2>
            <p className="text-sm font-medium text-gray-900">{order.profiles?.full_name || 'N/A'}</p>
            <p className="text-sm text-gray-500">{order.profiles?.phone || 'Sem telefone'}</p>
            <p className="text-xs text-gray-400 mt-1">ID: {order.user_id?.slice(0, 8)}</p>
          </section>

          {/* Payment info */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Pagamento (MP)</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status MP</dt>
                <dd className="font-medium">{MP_STATUS_LABELS[order.mp_status] || order.mp_status || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">ID Pagamento</dt>
                <dd className="font-mono text-xs">{order.mp_payment_id || '—'}</dd>
              </div>
            </dl>
          </section>

          {/* Update status */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Atualizar Status</h2>
            <select
              value={order.status}
              onChange={e => updateStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </section>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Adicionar rota em App.jsx**

```jsx
import OrderDetail from './pages/admin/OrderDetail'

// Dentro de <Routes>, apos a rota /admin/pedidos:
<Route path="/admin/pedidos/:id" element={
  <ProtectedRoute requireAdmin>
    <OrderDetail />
  </ProtectedRoute>
} />
```

- [ ] **Step 3: Testar no browser**

1. `/admin/pedidos` → clicar "Ver detalhes" num pedido → abre `/admin/pedidos/:id`
2. Detalhe mostra: itens, subtotal/frete/total, endereco, info cliente, pagamento MP
3. Dropdown de status atualiza e mostra toast de sucesso
4. Botao "← Voltar" volta para a lista
5. ID invalido redireciona para lista com toast de erro

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/OrderDetail.jsx src/App.jsx
git commit -m "feat: add admin order detail page with status management"
```

---

## Task 11: Atualizar rotas finais no App.jsx e links no Layout

**Files:**
- Modify: `src/App.jsx` (verificacao final de todas as rotas)
- Modify: `src/components/Layout.jsx` (link Cadastro no header)

- [ ] **Step 1: Garantir que App.jsx tem todas as rotas**

O App.jsx final deve ter estas rotas (verificar se todas existem):

```
/                    → Home
/categoria/:slug     → Category
/produto/:id         → ProductDetail
/sacola              → Sacola
/login               → Login
/cadastro            → Register
/admin               → Dashboard (protected)
/admin/produtos      → Products (protected)
/admin/produtos/novo → ProductNew (protected)
/admin/produtos/:id  → ProductEdit (protected)
/admin/pedidos       → Orders (protected)
/admin/pedidos/:id   → OrderDetail (protected)
```

- [ ] **Step 2: Atualizar Layout header**

Adicionar link "Cadastro" ao lado de "Entrar" para visitantes:

```jsx
{user ? (
  <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700">
    Sair
  </button>
) : (
  <>
    <Link to="/login" className="text-blue-600 hover:text-blue-800">
      Entrar
    </Link>
    <Link to="/cadastro" className="text-gray-600 hover:text-gray-900">
      Cadastro
    </Link>
  </>
)}
```

- [ ] **Step 3: Smoke test completo**

Checklist final de todas as features:

**Publico:**
1. Home: carrega produtos, filtro de categorias, badge sacola, link produto
2. `/categoria/:slug`: lista por categoria, breadcrumb
3. `/produto/:id`: galeria, preco, descricao, add sacola com quantidade
4. `/sacola`: itens, +/-, remover, subtotal, frete, link checkout
5. `/login`: login funciona, link para cadastro
6. `/cadastro`: criar conta funciona, link para login
7. Footer: links de categorias, aparece em todas as paginas

**Admin:**
8. `/admin`: cards por periodo, contadores status, pedidos recentes
9. `/admin/produtos`: lista com filtros, link editar, link novo
10. `/admin/produtos/novo`: criar produto, upload imagens
11. `/admin/produtos/:id`: editar, desativar (soft delete), reordenar imagens
12. `/admin/pedidos`: lista com filtros (status, data, busca), link detalhe
13. `/admin/pedidos/:id`: itens, cliente, endereco, pagamento MP, atualizar status

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/components/Layout.jsx
git commit -m "chore: finalize routes and header links for Phase 2-3"
```

- [ ] **Step 5: Push para GitHub**

```bash
git push origin master
```

---

## Resumo de Execucao

| Task | Descricao | Tipo |
|---|---|---|
| 1 | Extrair `formatPrice` para util | refactor |
| 2 | Bug fix: hard delete → soft delete | bug fix |
| 3 | Remover filtro `stock_status` da Home | bug fix |
| 4 | Pagina detalhe produto `/produto/:id` | feature |
| 5 | Pagina categoria `/categoria/:slug` | feature |
| 6 | Pagina cadastro `/cadastro` separada | feature |
| 7 | Footer no Layout | feature |
| 8 | Dashboard admin completo | feature |
| 9 | Filtros na lista de pedidos admin | feature |
| 10 | Detalhe pedido admin `/admin/pedidos/:id` | feature |
| 11 | Rotas finais + smoke test completo | chore |

**Tempo estimado:** ~2-3 horas de implementacao sequencial com testes manuais.

**Apos Task 11:** Fases 2 e 3 completas. Proximo passo: Fase 4 (Checkout + Edge Functions + Mercado Pago).
