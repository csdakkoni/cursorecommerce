'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconChevronRight } from '@/components/ui/icons';

const usableForOptions = [
  { value: 'curtain', label: 'Curtain' },
  { value: 'pillow', label: 'Pillow Cover' },
  { value: 'tablecloth', label: 'Tablecloth' },
  { value: 'runner', label: 'Runner' },
  { value: 'upholstery', label: 'Upholstery' },
];

export default function NewMaterialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    composition: '',
    width_cm: '',
    weight_gsm: '',
    shrinkage_ratio: '',
    usable_for: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          composition: form.composition || null,
          width_cm: form.width_cm ? parseFloat(form.width_cm) : null,
          weight_gsm: form.weight_gsm ? parseFloat(form.weight_gsm) : null,
          shrinkage_ratio: form.shrinkage_ratio ? parseFloat(form.shrinkage_ratio) : null,
          usable_for: form.usable_for.length > 0 ? form.usable_for : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create material');
      }

      router.push('/admin/materials');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleUsableFor = (value: string) => {
    setForm(prev => ({
      ...prev,
      usable_for: prev.usable_for.includes(value)
        ? prev.usable_for.filter(v => v !== value)
        : [...prev.usable_for, value]
    }));
  };

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="breadcrumb mb-6">
        <span className="breadcrumb-item">
          <Link href="/admin/materials">Materials</Link>
        </span>
        <IconChevronRight className="w-4 h-4 breadcrumb-separator" />
        <span className="breadcrumb-item active">New Material</span>
      </nav>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Add New Material</h3>
          <p className="card-description">Define a new raw material for your inventory</p>
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
              <label className="label">Material Name *</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Premium Velvet"
                required
              />
            </div>

            {/* Composition */}
            <div className="form-group">
              <label className="label">Composition</label>
              <input
                type="text"
                className="input"
                value={form.composition}
                onChange={(e) => setForm({ ...form, composition: e.target.value })}
                placeholder="e.g., 100% Cotton, 60% Polyester 40% Cotton"
              />
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-3 gap-4">
              {/* Width */}
              <div className="form-group">
                <label className="label">Width (cm)</label>
                <input
                  type="number"
                  className="input"
                  value={form.width_cm}
                  onChange={(e) => setForm({ ...form, width_cm: e.target.value })}
                  placeholder="140"
                  min="0"
                  step="1"
                />
              </div>

              {/* Weight */}
              <div className="form-group">
                <label className="label">Weight (gsm)</label>
                <input
                  type="number"
                  className="input"
                  value={form.weight_gsm}
                  onChange={(e) => setForm({ ...form, weight_gsm: e.target.value })}
                  placeholder="280"
                  min="0"
                  step="1"
                />
              </div>

              {/* Shrinkage */}
              <div className="form-group">
                <label className="label">Shrinkage (%)</label>
                <input
                  type="number"
                  className="input"
                  value={form.shrinkage_ratio}
                  onChange={(e) => setForm({ ...form, shrinkage_ratio: e.target.value })}
                  placeholder="3"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            {/* Usable For */}
            <div className="form-group">
              <label className="label">Usable For</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {usableForOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleUsableFor(option.value)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${form.usable_for.includes(option.value)
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--background)] text-[var(--muted)] hover:bg-[var(--border)]'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="form-hint mt-2">Select which product types this material can be used for</p>
            </div>
          </div>

          <div className="card-footer flex justify-between">
            <Link href="/admin/materials" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
