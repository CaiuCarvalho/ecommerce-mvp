# SPEC — MVP E-Commerce (Dropshipping)

> Documento de especificação (SDD) — v1.1
> Última atualização: 12/05/2026
> Mudanças v1.1: separação status pedido/pagamento, carrinho localStorage-only, orders via Edge Function

---

## 1. VISÃO GERAL

Site de e-commerce genérico com modelo dropshipping. O admin cadastra produtos em 7 categorias, controla estoque manualmente e gerencia pedidos. O cliente navega, monta sacola e finaliza compra via Mercado Pago. Frete grátis acima de R$100.

---

## 2. TECH STACK

| Camada         | Tecnologia                        |
|----------------|-----------------------------------|
| Frontend       | React + Tailwind CSS              |
| Backend/DB     | Supabase (PostgreSQL)             |
| Autenticação   | Supabase Auth (email/senha)       |
| Storage        | Supabase Storage (imagens)        |
| Pagamento      | Mercado Pago (Checkout Pro)       |
| Deploy         | Vercel (frontend) + Supabase Cloud|

---

## 3. CATEGORIAS DE PRODUTOS

| ID | Nome                        |
|----|-----------------------------|
| 1  | Utilidade Doméstica         |
| 2  | Ferramentas                 |
| 3  | Beleza e Cuidados Pessoais  |
| 4  | Brinquedos                  |
| 5  | Escritório                  |
| 6  | Pets                        |
| 7  | Eletrônicos                 |

> "Todos" não é categoria no banco — é um filtro no frontend que mostra tudo.

---

## 4. SCHEMA DO BANCO DE DADOS (Supabase/PostgreSQL)

### 4.1 Tabela: `profiles`
Estende o `auth.users` com dados extras.

| Coluna       | Tipo        | Notas                                  |
|-------------|-------------|----------------------------------------|
| id          | UUID (PK)   | Referência a `auth.users.id`           |
| full_name   | TEXT        | Nome completo                          |
| phone       | TEXT        | Telefone                               |
| role        | TEXT        | `customer` (default) ou `admin`        |
| created_at  | TIMESTAMPTZ | Default: `now()`                       |

### 4.2 Tabela: `addresses`
Endereços de entrega do usuário.

| Coluna       | Tipo        | Notas                                  |
|-------------|-------------|----------------------------------------|
| id          | UUID (PK)   | `gen_random_uuid()`                    |
| user_id     | UUID (FK)   | → `profiles.id`                        |
| label       | TEXT        | Ex: "Casa", "Trabalho"                 |
| cep         | TEXT        | CEP                                    |
| street      | TEXT        | Rua                                    |
| number      | TEXT        | Número                                 |
| complement  | TEXT        | Complemento (nullable)                 |
| neighborhood| TEXT        | Bairro                                 |
| city        | TEXT        | Cidade                                 |
| state       | TEXT        | UF (2 letras)                          |
| created_at  | TIMESTAMPTZ | Default: `now()`                       |

### 4.3 Tabela: `categories`
Categorias fixas (seed).

| Coluna   | Tipo        | Notas                    |
|---------|-------------|--------------------------|
| id      | SERIAL (PK) |                          |
| name    | TEXT        | Nome da categoria        |
| slug    | TEXT        | URL-friendly (ex: `pets`)|

### 4.4 Tabela: `products`

| Coluna        | Tipo         | Notas                                  |
|--------------|--------------|----------------------------------------|
| id           | UUID (PK)    | `gen_random_uuid()`                    |
| name         | TEXT         | Nome do produto                        |
| description  | TEXT         | Descrição longa                        |
| price        | NUMERIC(10,2)| Preço em reais                         |
| compare_price| NUMERIC(10,2)| Preço "de" riscado (nullable)          |
| category_id  | INT (FK)     | → `categories.id`                      |
| stock_status | TEXT         | `available` ou `out_of_stock`          |
| is_active    | BOOLEAN      | Se aparece na loja (default: `true`)   |
| created_at   | TIMESTAMPTZ  | Default: `now()`                       |
| updated_at   | TIMESTAMPTZ  | Atualizado via trigger                 |

### 4.5 Tabela: `product_images`

