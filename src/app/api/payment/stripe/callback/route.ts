import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();
    if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 });

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Stripe key missing' }, { status: 500 });
    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent']
    });

    const orderId = session.metadata?.order_id;
    if (!orderId) {
      return NextResponse.json({ error: 'order_id missing in metadata' }, { status: 400 });
    }

    const paid = session.payment_status === 'paid';
    const status = paid ? 'reserved' : 'payment_failed';

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status,
        payment_id: session.payment_intent || session.id,
        payment_details: session
      })
      .eq('id', orderId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('stripe callback error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
