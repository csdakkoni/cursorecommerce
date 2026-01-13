import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

// Allowed status values (keep aligned with DB enum)
const allowedStatuses = [
  'new',
  'reserved',
  'production',
  'qc',
  'shipped',
  'cancelled',
  'refunded',
  'payment_failed'
] as const;

const schema = z.object({
  order_id: z.string().uuid(),
  status: z.enum(allowedStatuses)
});

// Basic transition rules to avoid invalid jumps
const transitions: Record<string, string[]> = {
  new: ['reserved', 'payment_failed', 'cancelled'],
  reserved: ['production', 'cancelled'],
  production: ['qc', 'cancelled'],
  qc: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
  refunded: [],
  payment_failed: []
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    const { order_id, status } = parsed.data;

    // Fetch current status
    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', order_id)
      .single();
    if (oErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const current = order.status as string;
    if (!transitions[current]?.includes(status)) {
      return NextResponse.json({ error: `Transition ${current} -> ${status} not allowed` }, { status: 400 });
    }

    const { error: updErr } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', order_id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('order status error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
