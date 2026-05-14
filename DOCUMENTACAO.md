# Documentação do Projeto: Agon Imports (E-commerce MVP)

> **Última atualização:** Maio de 2026
> **Objetivo:** Documentar o estado atual, a arquitetura e as recentes integrações construídas no projeto para facilitar a manutenção e o onboarding.

## 1. Visão Geral
O projeto é um **E-commerce focado em Dropshipping** (MVP). O sistema possui uma área pública (vitrine, sacola, checkout) e uma área administrativa (gestão de produtos, pedidos, e categorias).

## 2. Tech Stack e Ferramentas
- **Frontend:** React.js com Vite, Tailwind CSS, React Router DOM.
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **Pagamentos:** Mercado Pago (Checkout Pro - redirecionamento).
- **E-mails Transacionais:** Resend (integrado via Supabase Edge Functions e Webhooks).

## 3. Arquitetura e Fluxos Principais

### Autenticação e Perfis
- O registro cria automaticamente um perfil na tabela `profiles`.
- O disparo de e-mails de boas-vindas é feito automaticamente após a inserção em `profiles`.

### Catálogo e Carrinho
- Produtos são atrelados a Categorias.
- O Carrinho/Sacola é mantido no **localStorage** do cliente. Ele não é sincronizado com o banco de dados.
- O carrinho só é enviado ao backend no momento do **Checkout**.

### Checkout e Pagamentos (Mercado Pago)
1. O cliente preenche o endereço e finaliza a compra.
2. A aplicação (ou uma Edge Function) cria o registro do pedido em `orders` com status `awaiting_payment`.
3. Uma "Preference" do Mercado Pago é gerada e o usuário é redirecionado para pagar.
4. O Webhook do Mercado Pago atualiza o status do pedido (`orders.mp_status` e `orders.status`).

### E-mails Transacionais Automáticos (Webhooks + Resend)
- Utilizamos a extensão **pg_net** do PostgreSQL para disparar requisições HTTP de dentro do banco de dados para nossas Edge Functions.
- **Trigger em `profiles` (Insert):** Quando um cliente se cadastra, o banco chama a Edge Function `send-email` que envia um e-mail de "Bem-vindo" via Resend.
- **Trigger em `orders` (Update):** Quando o status do pedido muda (`processing`, `shipped`, `delivered`, `cancelled`), o banco aciona a Edge Function, que notifica o cliente com o status atualizado do seu pedido via Resend.

## 4. Estrutura do Banco de Dados (Resumo)
- `profiles`: Estende a tabela padrão `auth.users` com `full_name`, `phone` e `role` (admin/customer).
- `addresses`: Endereços salvos dos clientes.
- `categories`: Categorias de produtos.
- `products`: Produtos, com controle de estoque e status (`is_active`).
- `product_images`: Imagens hospedadas no Supabase Storage (bucket `product-images`).
- `orders` e `order_items`: Pedidos gerados e seus respectivos itens, com valores consolidados para evitar fraudes.

## 5. Próximas Tarefas e Funcionalidades
Com base nas implementações mais recentes, as próximas tarefas do MVP são:
1. **Recuperação de Senha (Password Recovery):** Implementar o fluxo no frontend (`ResetPassword.jsx`) e garantir os templates de e-mail no Supabase Auth.
2. **Gestão de Categorias (Admin):** Adicionar contagem de produtos por categoria e a capacidade de inativar categorias (`is_active`), utilizando a nova migration `20260514_add_is_active_to_categories.sql`.
3. **Refinamento do Checkout:** Garantir que o redirecionamento pós-pagamento do Mercado Pago volte corretamente para as telas de confirmação no frontend.
