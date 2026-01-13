import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { IconPlus, IconEdit, IconEye, IconSettings } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

async function getProducts() {
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

const productTypeLabels: Record<string, string> = {
  fabric: 'Fabric',
  curtain: 'Curtain',
  pillow: 'Pillow Cover',
  tablecloth: 'Tablecloth',
  runner: 'Runner',
};

const salesModelLabels: Record<string, string> = {
  unit: 'Per Unit',
  meter: 'Per Meter',
  custom: 'Custom',
};

const salesModelColors: Record<string, string> = {
  unit: 'badge-info',
  meter: 'badge-success',
  custom: 'badge-warning',
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="text-[var(--muted)]">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <IconPlus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Products</h3>
          <p className="card-description">{products.length} products in your catalog</p>
        </div>
        
        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconPlus className="w-8 h-8" />
            </div>
            <p className="empty-state-title">No products yet</p>
            <p className="empty-state-description">
              Start by adding your first product to the catalog.
            </p>
            <Link href="/admin/products/new" className="btn btn-primary mt-4">
              <IconPlus className="w-4 h-4" />
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Sales Model</th>
                  <th>Base Price</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--background)] rounded-lg flex items-center justify-center text-[var(--muted)]">
                          <IconEye className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                          <p className="text-xs text-[var(--muted)]">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{productTypeLabels[product.product_type] || product.product_type}</span>
                    </td>
                    <td>
                      <span className={`badge ${salesModelColors[product.sales_model] || 'badge-gray'}`}>
                        {salesModelLabels[product.sales_model] || product.sales_model}
                      </span>
                    </td>
                    <td className="font-medium">
                      {product.base_price ? `$${Number(product.base_price).toFixed(2)}` : '-'}
                    </td>
                    <td>
                      <span className={`badge ${product.active ? 'badge-success' : 'badge-gray'}`}>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/products/${product.id}/options`}
                          className="btn btn-ghost btn-sm"
                          title="Manage Options & Variants"
                        >
                          <IconSettings className="w-4 h-4" />
                        </Link>
                        <Link 
                          href={`/admin/products/${product.id}/edit`}
                          className="btn btn-ghost btn-sm"
                          title="Edit Product"
                        >
                          <IconEdit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
