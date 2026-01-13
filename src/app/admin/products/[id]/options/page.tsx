import { OptionGroupForm } from '@/components/admin/OptionGroupForm';
import { OptionValueForm } from '@/components/admin/OptionValueForm';
import { ProductVariantList } from '@/components/admin/ProductVariantList';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { IconChevronRight, IconSettings } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

async function getProduct(id: string) {
  const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function getGroups(id: string) {
  const { data, error } = await supabaseAdmin
    .from('product_option_groups')
    .select('*, values:product_option_values(*)')
    .eq('product_id', id)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
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

export default async function ProductOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  const groups = await getGroups(id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <span className="breadcrumb-item">
          <Link href="/admin/products">Products</Link>
        </span>
        <IconChevronRight className="w-4 h-4 breadcrumb-separator" />
        <span className="breadcrumb-item">
          <Link href={`/admin/products/${id}/edit`}>{product.name}</Link>
        </span>
        <IconChevronRight className="w-4 h-4 breadcrumb-separator" />
        <span className="breadcrumb-item active">Options & Variants</span>
      </nav>

      {/* Product Info */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <IconSettings className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{product.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge badge-gray">
                  {productTypeLabels[product.product_type] || product.product_type}
                </span>
                <span className="badge badge-info">
                  {salesModelLabels[product.sales_model] || product.sales_model}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Option Group Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Add Option Group</h3>
            <p className="card-description">Create groups like Color, Size, etc.</p>
          </div>
          <div className="card-body">
            <OptionGroupForm productId={product.id} />
          </div>
        </div>

        {/* Option Groups List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Option Groups</h3>
            <p className="card-description">{groups.length} groups configured</p>
          </div>
          
          {groups.length === 0 ? (
            <div className="empty-state py-8">
              <p className="empty-state-title text-sm">No option groups</p>
              <p className="empty-state-description text-xs">Add groups to define product variants</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {groups.map((g: { id: string; name: string; type: string; affects_price: boolean; is_required: boolean; sort_order: number; values?: { id: string; value: string; value_en?: string; price_modifier?: number; price_modifier_percent?: number; hex_color?: string; is_default?: boolean; is_available?: boolean }[] }) => (
                <div key={g.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-[var(--foreground)]">{g.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-gray text-xs">{g.type}</span>
                        {g.affects_price && (
                          <span className="badge badge-success text-xs">Affects Price</span>
                        )}
                        {g.is_required && (
                          <span className="badge badge-warning text-xs">Required</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[var(--muted)]">Order: {g.sort_order}</span>
                  </div>

                  {/* Values */}
                  <div className="space-y-2 mb-3">
                    <p className="text-xs font-medium text-[var(--muted)] uppercase">Values</p>
                    <div className="flex flex-wrap gap-2">
                      {(g.values || []).map((v) => (
                        <div
                          key={v.id}
                          className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm
                            ${v.is_available === false ? 'bg-gray-100 text-gray-400' : 'bg-[var(--background)] text-[var(--foreground)]'}
                          `}
                        >
                          {v.hex_color && (
                            <span
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: v.hex_color }}
                            />
                          )}
                          <span className="font-medium">{v.value}</span>
                          {v.value_en && v.value_en !== v.value && (
                            <span className="text-[var(--muted)]">({v.value_en})</span>
                          )}
                          {v.price_modifier ? (
                            <span className="text-emerald-600 text-xs">+${v.price_modifier}</span>
                          ) : null}
                          {v.price_modifier_percent ? (
                            <span className="text-emerald-600 text-xs">+{v.price_modifier_percent}%</span>
                          ) : null}
                          {v.is_default && (
                            <span className="text-xs text-blue-600">★</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Value Form */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <OptionValueForm groupId={g.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Variants Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Product Variants</h3>
          <p className="card-description">Manage stock and pricing for each variant combination</p>
        </div>
        <div className="card-body">
          <ProductVariantList productId={product.id} />
        </div>
      </div>
    </div>
  );
}