| Coluna      | Tipo      | Notas                              |
|------------|-----------|-------------------------------------|
| id         | UUID (PK) | `gen_random_uuid()`                 |
| product_id | UUID (FK) | → `products.id` ON DELETE CASCADE   |
| url        | TEXT      | URL pública do Supabase Storage     |
| position   | INT       | Ordem (1 = principal)               |

### 4.6 Tabela: `orders`

| Coluna             | Tipo         | Notas                                     |
|-------------------|--------------|-------------------------------------------|
| id                | UUID (PK)    | `gen_random_uuid()`                       |
| user_id           | UUID (FK)    | → `profiles.id`                           |
| status            | TEXT         | Status do pedido (controlado pelo admin)  |
| subtotal          | NUMERIC(10,2)| Soma dos itens                            |
| shipping_cost     | NUMERIC(10,2)| Custo do frete                            |
| total             | NUMERIC(10,2)| subtotal + shipping                       |
| shipping_address  | JSONB        | Snapshot do endereço no momento da compra  |
| mp_payment_id     | TEXT         | ID do pagamento no Mercado Pago           |
| mp_status         | TEXT         | Status do pagamento (vindo do MP)         |
| created_at        | TIMESTAMPTZ  | Default: `now()`                          |
| updated_at        | TIMESTAMPTZ  | Atualizado via trigger                    |

#### Status do pedido (`status`) — controlado pelo admin
| Valor              | Descrição                                      |
|--------------------|-------------------------------------------------|
| `awaiting_payment` | Pedido criado, aguardando confirmação do MP     |
| `processing`       | Pagamento confirmado, pedido em preparação      |
| `shipped`          | Pedido enviado ao cliente                       |
| `delivered`        | Pedido entregue                                 |
| `cancelled`        | Cancelado (pelo admin, a qualquer momento)      |

> Fluxo normal: `awaiting_payment` → `processing` → `shipped` → `delivered`
> O webhook do MP muda `awaiting_payment` → `processing` automaticamente.
> Demais transições são manuais pelo admin.

#### Status do pagamento (`mp_status`) — controlado pelo Mercado Pago
| Valor      | Descrição                        |
|-----------|----------------------------------|
| `pending`  | Pagamento pendente (boleto/pix)  |
| `approved` | Pagamento aprovado               |
| `rejected` | Pagamento recusado               |
| `refunded` | Pagamento estornado              |

> Este campo é atualizado SOMENTE via webhook do MP. O admin não edita.

### 4.7 Tabela: `order_items`

| Coluna      | Tipo         | Notas                              |
|------------|--------------|-------------------------------------|
| id         | UUID (PK)    | `gen_random_uuid()`                 |
| order_id   | UUID (FK)    | → `orders.id` ON DELETE CASCADE     |
| product_id | UUID (FK)    | → `products.id`                     |
| product_name| TEXT        | Snapshot do nome (caso produto mude)|
| quantity   | INT          | Quantidade                          |
| unit_price | NUMERIC(10,2)| Preço unitário no momento           |

---

## 5. AUTENTICAÇÃO & PERMISSÕES

### 5.1 Fluxo do cliente
1. Navega livremente (sem conta)
2. Sacola salva 100% no `localStorage` (independente de login)
3. Sacola persiste ao fazer login — não sincroniza com banco
4. No checkout → se não logado, formulário pede: nome, email, senha, telefone, endereço
5. Ao submeter → `supabase.auth.signUp()` cria a conta
6. Sacola é "consumida" ao criar o pedido (enviada à Edge Function)
7. Conta criada → pedido vinculado → recebe atualizações por email

### 5.2 Criação de pedidos (backend)
> **IMPORTANTE:** O frontend NUNCA escreve diretamente em `orders` ou `order_items`.

1. Frontend envia à **Supabase Edge Function**: itens da sacola + endereço + user token
2. Edge Function **valida preços** contra a tabela `products` (evita manipulação)
3. Edge Function calcula subtotal, frete e total
4. Edge Function cria `order` + `order_items` numa **transação SQL**
5. Edge Function cria `preference` no Mercado Pago com os itens validados
6. Retorna URL de pagamento → frontend redireciona ao MP

### 5.3 Fluxo do admin
1. Admin fixo: criado manualmente no Supabase
2. `profiles.role = 'admin'` → libera rotas `/admin/*`
3. Futuros admins: inseridos diretamente na tabela `profiles`

