import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { IconStock, IconPlus, IconWarning } from '@/components/ui/icons';
import { ReservationActions } from '@/components/admin/ReservationActions';

export const dynamic = 'force-dynamic';

async function getFabricRolls() {
  const { data } = await supabaseAdmin
    .from('fabric_rolls')
    .select('*, materials(name)')
    .order('created_at', { ascending: false });
  return data || [];
}

async function getReservations() {
  const { data } = await supabaseAdmin
    .from('stock_reservations')
    .select('*, fabric_rolls(id, materials(name)), orders(id)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}

export default async function StockPage() {
  const [fabricRolls, reservations] = await Promise.all([
    getFabricRolls(),
    getReservations(),
  ]);

  // Calculate totals
  const totalStock = fabricRolls.reduce((sum, roll) => sum + (roll.total_meters || 0), 0);
  const reservedStock = fabricRolls.reduce((sum, roll) => sum + (roll.reserved_meters || 0), 0);
  const availableStock = totalStock - reservedStock;
  const lowStockCount = fabricRolls.filter(roll => {
    const available = (roll.total_meters || 0) - (roll.reserved_meters || 0);
    return available < 10;
  }).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="text-[var(--muted)]">Track fabric rolls, stock levels, and reservations</p>
        </div>
        <Link href="/admin/stock/new" className="btn btn-primary">
          <IconPlus className="w-4 h-4" />
          Add Roll
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-[var(--border)]">
          <p className="text-2xl font-bold text-[var(--foreground)]">{totalStock.toLocaleString()}m</p>
          <p className="text-sm text-[var(--muted)]">Total Stock</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[var(--border)]">
          <p className="text-2xl font-bold text-emerald-600">{availableStock.toLocaleString()}m</p>
          <p className="text-sm text-[var(--muted)]">Available</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[var(--border)]">
          <p className="text-2xl font-bold text-amber-600">{reservedStock.toLocaleString()}m</p>
          <p className="text-sm text-[var(--muted)]">Reserved</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[var(--border)]">
          <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
          <p className="text-sm text-[var(--muted)]">Low Stock Items</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fabric Rolls */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="card-title">Fabric Rolls</h3>
            <p className="card-description">{fabricRolls.length} rolls in inventory</p>
          </div>

          {fabricRolls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <IconStock className="w-8 h-8" />
              </div>
              <p className="empty-state-title">No fabric rolls</p>
              <p className="empty-state-description">Add fabric rolls to track inventory</p>
              <Link href="/admin/stock/new" className="btn btn-primary mt-4">
                <IconPlus className="w-4 h-4" />
                Add First Roll
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll ID</th>
                    <th>Material</th>
                    <th>Total</th>
                    <th>Reserved</th>
                    <th>Available</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fabricRolls.map((roll) => {
                    const available = (roll.total_meters || 0) - (roll.reserved_meters || 0);
                    const percentage = roll.total_meters ? Math.round((available / roll.total_meters) * 100) : 0;
                    const isLow = available < 10;
                    const materialName = (roll.materials as { name?: string })?.name || 'Unknown';

                    return (
                      <tr key={roll.id}>
                        <td className="font-mono text-sm">#{roll.id.slice(0, 8)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center">
                              <IconStock className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="font-medium">{materialName}</span>
                          </div>
                        </td>
                        <td>{roll.total_meters}m</td>
                        <td className="text-amber-600">{roll.reserved_meters || 0}m</td>
                        <td className="font-medium">{available}m</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-[var(--background)] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  percentage < 25 ? 'bg-red-500' : percentage < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            {isLow && (
                              <IconWarning className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Active Reservations */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Active Reservations</h3>
            <p className="card-description">Stock reserved for orders</p>
          </div>

          {reservations.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <IconStock className="w-6 h-6" />
              </div>
              <p className="empty-state-title text-sm">No reservations</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {reservations.map((res) => {
                const materialName = (res.fabric_rolls as { materials?: { name?: string } })?.materials?.name || 'Unknown';
                const orderId = (res.orders as { id?: string })?.id?.slice(0, 8) || 'N/A';
                
                return (
                  <div key={res.id} className="px-6 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{materialName}</span>
                      <span className="badge badge-warning">{res.reserved_meters}m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--muted)]">Order #{orderId}</span>
                      <ReservationActions reservationId={res.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
