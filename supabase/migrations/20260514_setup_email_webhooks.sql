-- Habilitar a extensão pg_net para chamadas HTTP (necessário para disparar a Edge Function)
create extension if not exists pg_net;

-- Função genérica para chamar a Edge Function de e-mail
create or replace function public.handle_email_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', case when TG_OP = 'UPDATE' then row_to_json(OLD) else null end
  );

  -- Chamada assíncrona para a Edge Function
  -- Nota: Como a função foi deployada com --no-verify-jwt, não precisamos passar o Authorization Bearer aqui, 
  -- mas passamos o Content-Type para o payload ser interpretado como JSON.
  perform net.http_post(
    url := 'https://SEU_PROJETO.supabase.co/functions/v1/send-email',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  );

  return new;
end;
$$;

-- Gatilho para Pedidos (Update de Status)
-- Dispara sempre que o status do pedido mudar
drop trigger if exists on_order_status_update on public.orders;
create trigger on_order_status_update
  after update on public.orders
  for each row
  execute function public.handle_email_notification();

-- Gatilho para Novos Usuários (Boas-vindas)
-- Dispara quando um novo perfil é criado
drop trigger if exists on_profile_insert on public.profiles;
create trigger on_profile_insert
  after insert on public.profiles
  for each row
  execute function public.handle_email_notification();
