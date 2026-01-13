import { OptionGroupForm } from '@/components/admin/OptionGroupForm';
import { OptionValueForm } from '@/components/admin/OptionValueForm';
import { ProductVariantList } from '@/components/admin/ProductVariantList';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';

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

export default async function ProductOptionsPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  const groups = await getGroups(params.id);

  return (
    <div className="space-y-4">
      <Link href="/admin/products" className="text-sm underline">
        ← Products
      </Link>
      <h1 className="text-2xl font-semibold">Options & Variants</h1>
      <p className="text-sm text-muted-foreground">
        {product.title} — {product.product_type} / {product.sales_model}
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <OptionGroupForm productId={product.id} />
        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((g: any) => (
              <div key={g.id} className="border rounded p-3 bg-white">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.type} • {g.affects_price ? 'Fiyat etkiler' : 'Etkilemez'} •{' '}
                      {g.is_required ? 'Zorunlu' : 'Opsiyonel'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Sort {g.sort_order}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">Değerler</div>
                  <div className="space-y-1">
                    {(g.values || []).map((v: any) => (
                      <div key={v.id} className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{v.value}</span>
                        {v.value_en && <span className="text-muted-foreground">({v.value_en})</span>}
                        {v.price_modifier ? <span className="text-emerald-600">+{v.price_modifier}</span> : null}
                        {v.price_modifier_percent ? (
                          <span className="text-emerald-600">+{v.price_modifier_percent}%</span>
                        ) : null}
                        {v.hex_color ? (
                          <span
                            className="inline-block w-4 h-4 rounded border"
                            style={{ backgroundColor: v.hex_color }}
                          />
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {v.is_default ? 'Default' : ''} {v.is_available === false ? '• pasif' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <OptionValueForm groupId={g.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Henüz grup yok.</div>
        )}
      </div>

      <ProductVariantList productId={product.id} />
    </div>
  );
}
