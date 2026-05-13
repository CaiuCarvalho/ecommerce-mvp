# E-Commerce MVP

## Pré-requisitos
- Node.js 18+
- npm

## Como rodar

1. Clone ou copie a pasta do projeto
2. Instale as dependências:
```bash
npm install
```

3. Crie o arquivo `.env` na raiz com:
```
VITE_SUPABASE_URL=https://rntcndexofgutfsopcjy.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_AQUI
```

4. Rode o projeto:
```bash
npm run dev
```

5. Acesse `http://localhost:5173`

## Acesso Admin
- Email: caiu.lfc@gmail.com
- Após login, o link "Admin" aparece no header

## Estrutura
```
src/
├── lib/supabase.js          # Cliente Supabase
├── contexts/
│   ├── AuthContext.jsx       # Autenticação
│   └── CartContext.jsx       # Carrinho (localStorage)
├── components/
│   ├── Layout.jsx            # Header + navegação
│   ├── ProtectedRoute.jsx    # Guard de rotas
│   └── admin/
│       ├── ImageUploader.jsx # Upload drag-drop de imagens
│       └── ProductForm.jsx   # Editor de produto (Shopify-like)
├── pages/
│   ├── Home.jsx              # Vitrine com filtro por categoria
│   ├── Login.jsx             # Login/Cadastro
│   ├── Sacola.jsx            # Carrinho
│   └── admin/
│       ├── Dashboard.jsx     # Painel resumo
│       ├── Products.jsx      # Lista de produtos
│       ├── ProductNew.jsx    # Criar produto
│       ├── ProductEdit.jsx   # Editar produto
│       └── Orders.jsx        # Gestão de pedidos
```
