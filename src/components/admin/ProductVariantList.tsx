'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconEdit, IconTrash, IconPlus } from '@/components/ui/icons';

interface Variant {
  id: string;
  sku: string;
  options: Record<string, string>;
  stock_qty: number;
  price_override: number | null;
}

interface Props {
  productId: string;
}

export function ProductVariantList({ productId }: Props) {
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ stock_qty: 0, price_override: '' });

  useEffect(() => {
    fetch(`/api/admin/variants?product_id=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setVariants(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  const handleEdit = (variant: Variant) => {
    setEditingId(variant.id);
    setEditForm({
      stock_qty: variant.stock_qty,
      price_override: variant.price_override?.toString() || '',
    });
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch('/api/admin/variants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          stock_qty: editForm.stock_qty,
          price_override: editForm.price_override ? parseFloat(editForm.price_override) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update');
        return;
      }

      setEditingId(null);
      router.refresh();
      // Refresh variants list
      const refreshRes = await fetch(`/api/admin/variants?product_id=${productId}`);
      const refreshData = await refreshRes.json();
      setVariants(refreshData.data || []);
    } catch {
      alert('Error updating variant');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variant?')) return;

    try {
      const res = await fetch(`/api/admin/variants?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
        return;
      }

      setVariants(variants.filter((v) => v.id !== id));
    } catch {
      alert('Error deleting variant');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--muted)] mb-4">No variants created yet.</p>
        <p className="text-sm text-[var(--muted)]">
          Variants are automatically created based on option combinations, or you can add them manually.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Options</th>
            <th>Stock</th>
            <th>Price Override</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.id}>
              <td className="font-mono text-sm">{variant.sku}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(variant.options || {}).map(([key, value]) => (
                    <span key={key} className="badge badge-gray text-xs">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                {editingId === variant.id ? (
                  <input
                    type="number"
                    className="input w-20 text-sm py-1"
                    value={editForm.stock_qty}
                    onChange={(e) => setEditForm({ ...editForm, stock_qty: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                ) : (
                  <span className={variant.stock_qty < 10 ? 'text-red-600 font-medium' : ''}>
                    {variant.stock_qty}
                  </span>
                )}
              </td>
              <td>
                {editingId === variant.id ? (
                  <input
                    type="number"
                    className="input w-24 text-sm py-1"
                    value={editForm.price_override}
                    onChange={(e) => setEditForm({ ...editForm, price_override: e.target.value })}
                    placeholder="Default"
                    step="0.01"
                  />
                ) : (
                  <span>
                    {variant.price_override ? `$${variant.price_override}` : '-'}
                  </span>
                )}
              </td>
              <td>
                <div className="flex items-center justify-end gap-1">
                  {editingId === variant.id ? (
                    <>
                      <button
                        onClick={() => handleSave(variant.id)}
                        className="btn btn-success btn-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(variant)}
                        className="btn btn-ghost btn-sm"
                        title="Edit"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id)}
                        className="btn btn-ghost btn-sm text-red-500 hover:text-red-600"
                        title="Delete"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
