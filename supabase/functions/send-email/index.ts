import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY environment variable.')
    }

    const payload = await req.json()
    console.log('Webhook payload:', payload)

    // Setup Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { type, table, record, old_record } = payload

    // Only process UPDATE events on 'orders' table
    if (table === 'orders' && type === 'UPDATE') {
      const statusChanged = record.status !== old_record.status
      if (!statusChanged) {
        return new Response('No status change', { headers: corsHeaders, status: 200 })
      }

      // Fetch user email
      const { data: userAuth, error: authError } = await supabase.auth.admin.getUserById(record.user_id)
      if (authError || !userAuth.user) {
        throw new Error('User not found or error fetching email')
      }
      
      const userEmail = userAuth.user.email
      
      // Fetch user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', record.user_id)
        .single()
        
      const userName = profile?.full_name?.split(' ')[0] || 'Cliente'

      let subject = ''
      let html = ''

      if (record.status === 'processing') {
        subject = `Pagamento Aprovado! Pedido #${record.id.slice(0, 8)}`
        html = `
          <h2>Olá, ${userName}!</h2>
          <p>Temos uma ótima notícia: o pagamento do seu pedido <strong>#${record.id.slice(0, 8)}</strong> foi aprovado!</p>
          <p>Já começamos a separar os itens no nosso estoque. Assim que o pacote for despachado, avisaremos você por aqui com o código de rastreio.</p>
          <br/>
          <p>Obrigado por comprar conosco!</p>
        `
      } else if (record.status === 'shipped') {
        subject = `Seu pedido está a caminho! 🚚 #${record.id.slice(0, 8)}`
        html = `
          <h2>Olá, ${userName}!</h2>
          <p>Seu pedido <strong>#${record.id.slice(0, 8)}</strong> acabou de ser enviado e está a caminho do seu endereço!</p>
          <p>Você pode acompanhar o status da entrega diretamente pelo site na área Minha Conta.</p>
          <br/>
          <p>Equipe da Loja</p>
        `
      } else if (record.status === 'delivered') {
        subject = `Seu pedido foi entregue! 🎉 #${record.id.slice(0, 8)}`
        html = `
          <h2>Olá, ${userName}!</h2>
          <p>O seu pedido <strong>#${record.id.slice(0, 8)}</strong> foi entregue com sucesso!</p>
          <p>Esperamos que você goste dos seus produtos. Volte sempre!</p>
        `
      } else if (record.status === 'cancelled') {
        subject = `Pedido Cancelado #${record.id.slice(0, 8)}`
        html = `
          <h2>Olá, ${userName}</h2>
          <p>O seu pedido <strong>#${record.id.slice(0, 8)}</strong> foi cancelado.</p>
          <p>Se você acha que isso foi um engano ou se precisar de ajuda, por favor, entre em contato com nosso suporte.</p>
        `
      }

      if (html) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Agon Imports <contato@agonimports.com>',
            to: [userEmail],
            subject: subject,
            html: html
          })
        })

        const resData = await res.json()
        if (!res.ok) {
          throw new Error(`Failed to send email: ${JSON.stringify(resData)}`)
        }
        
        return new Response(JSON.stringify({ success: true, message: 'Email sent', resendId: resData.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }
    
    // Welcome Email logic triggered by profiles table INSERT
    if (table === 'profiles' && type === 'INSERT') {
       // Fetch user email
       const { data: userAuth, error: authError } = await supabase.auth.admin.getUserById(record.id)
       if (authError || !userAuth.user) {
         throw new Error('User not found or error fetching email')
       }
       const userEmail = userAuth.user.email
       const userName = record.full_name?.split(' ')[0] || 'Cliente'

       const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Agon Imports <contato@agonimports.com>',
          to: [userEmail],
          subject: `Bem-vindo(a) à Agon Imports, ${userName}!`,
          html: `
            <h2>Olá, ${userName}! Que bom ter você com a gente na Agon Imports.</h2>
            <p>Sua conta foi criada com sucesso. Você já pode aproveitar nossas ofertas e acompanhar seus pedidos diretamente no site.</p>
            <br/>
            <p>Se tiver qualquer dúvida, basta responder este email.</p>
            <br/>
            <p>Equipe Agon Imports</p>
          `
        })
      })

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(`Failed to send welcome email: ${JSON.stringify(resData)}`)
      }
      
      return new Response(JSON.stringify({ success: true, message: 'Welcome email sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ message: 'No action taken' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
