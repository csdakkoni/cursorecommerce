export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { OrderStatusActions } from './actions';

async function getOrders() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/orders/list`, {
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export default async function OrdersPage() {
  const orders = await getOrders();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="text-sm text-muted-foreground">
        Basit liste. Status değişimi için /api/admin/orders/status endpoint’ini kullanın veya ileride UI ekleyebiliriz.
      </p>
      <div className="overflow-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Total</th>
              <th className="px-3 py-2 text-left">Shipping</th>
              <th className="px-3 py-2 text-left">Actions</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{o.id}</td>
                <td className="px-3 py-2">{o.status}</td>
                <td className="px-3 py-2">{o.order_type}</td>
                <td className="px-3 py-2">
                  {o.total_amount} {o.currency}
                </td>
                <td className="px-3 py-2">{o.shipping_cost}</td>
                <td className="px-3 py-2">
                  <OrderStatusActions orderId={o.id} current={o.status} />
                </td>
                <td className="px-3 py-2">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-muted-foreground">
                  Sipariş yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
