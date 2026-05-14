import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Invalid token')

    const body = await req.json()
    const { items, address, origin: bodyOrigin } = body

    if (!items || items.length === 0) throw new Error('Cart is empty')

    // Fetch real prices from database
    const productIds = items.map((i: any) => i.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds)

    if (productsError) throw productsError

    // Calculate subtotal
    let subtotal = 0
    const orderItems = []
    const mpItems = []

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id)
      if (!product) throw new Error(`Product ${item.product_id} not found`)
      
      subtotal += product.price * item.quantity

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price
      })

      mpItems.push({
        id: product.id,
        title: product.name,
        quantity: item.quantity,
        unit_price: Number(product.price),
        currency_id: 'BRL'
      })
    }

    const shippingCost = subtotal >= 100 ? 0 : 15.90
    const total = subtotal + shippingCost

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'awaiting_payment',
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_address: address,
        mp_status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const orderItemsWithOrderId = orderItems.map(item => ({ ...item, order_id: order.id }))
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId)

    if (itemsError) throw itemsError

    // Create Mercado Pago Preference
    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) throw new Error('MP_ACCESS_TOKEN secret is not set')

    const origin = bodyOrigin || req.headers.get('origin') || req.headers.get('Origin') || 'http://localhost:5173'
    const notificationUrl = `${supabaseUrl}/functions/v1/mp-webhook`

    const isHttps = origin.startsWith('https://')

    const payload: any = {
      items: mpItems,
      payer: {
        email: user.email,
      },
      external_reference: order.id,
      notification_url: notificationUrl,
      back_urls: {
        success: `${origin}/pedido/${order.id}?status=approved`,
        pending: `${origin}/pedido/${order.id}?status=pending`,
        failure: `${origin}/pedido/${order.id}?status=failure`
      }
    }

    // MP rejects auto_return when back_urls use http:// (localhost)
    // Only include auto_return with HTTPS origins
    if (isHttps) {
      payload.auto_return = 'approved'
    }

    console.log('MP Payload:', JSON.stringify(payload, null, 2))

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const mpData = await mpRes.json()
    if (!mpRes.ok) {
      console.error('MP Error:', mpData)
      throw new Error(`Failed to create Mercado Pago preference: ${JSON.stringify(mpData)} | Payload Sent: ${JSON.stringify(payload)}`)
    }

    return new Response(
      JSON.stringify({ checkout_url: mpData.init_point, order_id: order.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
