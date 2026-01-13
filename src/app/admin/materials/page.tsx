import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { IconPlus, IconEdit, IconMaterials } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

async function getMaterials() {
  const { data } = await supabaseAdmin
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="text-[var(--muted)]">Manage your raw materials and fabrics</p>
        </div>
        <Link href="/admin/materials/new" className="btn btn-primary">
          <IconPlus className="w-4 h-4" />
          Add Material
        </Link>
      </div>

      {/* Materials Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Materials</h3>
          <p className="card-description">{materials.length} materials in inventory</p>
        </div>

        {materials.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconMaterials className="w-8 h-8" />
            </div>
            <p className="empty-state-title">No materials yet</p>
            <p className="empty-state-description">
              Add raw materials to track inventory and associate with products.
            </p>
            <Link href="/admin/materials/new" className="btn btn-primary mt-4">
              <IconPlus className="w-4 h-4" />
              Add Your First Material
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Composition</th>
                  <th>Width</th>
                  <th>Weight</th>
                  <th>Usable For</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <IconMaterials className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{material.name}</p>
                          <p className="text-xs text-[var(--muted)]">ID: {material.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{material.composition || '-'}</span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {material.width_cm ? `${material.width_cm} cm` : '-'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {material.weight_gsm ? `${material.weight_gsm} gsm` : '-'}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {material.usable_for && material.usable_for.length > 0 ? (
                          material.usable_for.slice(0, 3).map((use: string) => (
                            <span key={use} className="badge badge-gray text-xs">
                              {use}
                            </span>
                          ))
                        ) : (
                          <span className="text-[var(--muted)]">-</span>
                        )}
                        {material.usable_for && material.usable_for.length > 3 && (
                          <span className="badge badge-gray text-xs">
                            +{material.usable_for.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/admin/materials/${material.id}/edit`}
                          className="btn btn-ghost btn-sm"
                          title="Edit Material"
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
