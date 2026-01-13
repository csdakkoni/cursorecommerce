import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { stripeCartSchema } from './types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = stripeCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    // Stripe sadece GLOBAL
    if (parsed.data.market !== 'GLOBAL') return NextResponse.json({ error: 'Stripe sadece GLOBAL market' }, { status: 400 });

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Stripe key missing' }, { status: 500 });
    const stripe = new Stripe(secret);

    const { items, currency, customer, shipping_address, billing_address } = parsed.data;

    // Fetch products + market prices + variants (no variant override yet)
    const productIds = items.map((i) => i.product_id);
    const { data: pmp, error: pmpErr } = await supabaseAdmin
      .from('product_market_prices')
      .select('product_id, base_price, sale_price, currency')
      .in('product_id', productIds)
      .eq('market_code', 'GLOBAL');
    if (pmpErr) throw pmpErr;

    const { data: products, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, title, price, sale_price, product_type, sales_model')
      .in('id', productIds);
    if (prodErr) throw prodErr;

    const pmpMap = new Map(pmp?.map((r) => [r.product_id, r]));
    const prodMap = new Map(products?.map((p) => [p.id, p]));

    // Shipping profile GLOBAL
    const { data: shipProfiles, error: shipErr } = await supabaseAdmin
      .from('shipping_profiles')
      .select('*')
      .eq('market_code', 'GLOBAL')
      .limit(1);
    if (shipErr) throw shipErr;
    const sp = shipProfiles?.[0];

    const lineItems = items.map((i) => {
      const product = prodMap.get(i.product_id);
      const marketPrice = pmpMap.get(i.product_id);
      const price = marketPrice
        ? (marketPrice.sale_price ?? marketPrice.base_price)
        : product?.sale_price ?? product?.price ?? 0;
      return {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: product?.title || i.product_id },
          unit_amount: Math.round(Number(price) * 100)
        },
        quantity: i.quantity
      };
    });

    // Add shipping as a line item if needed
    const subtotal = lineItems.reduce((acc, li) => acc + (li.price_data?.unit_amount || 0) * (li.quantity || 1), 0) / 100;
    const shippingCost = sp?.flat_cost ?? 0;
    const freeThreshold = sp?.free_threshold ?? Infinity;
    const addShipping = subtotal < freeThreshold && shippingCost > 0;
    if (addShipping) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: 'Shipping' },
          unit_amount: Math.round(Number(shippingCost) * 100)
        },
        quantity: 1
      });
    }

    // Create order snapshot
    const discount = 0;
    const total_amount = subtotal + (addShipping ? shippingCost : 0);
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customer.user_id ?? null,
        order_type: 'standard',
        status: 'new',
        currency,
        subtotal,
        discount,
        shipping_cost: addShipping ? shippingCost : 0,
        total_amount,
        payment_method: 'stripe',
        shipping_address,
        billing_address: billing_address ?? shipping_address
      })
      .select()
      .single();
    if (orderErr || !order) throw orderErr;

    const orderItems = items.map((i) => {
      const product = prodMap.get(i.product_id);
      const marketPrice = pmpMap.get(i.product_id);
      const price = marketPrice
        ? (marketPrice.sale_price ?? marketPrice.base_price)
        : product?.sale_price ?? product?.price ?? 0;
      return {
        order_id: order.id,
        product_id: product?.id,
        variant_id: i.variant_id ?? null,
        product_name: product?.title || i.product_id,
        product_type: product?.product_type,
        sales_model: product?.sales_model,
        unit_type: i.unit_type ?? (product?.sales_model === 'meter' ? 'meter' : 'unit'),
        unit_price: price,
        currency,
        quantity: i.quantity,
        selected_options: null,
        variant_name: null
      };
    });
    const { error: oiErr } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (oiErr) throw oiErr;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: parsed.data.success_url,
      cancel_url: parsed.data.cancel_url,
      customer_email: customer.email,
      shipping_address_collection: {
        allowed_countries: ['US', 'GB', 'DE', 'FR', 'NL', 'TR', 'AE', 'SA']
      },
      metadata: {
        market: 'GLOBAL',
        currency,
        shipping_country: shipping_address.country || 'United States',
        add_shipping: addShipping ? 'yes' : 'no',
        order_id: order.id
      }
    });

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (err: any) {
    console.error('stripe init error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
