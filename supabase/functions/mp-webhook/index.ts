import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0"

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    let body
    try {
      body = await req.json()
    } catch {
      // Body might be empty or invalid JSON, fallback to query params
      body = {}
    }

    const eventType = body?.type || topic
    const eventDataId = body?.data?.id || id

    if (eventType !== 'payment' || !eventDataId) {
      return new Response('Not a payment event', { status: 200 })
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) throw new Error('MP_ACCESS_TOKEN secret is not set')

    // Fetch payment details from MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${eventDataId}`, {
      headers: {
        'Authorization': `Bearer ${mpToken}`
      }
    })

    if (!mpRes.ok) {
      throw new Error(`Failed to fetch payment ${eventDataId} from MP`)
    }

    const paymentData = await mpRes.json()
    const orderId = paymentData.external_reference
    const mpStatus = paymentData.status // approved, pending, rejected, etc.

    if (!orderId) {
      return new Response('Payment has no external_reference', { status: 200 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // --- IDEMPOTÊNCIA ---
    // Verifica se este payment_id já foi processado anteriormente.
    // O MP pode reenviar o mesmo evento; não podemos processar duas vezes.
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('mp_payment_id, status')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      throw new Error(`Order ${orderId} not found: ${fetchError.message}`)
    }

    if (existingOrder?.mp_payment_id === paymentData.id.toString()) {
      console.log(`[mp-webhook] Evento duplicado ignorado. payment_id=${paymentData.id} já processado para order=${orderId}`)
      return new Response('Already processed', { status: 200 })
    }

    // Map MP status to our order status
    let newOrderStatus = null
    if (mpStatus === 'approved') {
      newOrderStatus = 'processing'
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      newOrderStatus = 'cancelled'
    }

    const updatePayload: any = {
      mp_payment_id: paymentData.id.toString(),
      mp_status: mpStatus
    }

    if (newOrderStatus) {
      updatePayload.status = newOrderStatus
    }

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)

    if (error) {
      throw error
    }

    console.log(`[mp-webhook] Pedido ${orderId} atualizado: mp_status=${mpStatus}, status=${newOrderStatus || 'sem mudança'}`)
    return new Response('OK', { status: 200 })
  } catch (error: any) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
