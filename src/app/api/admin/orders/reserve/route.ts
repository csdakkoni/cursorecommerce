import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

// Simple reservation API: reserve meters on a roll for an order
// Body: { order_id, roll_id, meters }
const schema = z.object({
  order_id: z.string().uuid(),
  roll_id: z.string().uuid(),
  meters: z.number().positive()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { order_id, roll_id, meters } = parsed.data;

  // Use rpc process_reservation
  const { error } = await supabaseAdmin.rpc('process_reservation', {
    p_roll_id: roll_id,
    p_order_id: order_id,
    p_meters: meters
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Optionally move order to reserved if it was new/paid
  await supabaseAdmin
    .from('orders')
    .update({ status: 'reserved' })
    .eq('id', order_id)
    .in('status', ['new', 'paid']);

  return NextResponse.json({ success: true });
}
