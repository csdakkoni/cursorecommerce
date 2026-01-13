import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { 
  IconProducts, 
  IconMaterials, 
  IconOrders, 
  IconMoney,
  IconArrowUp,
  IconArrowDown,
  IconTruck,
  IconChevronRight
} from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [products, materials, orders, pendingOrders] = await Promise.all([
    supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('materials').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('id, total_amount, status'),
    supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).in('status', ['new', 'paid', 'reserved']),
  ]);

  const orderList = orders.data || [];
  const totalRevenue = orderList
    .filter(o => ['reserved', 'production', 'qc', 'shipped'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return {
    productCount: products.count || 0,
    materialCount: materials.count || 0,
    orderCount: orderList.length,
    pendingOrderCount: pendingOrders.count || 0,
    totalRevenue,
  };
}

async function getRecentOrders() {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id, order_type, status, total_amount, currency, created_at, shipping_address')
    .order('created_at', { ascending: false })
    .limit(5);
  return data || [];
}

async function getLowStockMaterials() {
  const { data } = await supabaseAdmin
    .from('fabric_rolls')
    .select('id, material_id, total_meters, reserved_meters, materials(name)')
    .order('total_meters', { ascending: true })
    .limit(5);
  return data || [];
}

const statusColors: Record<string, string> = {
  new: 'badge-info',
  paid: 'badge-success',
  reserved: 'badge-primary',
  production: 'badge-warning',
  qc: 'badge-warning',
  shipped: 'badge-success',
  cancelled: 'badge-gray',
  refunded: 'badge-danger',
  payment_failed: 'badge-danger',
};

export default async function AdminDashboard() {
  const stats = await getStats();
  const recentOrders = await getRecentOrders();
  const lowStockMaterials = await getLowStockMaterials();

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="mb-2">
        <p className="text-[var(--muted)]">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="stat-card">
          <div className="stat-card-icon bg-emerald-100">
            <IconMoney className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="stat-card-value">
            ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-change positive">
            <IconArrowUp className="w-3 h-3" />
            <span>12.5% from last month</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="stat-card">
          <div className="stat-card-icon bg-blue-100">
            <IconOrders className="w-6 h-6 text-blue-600" />
          </div>
          <div className="stat-card-value">{stats.orderCount}</div>
          <div className="stat-card-label">Total Orders</div>
          <div className="stat-card-change positive">
            <IconArrowUp className="w-3 h-3" />
            <span>{stats.pendingOrderCount} pending</span>
          </div>
        </div>

        {/* Products */}
        <div className="stat-card">
          <div className="stat-card-icon bg-violet-100">
            <IconProducts className="w-6 h-6 text-violet-600" />
          </div>
          <div className="stat-card-value">{stats.productCount}</div>
          <div className="stat-card-label">Active Products</div>
          <Link href="/admin/products" className="stat-card-change text-[var(--primary)] hover:underline">
            <span>View all products</span>
            <IconChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Materials */}
        <div className="stat-card">
          <div className="stat-card-icon bg-amber-100">
            <IconMaterials className="w-6 h-6 text-amber-600" />
          </div>
          <div className="stat-card-value">{stats.materialCount}</div>
          <div className="stat-card-label">Materials in Stock</div>
          <Link href="/admin/materials" className="stat-card-change text-[var(--primary)] hover:underline">
            <span>Manage inventory</span>
            <IconChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="card-title">Recent Orders</h3>
              <p className="card-description">Latest orders from your customers</p>
            </div>
            <Link href="/admin/orders" className="btn btn-secondary btn-sm">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="empty-state py-12">
                <div className="empty-state-icon">
                  <IconOrders className="w-8 h-8" />
                </div>
                <p className="empty-state-title">No orders yet</p>
                <p className="empty-state-description">Orders will appear here once customers start purchasing.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-medium">#{order.id.slice(0, 8)}</td>
                      <td className="capitalize">{order.order_type}</td>
                      <td>
                        <span className={`badge ${statusColors[order.status] || 'badge-gray'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="font-medium">
                        {order.currency} {Number(order.total_amount).toLocaleString()}
                      </td>
                      <td className="text-[var(--muted)]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Low Stock Alert</h3>
            <p className="card-description">Materials running low</p>
          </div>
          <div className="card-body p-0">
            {lowStockMaterials.length === 0 ? (
              <div className="empty-state py-8">
                <div className="empty-state-icon">
                  <IconTruck className="w-6 h-6" />
                </div>
                <p className="empty-state-title text-sm">No stock data</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {lowStockMaterials.map((roll) => {
                  const available = (roll.total_meters || 0) - (roll.reserved_meters || 0);
                  const percentage = roll.total_meters ? Math.round((available / roll.total_meters) * 100) : 0;
                  const materialName = (roll.materials as { name?: string })?.name || 'Unknown';
                  return (
                    <div key={roll.id} className="px-6 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--foreground)]">{materialName}</span>
                        <span className="text-xs text-[var(--muted)]">{available}m left</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--background)] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            percentage < 25 ? 'bg-red-500' : percentage < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="card-footer">
            <Link href="/admin/stock" className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1">
              View all stock
              <IconChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-description">Common tasks you might want to do</p>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/products/new" className="btn btn-primary">
              <IconProducts className="w-4 h-4" />
              Add Product
            </Link>
            <Link href="/admin/materials/new" className="btn btn-secondary">
              <IconMaterials className="w-4 h-4" />
              Add Material
            </Link>
            <Link href="/admin/orders" className="btn btn-secondary">
              <IconOrders className="w-4 h-4" />
              Process Orders
            </Link>
            <Link href="/admin/settings/markets" className="btn btn-secondary">
              <IconMoney className="w-4 h-4" />
              Configure Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
