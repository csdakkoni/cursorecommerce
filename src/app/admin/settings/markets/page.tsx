import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { MarketPriceForm } from './forms/MarketPriceForm';
import { ShippingProfileForm } from './forms/ShippingProfileForm';
import { MarketPriceRowActions } from '@/components/admin/MarketPriceRowActions';
import { ShippingProfileRowActions } from '@/components/admin/ShippingProfileRowActions';

export const dynamic = 'force-dynamic';

async function getMarkets() {
  const { data, error } = await supabaseAdmin.from('markets').select('*').order('code', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getShipping() {
  const { data, error } = await supabaseAdmin.from('shipping_profiles').select('*').order('market_code', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getMarketPrices() {
  const { data, error } = await supabaseAdmin
    .from('product_market_prices')
    .select('*, product:product_id(title)')
    .order('market_code', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default async function MarketsPage() {
  const [markets, shipping, prices] = await Promise.all([getMarkets(), getShipping(), getMarketPrices()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Markets & Shipping</h1>
        <p className="text-sm text-muted-foreground">
          TR ve Global için fiyat/kargo profilleri. Fiyatlar product_market_prices tablosu üzerinden yönetilir.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Markets</h2>
        <div className="overflow-auto border rounded bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Currency</th>
                <th className="px-3 py-2 text-left">Locale</th>
                <th className="px-3 py-2 text-left">Default</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m: any) => (
                <tr key={m.code} className="border-t">
                  <td className="px-3 py-2">{m.code}</td>
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2">{m.currency}</td>
                  <td className="px-3 py-2">{m.locale}</td>
                  <td className="px-3 py-2">{m.is_default ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {markets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-muted-foreground">
                    Market yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Product Market Prices</h2>
        <div className="mb-3">
          <MarketPriceForm />
        </div>
        <div className="overflow-auto border rounded bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Market</th>
                <th className="px-3 py-2 text-left">Base</th>
                <th className="px-3 py-2 text-left">Sale</th>
                <th className="px-3 py-2 text-left">Currency</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.product?.title || p.product_id}</td>
                  <td className="px-3 py-2">{p.market_code}</td>
                  <td className="px-3 py-2">{p.base_price}</td>
                  <td className="px-3 py-2">{p.sale_price ?? '-'}</td>
                  <td className="px-3 py-2">{p.currency}</td>
                  <td className="px-3 py-2">
                    <MarketPriceRowActions
                      id={p.id}
                      base_price={p.base_price}
                      sale_price={p.sale_price}
                      currency={p.currency}
                    />
                  </td>
                </tr>
              ))}
              {prices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-muted-foreground">
                    Kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Shipping Profiles</h2>
        <div className="mb-3">
          <ShippingProfileForm />
        </div>
        <div className="overflow-auto border rounded bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Market</th>
                <th className="px-3 py-2 text-left">Free Threshold</th>
                <th className="px-3 py-2 text-left">Flat Cost</th>
                <th className="px-3 py-2 text-left">Currency</th>
                <th className="px-3 py-2 text-left">Carrier</th>
              </tr>
            </thead>
            <tbody>
              {shipping.map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.market_code}</td>
                  <td className="px-3 py-2">{s.free_threshold}</td>
                  <td className="px-3 py-2">{s.flat_cost}</td>
                  <td className="px-3 py-2">{s.currency}</td>
                  <td className="px-3 py-2">{s.carrier || '-'}</td>
                  <td className="px-3 py-2">
                    <ShippingProfileRowActions
                      id={s.id}
                      free_threshold={s.free_threshold}
                      flat_cost={s.flat_cost}
                      currency={s.currency}
                      carrier={s.carrier}
                    />
                  </td>
                </tr>
              ))}
              {shipping.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-muted-foreground">
                    Kargo profili yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
