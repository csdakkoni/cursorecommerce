import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const reserveSchema = z.object({
  order_id: z.string().uuid(),
  roll_id: z.string().uuid(),
  meters: z.number().positive()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = reserveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const { order_id, roll_id, meters } = parsed.data;

  const { data: roll, error: rollErr } = await supabaseAdmin
    .from('fabric_rolls')
    .select('id, total_meters, reserved_meters')
    .eq('id', roll_id)
    .single();
  if (rollErr || !roll) return NextResponse.json({ error: 'roll not found' }, { status: 404 });

  const free = (roll.total_meters || 0) - (roll.reserved_meters || 0);
  if (meters > free) return NextResponse.json({ error: 'not enough free meters' }, { status: 400 });

  const { error: txnErr } = await supabaseAdmin.rpc('process_reservation', {
    p_roll_id: roll_id,
    p_order_id: order_id,
    p_meters: meters
  });
  if (txnErr) return NextResponse.json({ error: txnErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
