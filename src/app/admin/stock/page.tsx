import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ReservationActions } from '@/components/admin/ReservationActions';

export const dynamic = 'force-dynamic';

async function getRolls() {
  const { data, error } = await supabaseAdmin
    .from('fabric_rolls')
    .select('*, material:material_id(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function getReservations() {
  const { data, error } = await supabaseAdmin
    .from('stock_reservations')
    .select('*, roll:roll_id(roll_code), order:order_id(status)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default async function StockPage() {
  const [rolls, reservations] = await Promise.all([getRolls(), getReservations()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fabric Rolls</h1>
        <p className="text-sm text-muted-foreground">Metraj stok; roll bazlı rezervasyon.</p>
      </div>
      <div className="overflow-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Roll</th>
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-left">Total</th>
              <th className="px-3 py-2 text-left">Reserved</th>
              <th className="px-3 py-2 text-left">Free</th>
              <th className="px-3 py-2 text-left">Location</th>
            </tr>
          </thead>
          <tbody>
            {rolls.map((r: any) => {
              const free = (r.total_meters || 0) - (r.reserved_meters || 0);
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.roll_code || r.id}</td>
                  <td className="px-3 py-2">{r.material?.name || '-'}</td>
                  <td className="px-3 py-2">{r.total_meters}</td>
                  <td className="px-3 py-2">{r.reserved_meters}</td>
                  <td className="px-3 py-2">{free}</td>
                  <td className="px-3 py-2">{r.location || '-'}</td>
                </tr>
              );
            })}
            {rolls.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-muted-foreground">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-2">
        <h2 className="text-xl font-semibold">Reservations</h2>
      </div>
      <div className="overflow-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Roll</th>
              <th className="px-3 py-2 text-left">Meters</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.order_id}</td>
                <td className="px-3 py-2">{r.roll?.roll_code || r.roll_id}</td>
                <td className="px-3 py-2">{r.meters_reserved}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">
                  {r.status === 'reserved' ? (
                    <ReservationActions reservationId={r.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">No actions</span>
                  )}
                </td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-muted-foreground">
                  Rezervasyon yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
