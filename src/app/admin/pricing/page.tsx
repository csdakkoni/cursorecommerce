import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PricingRuleForm } from './forms/PricingRuleForm';
import { CustomFormulaForm } from './forms/CustomFormulaForm';

export const dynamic = 'force-dynamic';

async function getPricing() {
  const { data, error } = await supabaseAdmin
    .from('pricing_rules')
    .select('*, product:product_id(title, sales_model)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function getCustomFormulas() {
  const { data, error } = await supabaseAdmin
    .from('custom_pricing_formulas')
    .select('*, product:product_id(title)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default async function PricingPage() {
  const [rules, formulas] = await Promise.all([getPricing(), getCustomFormulas()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pricing Rules</h1>
        <p className="text-sm text-muted-foreground">
          Unit/meter/area fiyatları burada. Custom (perde) için formülü aşağıdan bağla.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Ekle / Güncelle</div>
          <p className="text-xs text-muted-foreground">
            Form kaydedildikten sonra listeyi yenilemek için sayfayı tazele.
          </p>
          {rules[0]?.product_id ? (
            <PricingRuleForm productId={rules[0].product_id} />
          ) : (
            <div className="text-xs text-muted-foreground">Örnek: product_id girilmiş bir ürün yok; form için product id lazım.</div>
          )}
        </div>
      </div>

      <div className="overflow-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Pricing Type</th>
              <th className="px-3 py-2 text-left">Base Price</th>
              <th className="px-3 py-2 text-left">Currency</th>
              <th className="px-3 py-2 text-left">Min Qty</th>
              <th className="px-3 py-2 text-left">Step</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.product?.title || r.product_id}</td>
                <td className="px-3 py-2">{r.pricing_type}</td>
                <td className="px-3 py-2">{r.base_price}</td>
                <td className="px-3 py-2">{r.currency}</td>
                <td className="px-3 py-2">{r.min_quantity}</td>
                <td className="px-3 py-2">{r.step}</td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-muted-foreground" colSpan={6}>
                  Kayıt yok. /api/admin/pricing-rules üzerinden ekleyebilirsiniz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-semibold">Custom Pricing (Curtains)</h2>
        <p className="text-sm text-muted-foreground">
          Perde için formül: metraj hesabı + dikim + aksesuar + fire. Ürün sales_model=custom olmalı.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Custom Formula Ekle</div>
          {formulas[0]?.product_id ? (
            <CustomFormulaForm productId={formulas[0].product_id} />
          ) : (
            <div className="text-xs text-muted-foreground">Örnek: product_id girilmiş bir ürün yok; form için product id lazım.</div>
          )}
        </div>
      </div>

      <div className="overflow-auto border rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Sewing</th>
              <th className="px-3 py-2 text-left">Accessory</th>
              <th className="px-3 py-2 text-left">Wastage</th>
              <th className="px-3 py-2 text-left">Fullness</th>
              <th className="px-3 py-2 text-left">Currency</th>
            </tr>
          </thead>
          <tbody>
            {formulas.map((f: any) => (
              <tr key={f.id} className="border-t">
                <td className="px-3 py-2">{f.product?.title || f.product_id}</td>
                <td className="px-3 py-2">{f.sewing_cost}</td>
                <td className="px-3 py-2">{f.accessory_cost}</td>
                <td className="px-3 py-2">{f.wastage_ratio}</td>
                <td className="px-3 py-2">{f.fullness_ratio_default}</td>
                <td className="px-3 py-2">{f.currency}</td>
              </tr>
            ))}
            {formulas.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-muted-foreground" colSpan={6}>
                  Kayıt yok. /api/admin/custom-pricing üzerinden ekleyebilirsiniz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
