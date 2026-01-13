import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function getProducts() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, base_material:base_material_id(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Products</h1>
      <p className="text-sm text-muted-foreground">
        Ürünler; satış modeli (unit/meter/custom) ve product_type ayrı tutulur.
      </p>
      <div className="overflow-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Sales Model</th>
              <th className="px-3 py-2 text-left">Base Material</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Variants</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">{p.title}</td>
                <td className="px-3 py-2">{p.product_type}</td>
                <td className="px-3 py-2">{p.sales_model}</td>
                <td className="px-3 py-2">{p.base_material?.name || '-'}</td>
                <td className="px-3 py-2">{p.is_active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">{p.has_variants ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">
                  <a className="text-xs underline" href={`/admin/products/${p.id}/options`}>
                    Options
                  </a>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-muted-foreground" colSpan={7}>
                  Kayıt yok. /api/admin/products ile ekleyebilirsin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