### 5.4 RLS (Row Level Security)
| Tabela          | SELECT                        | INSERT/UPDATE/DELETE                    |
|----------------|-------------------------------|------------------------------------------|
| products       | Público (todos)               | Somente admin                            |
| product_images | Público (todos)               | Somente admin                            |
| categories     | Público (todos)               | Somente admin                            |
| profiles       | Próprio usuário ou admin      | Próprio usuário                          |
| addresses      | Próprio usuário               | Próprio usuário                          |
| orders         | Próprio usuário ou admin      | Edge Function (service_role) + admin UPDATE |
| order_items    | Próprio usuário ou admin      | Edge Function (service_role)             |

> `orders` e `order_items` são escritos pela Edge Function usando `service_role` key,
> que bypassa RLS. Nenhuma policy de INSERT é necessária para o cliente nessas tabelas.
> O admin pode UPDATE em `orders.status` via RLS.

---

## 6. STORAGE (Supabase)

### Bucket: `product-images`
- **Acesso público** para leitura (qualquer um vê as imagens)
- **Upload restrito** a admins via RLS
- Formato aceito: JPG, PNG, WEBP
- Tamanho máximo: 2MB por imagem
- Path padrão: `products/{product_id}/{filename}`

---

## 7. PÁGINAS & ROTAS

### 7.1 Área Pública (Cliente)

| Rota                     | Página               | Descrição                          |
|--------------------------|----------------------|------------------------------------|
| `/`                      | Home                 | Destaques + categorias             |
| `/categoria/:slug`       | Categoria            | Lista de produtos filtrados        |
| `/produto/:id`           | Detalhe do Produto   | Fotos, descrição, preço, add sacola|
| `/sacola`                | Sacola               | Itens, quantidades, subtotal       |
| `/checkout`              | Checkout             | Dados pessoais + endereço + pagamento |
| `/pedido/:id`            | Confirmação          | Resumo do pedido pós-compra        |
| `/minha-conta`           | Minha Conta          | Dados pessoais + histórico pedidos |
| `/login`                 | Login                | Email + senha                      |
| `/cadastro`              | Cadastro             | Criar conta                        |

### 7.2 Área Admin

| Rota                     | Página               | Descrição                          |
|--------------------------|----------------------|------------------------------------|
| `/admin`                 | Dashboard            | Resumo: pedidos recentes, totais   |
| `/admin/produtos`        | Lista Produtos       | Tabela com editar/excluir          |
| `/admin/produtos/novo`   | Criar Produto        | Formulário completo                |
| `/admin/produtos/:id`    | Editar Produto       | Formulário preenchido              |
| `/admin/pedidos`         | Lista Pedidos        | Todos os pedidos + filtros         |
| `/admin/pedidos/:id`     | Detalhe Pedido       | Itens, cliente, endereço, status   |

---

## 8. FUNCIONALIDADES DETALHADAS

### 8.1 Sacola de Compras
- Armazenada 100% no `localStorage` — nunca no banco
- Itens: product_id, nome, preço, quantidade, imagem
- Persiste ao fazer login/logout (não é apagada nem sincronizada)
- É "consumida" no checkout: enviada à Edge Function que valida e cria o pedido
- Após pedido criado com sucesso → localStorage é limpo
- Operações: adicionar, remover, alterar quantidade
- Badge com contador no header

### 8.2 Checkout
1. Exibe resumo da sacola (vinda do localStorage)
2. Se não logado → formulário de cadastro embutido (nome, email, senha, telefone)
3. Se logado → puxa dados do perfil
4. Formulário de endereço (com busca de CEP via ViaCEP API)
5. Cálculo de frete (preview no frontend):
   - Subtotal ≥ R$100 → frete grátis
   - Subtotal < R$100 → valor fixo (R$15,90) — simplificado para MVP
6. Botão "Pagar" → envia sacola + endereço à Edge Function
7. Edge Function valida, cria pedido, retorna URL do MP
8. Frontend redireciona ao Mercado Pago

### 8.3 Mercado Pago — Fluxo

#### Criação do pagamento (Edge Function: `create-checkout`)
1. Recebe: itens da sacola + endereço + JWT do usuário
2. Valida JWT e extrai `user_id`
3. Busca preços reais dos produtos no banco
4. Calcula subtotal, frete e total
5. Cria registro em `orders` (status: `awaiting_payment`) + `order_items`
6. Cria `preference` no Mercado Pago com itens e `external_reference = order.id`
7. Retorna `{ checkout_url, order_id }` ao frontend

