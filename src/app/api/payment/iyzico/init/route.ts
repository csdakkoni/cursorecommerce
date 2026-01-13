import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const cartSchema = z.object({
  market: z.enum(['TR', 'GLOBAL']).default('TR'),
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      variant_id: z.string().uuid().nullable().optional(),
      quantity: z.number().positive(),
      unit_type: z.string().optional()
    })
  ),
  customer: z.object({
    user_id: z.string().uuid().nullable().optional(),
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
    phone: z.string().optional(),
    identity_number: z.string().optional()
  }),
  shipping_address: z.object({
    address: z.string(),
    city: z.string(),
    zipCode: z.string().optional()
  }),
  billing_address: z
    .object({
      address: z.string(),
      city: z.string(),
      zipCode: z.string().optional()
    })
    .optional(),
  currency: z.enum(['TRY', 'EUR', 'USD']).default('TRY')
});

const Iyzico = require('iyzipay');

function formatPrice(num: number) {
  return Number(num).toFixed(2);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    const { items, customer, shipping_address, billing_address, currency, market } = parsed.data;
    if (market !== 'TR') {
      return NextResponse.json({ error: 'Iyzico only supports TR market' }, { status: 400 });
    }

    // 1) Fetch products/variants and validate availability
    const productIds = items.map((i) => i.product_id);
    const variantIds = items.map((i) => i.variant_id).filter(Boolean) as string[];

    const { data: products, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id, title, price, sale_price, price_eur, sale_price_eur, is_active, sales_model, product_type, has_variants')
      .in('id', productIds);
    if (pErr) throw pErr;

    const { data: variants, error: vErr } = variantIds.length
      ? await supabaseAdmin.from('product_variants').select('id, product_id, option_combination, price_override, stock').in('id', variantIds)
      : { data: [], error: null };
    if (vErr) throw vErr;

    const productMap = new Map(products?.map((p) => [p.id, p]));
    const variantMap = new Map(variants?.map((v) => [v.id, v]));

    // 2) Price calculation and basket
    let subtotal = 0;
    const basketItems: any[] = [];
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product || !product.is_active) {
        return NextResponse.json({ error: `Ürün yok veya pasif: ${item.product_id}` }, { status: 400 });
      }

      let unitPrice: number | undefined;
      if (currency === 'EUR' && product.price_eur) {
        unitPrice = product.sale_price_eur || product.price_eur;
      } else {
        unitPrice = product.sale_price || product.price;
      }
      if (!unitPrice && unitPrice !== 0) {
        return NextResponse.json({ error: `Fiyat bulunamadı: ${product.title}` }, { status: 400 });
      }

      // Variant override
      if (item.variant_id) {
        const variant = variantMap.get(item.variant_id);
        if (!variant || variant.product_id !== product.id) {
          return NextResponse.json({ error: 'Varyant geçersiz' }, { status: 400 });
        }
        if (variant.price_override != null) {
          unitPrice = variant.price_override;
        }
        // stok kontrol (opsiyonel)
        if (variant.stock != null && item.quantity > variant.stock) {
          return NextResponse.json({ error: 'Varyant stok yetersiz' }, { status: 400 });
        }
      }

      const price = Number(unitPrice);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;
      basketItems.push({
        id: item.product_id,
        name: product.title,
        category1: 'Textile',
        category2: 'Standard',
        itemType: Iyzico.BASKET_ITEM_TYPE.PHYSICAL,
        price: formatPrice(lineTotal)
      });
    }

    // 3) Shipping via shipping_profiles (market = TR)
    const { data: shipProfiles, error: shipErr } = await supabaseAdmin
      .from('shipping_profiles')
      .select('*')
      .eq('market_code', 'TR')
      .limit(1);
    if (shipErr) throw shipErr;
    const sp = shipProfiles?.[0];
    const freeShippingThreshold = sp?.free_threshold ?? 500;
    const shippingCost = sp?.flat_cost ?? 29.9;
    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;
    const discount = 0;
    const total = subtotal - discount + shipping;

    // 4) Create order + items snapshot
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: customer.user_id ?? null,
        order_type: 'standard',
        status: 'new',
        currency,
        subtotal,
        discount,
        shipping_cost: shipping,
        total_amount: total,
        payment_method: 'iyzico',
        shipping_address,
        billing_address: billing_address ?? shipping_address
      })
      .select()
      .single();
    if (orderErr || !order) throw orderErr;

    const orderItems = items.map((i) => {
      const product = productMap.get(i.product_id)!;
      const variant = i.variant_id ? variantMap.get(i.variant_id) : null;
      let unitPrice: number =
        currency === 'EUR' && product.price_eur
          ? product.sale_price_eur || product.price_eur
          : product.sale_price || product.price;
      if (variant?.price_override != null) unitPrice = variant.price_override;
      return {
        order_id: order.id,
        product_id: product.id,
        variant_id: variant?.id ?? null,
        product_name: product.title,
        product_type: product.product_type,
        sales_model: product.sales_model,
        unit_type: i.unit_type ?? (product.sales_model === 'meter' ? 'meter' : 'unit'),
        unit_price: unitPrice,
        currency,
        quantity: i.quantity,
        selected_options: variant?.option_combination ?? null,
        variant_name: variant ? JSON.stringify(variant.option_combination) : null
      };
    });

    const { error: oiErr } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (oiErr) throw oiErr;

    // 5) Iyzico init
    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';
    if (!apiKey || !secretKey) {
      return NextResponse.json({ error: 'Iyzico keys missing' }, { status: 500 });
    }
    const iyzipay = new Iyzico({
      apiKey,
      secretKey,
      uri: baseUrl
    });

    const conversationId = `GROHN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/iyzico/callback`;
    const paymentRequest = {
      locale: currency === 'TRY' ? Iyzico.LOCALE.TR : Iyzico.LOCALE.EN,
      conversationId,
      price: formatPrice(subtotal),
      paidPrice: formatPrice(total),
      currency: currency === 'EUR' ? Iyzico.CURRENCY.EUR : currency === 'USD' ? Iyzico.CURRENCY.USD : Iyzico.CURRENCY.TRY,
      installment: '1',
      basketId: order.id,
      paymentChannel: Iyzico.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzico.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      buyer: {
        id: customer.user_id || conversationId,
        name: customer.first_name,
        surname: customer.last_name,
        gsmNumber: customer.phone?.replace(/\D/g, '') || '+905350000000',
        email: customer.email,
        identityNumber: customer.identity_number || '11111111111',
        registrationAddress: shipping_address.address,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
        city: shipping_address.city,
        country: 'Turkey',
        zipCode: shipping_address.zipCode || '34000'
      },
      shippingAddress: {
        contactName: `${customer.first_name} ${customer.last_name}`,
        city: shipping_address.city,
        country: 'Turkey',
        address: shipping_address.address,
        zipCode: shipping_address.zipCode || '34000'
      },
      billingAddress: {
        contactName: `${customer.first_name} ${customer.last_name}`,
        city: (billing_address ?? shipping_address).city,
        country: 'Turkey',
        address: (billing_address ?? shipping_address).address,
        zipCode: (billing_address ?? shipping_address).zipCode || '34000'
      },
      basketItems
    };

    const iyzicoResp: any = await new Promise((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(paymentRequest, (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (iyzicoResp.status !== 'success') {
      return NextResponse.json(
        { error: iyzicoResp.errorMessage || 'Ödeme başlatılamadı', code: iyzicoResp.errorCode },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from('orders')
      .update({
        conversation_id: conversationId,
        payment_token: iyzicoResp.token,
        payment_page_url: iyzicoResp.paymentPageUrl
      })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      token: iyzicoResp.token,
      paymentPageUrl: iyzicoResp.paymentPageUrl
    });
  } catch (err: any) {
    console.error('iyzico init error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
