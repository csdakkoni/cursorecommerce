import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const Iyzico = require('iyzipay');

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const token = body.get('token') as string | null;
    if (!token) return NextResponse.json({ error: 'token missing' }, { status: 400 });

    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';
    if (!apiKey || !secretKey) return NextResponse.json({ error: 'Iyzico keys missing' }, { status: 500 });

    const iyzipay = new Iyzico({
      apiKey,
      secretKey,
      uri: baseUrl
    });

    const result: any = await new Promise((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, (err: any, res: any) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    if (result.status !== 'success') {
      // Payment failed
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'payment_failed',
          payment_error: result.errorMessage || result.errorCode || 'payment_failed'
        })
        .eq('payment_token', token);
      return NextResponse.json({ error: 'payment failed' }, { status: 400 });
    }

    // Success: mark paid -> reserved
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'reserved',
        payment_id: result.paymentId,
        payment_details: result
      })
      .eq('payment_token', token);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('iyzico callback error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