#### Retorno do pagamento (webhook: `mp-webhook`)
1. MP envia POST com dados do pagamento
2. Edge Function valida assinatura do webhook
3. Busca `order` pelo `external_reference`
4. Atualiza `orders.mp_payment_id` e `orders.mp_status`
5. Se `mp_status = approved` → atualiza `orders.status` para `processing`
6. Se `mp_status = rejected` → atualiza `orders.status` para `cancelled`

#### URLs de retorno (frontend)
- Sucesso: `/pedido/:id?status=approved`
- Pendente: `/pedido/:id?status=pending`
- Falha: `/pedido/:id?status=failure`

### 8.4 Admin — Gestão de Produtos
- Criar: nome, descrição, preço, preço comparativo, categoria, status estoque, ativo/inativo
- Upload de múltiplas imagens (drag & drop ou seleção)
- Reordenar imagens (posição 1 = capa)
- Editar todos os campos
- Excluir produto (soft delete via `is_active = false`)

### 8.5 Admin — Dashboard
- Total de pedidos (hoje / semana / mês)
- Receita total (mesmo períodos)
- Pedidos recentes (últimos 10)
- Pedidos por status (contadores)

### 8.6 Admin — Gestão de Pedidos
- Lista com filtros: status, data, busca por nome/email
- Detalhe: itens comprados, dados do cliente, endereço, pagamento MP
- Atualizar status manualmente (dropdown)

---

## 9. FASES DE IMPLEMENTAÇÃO

### FASE 1 — Fundação (Supabase + Auth)
- [ ] Criar projeto no Supabase
- [ ] Criar todas as tabelas (SQL)
- [ ] Configurar RLS em todas as tabelas
- [ ] Criar bucket de imagens
- [ ] Seed de categorias
- [ ] Criar admin manualmente
- [ ] Testar auth (signup/login)

### FASE 2 — Frontend Base
- [ ] Setup React + Tailwind + React Router
- [ ] Layout base (Header, Footer, navegação)
- [ ] Página Home
- [ ] Página de Categoria (listagem)
- [ ] Página de Produto (detalhe)
- [ ] Sacola (localStorage)
- [ ] Login / Cadastro

### FASE 3 — Admin
- [ ] Rota protegida (verificação de role)
- [ ] CRUD de produtos (com upload de imagens)
- [ ] Lista e detalhe de pedidos
- [ ] Dashboard básico

### FASE 4 — Checkout & Pagamento
- [ ] Fluxo de checkout (dados + endereço)
- [ ] Edge Function: `create-checkout` (valida, cria pedido, gera preference MP)
- [ ] Edge Function: `mp-webhook` (recebe callback do MP, atualiza pedido)
- [ ] Integração Mercado Pago (Checkout Pro)
- [ ] Página de confirmação/retorno
- [ ] Minha Conta (histórico)

### FASE 5 — Polish & Deploy
- [ ] Responsividade mobile
- [ ] Loading states e tratamento de erros
- [ ] SEO básico (meta tags)
- [ ] Deploy Vercel
- [ ] Domínio customizado
- [ ] Testes finais

---

## 10. DECISÕES ADIADAS (PÓS-MVP)

- Cupons de desconto
- Busca por texto (search)
- Avaliações/reviews de produtos
- Notificações por email (transacionais)
- Múltiplos admins com níveis de permissão
- Cálculo de frete real (Correios/Melhor Envio API)
- Wishlist / favoritos
- Filtros avançados (preço, ordenação)

---

## 11. CONVENÇÕES DE CÓDIGO

- **Idioma do código**: inglês (variáveis, funções, componentes)
- **Idioma da UI**: português (BR)
- **Componentes**: PascalCase (`ProductCard.jsx`)
- **Arquivos utilitários**: camelCase (`formatPrice.js`)
- **CSS**: Tailwind utility classes (sem CSS customizado exceto quando necessário)
- **Estado global**: React Context (carrinho, auth)
- **Requisições**: Supabase JS Client direto (sem camada extra)

---

*Documento aprovado em: ___/___/______*
*Próximo passo: Aprovação → FASE 1*
