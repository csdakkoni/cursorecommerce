import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { IconPricing, IconPlus, IconEdit } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

async function getPricingRules() {
  const { data } = await supabaseAdmin
    .from('pricing_rules')
    .select('*, products(name)')
    .order('created_at', { ascending: false });
  return data || [];
}

async function getCustomFormulas() {
  const { data } = await supabaseAdmin
    .from('custom_pricing_formulas')
    .select('*, products(name)')
    .order('created_at', { ascending: false });
  return data || [];
}

async function getProducts() {
  const { data } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .order('name');
  return data || [];
}

const pricingTypeLabels: Record<string, string> = {
  unit: 'Per Unit',
  meter: 'Per Meter',
  area: 'Per Area',
  custom_formula: 'Custom Formula',
};

const pricingTypeColors: Record<string, string> = {
  unit: 'badge-info',
  meter: 'badge-success',
  area: 'badge-warning',
  custom_formula: 'badge-primary',
};

export default async function PricingPage() {
  const [pricingRules, customFormulas, products] = await Promise.all([
    getPricingRules(),
    getCustomFormulas(),
    getProducts(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="text-[var(--muted)]">Configure product pricing rules and custom formulas</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing Rules */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="card-title">Pricing Rules</h3>
              <p className="card-description">Base pricing configurations</p>
            </div>
            <Link href="/admin/pricing/rules/new" className="btn btn-primary btn-sm">
              <IconPlus className="w-4 h-4" />
              Add Rule
            </Link>
          </div>

          {pricingRules.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <IconPricing className="w-6 h-6" />
              </div>
              <p className="empty-state-title text-sm">No pricing rules</p>
              <p className="empty-state-description text-xs">Create rules to define how products are priced</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pricingRules.map((rule) => (
                <div key={rule.id} className="px-6 py-4 hover:bg-[var(--background)] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--foreground)] truncate">
                        {(rule.products as { name?: string })?.name || 'Unknown Product'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${pricingTypeColors[rule.pricing_type] || 'badge-gray'}`}>
                          {pricingTypeLabels[rule.pricing_type] || rule.pricing_type}
                        </span>
                        <span className="text-sm text-[var(--muted)]">
                          ${Number(rule.base_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Link href={`/admin/pricing/rules/${rule.id}/edit`} className="btn btn-ghost btn-sm">
                      <IconEdit className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Formulas */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="card-title">Custom Formulas</h3>
              <p className="card-description">Advanced pricing for custom orders</p>
            </div>
            <Link href="/admin/pricing/formulas/new" className="btn btn-primary btn-sm">
              <IconPlus className="w-4 h-4" />
              Add Formula
            </Link>
          </div>

          {customFormulas.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <IconPricing className="w-6 h-6" />
              </div>
              <p className="empty-state-title text-sm">No custom formulas</p>
              <p className="empty-state-description text-xs">Create formulas for custom curtain orders</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {customFormulas.map((formula) => (
                <div key={formula.id} className="px-6 py-4 hover:bg-[var(--background)] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--foreground)] truncate">
                        {(formula.products as { name?: string })?.name || 'Unknown Product'}
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-[var(--muted)]">
                        <div>Sewing: ${Number(formula.sewing_cost_per_m).toFixed(2)}/m</div>
                        <div>Accessory: ${Number(formula.accessory_cost_per_m).toFixed(2)}/m</div>
                        <div>Fullness: {Number(formula.fullness_ratio).toFixed(1)}x</div>
                        <div>Wastage: {Number(formula.wastage_ratio * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    <Link href={`/admin/pricing/formulas/${formula.id}/edit`} className="btn btn-ghost btn-sm">
                      <IconEdit className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products without pricing */}
      {products.length > 0 && pricingRules.length === 0 && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <IconPricing className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium text-amber-900">Set up pricing</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You have {products.length} products without pricing rules. Add pricing rules to enable sales.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
