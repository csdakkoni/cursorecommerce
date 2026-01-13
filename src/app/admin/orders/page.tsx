import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { IconOrders, IconEye, IconRefresh } from '@/components/ui/icons';
import { OrderStatusActions } from './actions';

export const dynamic = 'force-dynamic';

async function getOrders() {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

const statusConfig: Record<string, { label: string; color: string; description: string }> = {
  new: { label: 'New', color: 'badge-info', description: 'Awaiting payment' },
  paid: { label: 'Paid', color: 'badge-success', description: 'Payment received' },
  reserved: { label: 'Reserved', color: 'badge-primary', description: 'Stock reserved' },
  production: { label: 'Production', color: 'badge-warning', description: 'Being manufactured' },
  qc: { label: 'QC', color: 'badge-warning', description: 'Quality check' },
  shipped: { label: 'Shipped', color: 'badge-success', description: 'On the way' },
  cancelled: { label: 'Cancelled', color: 'badge-gray', description: 'Order cancelled' },
  refunded: { label: 'Refunded', color: 'badge-danger', description: 'Payment refunded' },
  payment_failed: { label: 'Failed', color: 'badge-danger', description: 'Payment failed' },
};

const orderTypeLabels: Record<string, string> = {
  standard: 'Standard',
  custom_curtain: 'Custom Curtain',
};

export default async function OrdersPage() {
  const orders = await getOrders();

  // Calculate summary stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => ['new', 'paid'].includes(o.status)).length,
    inProgress: orders.filter(o => ['reserved', 'production', 'qc'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'shipped').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="text-[var(--muted)]">Manage and process customer orders</p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          <IconRefresh className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-[var(--border)]">
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
          <p className="text-sm text-[var(--muted)]">Total Orders</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[var(--border)]">
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          <p className="text-sm text-[var(--muted)]">Pending</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[var(--border)]">
          <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
          <p className="text-sm text-[var(--muted)]">In Progress</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[var(--border)]">
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
          <p className="text-sm text-[var(--muted)]">Shipped</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Orders</h3>
          <p className="card-description">Click on status buttons to progress orders through the workflow</p>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconOrders className="w-8 h-8" />
            </div>
            <p className="empty-state-title">No orders yet</p>
            <p className="empty-state-description">
              Orders will appear here when customers make purchases.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const status = statusConfig[order.status] || { label: order.status, color: 'badge-gray', description: '' };
                  const shippingAddress = order.shipping_address as { country?: string; city?: string } | null;
                  
                  return (
                    <tr key={order.id}>
                      <td>
                        <div>
                          <p className="font-medium font-mono text-[var(--foreground)]">
                            #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {order.market_id || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm">
                          {orderTypeLabels[order.order_type] || order.order_type}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-[var(--foreground)]">
                            {shippingAddress?.city || 'Unknown'}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {shippingAddress?.country || '-'}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">
                            {order.currency} {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className={`badge ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {status.description}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-[var(--foreground)]">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <OrderStatusActions orderId={order.id} currentStatus={order.status} />
                          <Link 
                            href={`/admin/orders/${order.id}`}
                            className="btn btn-ghost btn-sm"
                            title="View Details"
                          >
                            <IconEye className="w-4 h-4" />
                          </Link>
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
    </div>
  );
}
