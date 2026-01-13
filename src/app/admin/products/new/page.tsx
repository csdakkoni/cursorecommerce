'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconChevronRight } from '@/components/ui/icons';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    product_type: 'fabric',
    sales_model: 'unit',
    base_price: '',
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          base_price: form.base_price ? parseFloat(form.base_price) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="breadcrumb mb-6">
        <span className="breadcrumb-item">
          <Link href="/admin/products">Products</Link>
        </span>
        <IconChevronRight className="w-4 h-4 breadcrumb-separator" />
        <span className="breadcrumb-item active">New Product</span>
      </nav>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Create New Product</h3>
          <p className="card-description">Add a new product to your catalog</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-body space-y-5">
            {error && (
              <div className="p-4 bg-[var(--danger-light)] border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Name */}
            <div className="form-group">
              <label className="label">Product Name *</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => {
                  setForm({ 
                    ...form, 
                    name: e.target.value,
                    slug: generateSlug(e.target.value)
                  });
                }}
                placeholder="e.g., Premium Cotton Fabric"
                required
              />
            </div>

            {/* Slug */}
            <div className="form-group">
              <label className="label">Slug *</label>
              <input
                type="text"
                className="input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="premium-cotton-fabric"
                required
              />
              <p className="form-hint">URL-friendly identifier (auto-generated from name)</p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Product Type */}
              <div className="form-group">
                <label className="label">Product Type *</label>
                <select
                  className="input"
                  value={form.product_type}
                  onChange={(e) => setForm({ ...form, product_type: e.target.value })}
                >
                  <option value="fabric">Fabric</option>
                  <option value="curtain">Curtain</option>
                  <option value="pillow">Pillow Cover</option>
                  <option value="tablecloth">Tablecloth</option>
                  <option value="runner">Runner</option>
                </select>
              </div>

              {/* Sales Model */}
              <div className="form-group">
                <label className="label">Sales Model *</label>
                <select
                  className="input"
                  value={form.sales_model}
                  onChange={(e) => setForm({ ...form, sales_model: e.target.value })}
                >
                  <option value="unit">Per Unit</option>
                  <option value="meter">Per Meter</option>
                  <option value="custom">Custom Order</option>
                </select>
              </div>
            </div>

            {/* Base Price */}
            <div className="form-group">
              <label className="label">Base Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
                <input
                  type="number"
                  className="input pl-7"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="form-hint">Leave empty if price varies by market</p>
            </div>

            {/* Active Status */}
            <div className="form-group">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">Active</span>
                <span className="text-sm text-[var(--muted)]">Product will be visible in the store</span>
              </label>
            </div>
          </div>

          <div className="card-footer flex justify-between">
            <Link href="/admin/products" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
