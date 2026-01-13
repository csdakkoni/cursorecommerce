import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function getMaterials() {
  const { data, error } = await supabaseAdmin.from('materials').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default async function MaterialsPage() {
  const materials = await getMaterials();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Materials</h1>
      <p className="text-sm text-muted-foreground">
        Kumaş tabanları. Ürünlerden ayrı; metre stokları bu materyale bağlı rollerde tutulur.
      </p>
      <div className="overflow-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Width (cm)</th>
              <th className="px-3 py-2 text-left">Composition</th>
              <th className="px-3 py-2 text-left">Supplier</th>
              <th className="px-3 py-2 text-left">Usable For</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m: any) => (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2">{m.width_cm}</td>
                <td className="px-3 py-2">{m.composition}</td>
                <td className="px-3 py-2">{m.supplier}</td>
                <td className="px-3 py-2">{(m.usable_for || []).join(', ')}</td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                  Kayıt yok. /api/admin/materials ile ekleyebilirsin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
