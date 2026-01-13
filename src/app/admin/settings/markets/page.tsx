import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import { IconMarkets, IconMoney, IconTruck, IconPlus } from '@/components/ui/icons';
import { MarketPriceRowActions } from '@/components/admin/MarketPriceRowActions';
import { ShippingProfileRowActions } from '@/components/admin/ShippingProfileRowActions';

export const dynamic = 'force-dynamic';

async function getMarkets() {
  const { data } = await supabaseAdmin
    .from('markets')
    .select('*, companies(name)')
    .order('id');
  return data || [];
}

async function getProductMarketPrices() {
  const { data } = await supabaseAdmin
    .from('product_market_prices')
    .select('*, products(name), markets(id)')
    .order('created_at', { ascending: false });
  return data || [];
}

async function getShippingProfiles() {
  const { data } = await supabaseAdmin
    .from('shipping_profiles')
    .select('*, markets(id)')
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

export default async function MarketsPage() {
  const [markets, marketPrices, shippingProfiles, products] = await Promise.all([
    getMarkets(),
    getProductMarketPrices(),
    getShippingProfiles(),
    getProducts(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <p className="text-[var(--muted)]">Configure regional pricing, currencies, and shipping</p>
        </div>
      </div>

      {/* Markets Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {markets.map((market) => {
          const companyName = (market.companies as { name?: string })?.name || 'Unknown';
          return (
            <div key={market.id} className="card">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    market.id === 'TR' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <IconMarkets className={`w-6 h-6 ${
                      market.id === 'TR' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-[var(--foreground)]">
                      {market.id === 'TR' ? '🇹🇷 Turkey' : '🌍 Global'}
                    </h3>
                    <p className="text-sm text-[var(--muted)] mt-1">{companyName}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <IconMoney className="w-4 h-4 text-[var(--muted)]" />
                        <span className="text-sm font-medium">{market.default_currency}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`badge ${market.id === 'TR' ? 'badge-success' : 'badge-info'}`}>
                          {market.id === 'TR' ? 'Iyzico' : 'Stripe'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Market Prices */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="card-title">Market Prices</h3>
              <p className="card-description">Product prices per region</p>
            </div>
            <Link href="/admin/settings/markets/prices/new" className="btn btn-primary btn-sm">
              <IconPlus className="w-4 h-4" />
              Add Price
            </Link>
          </div>

          {marketPrices.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <IconMoney className="w-6 h-6" />
              </div>
              <p className="empty-state-title text-sm">No market prices</p>
              <p className="empty-state-description text-xs">Set regional prices for your products</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Market</th>
                    <th>Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {marketPrices.map((price) => {
                    const productName = (price.products as { name?: string })?.name || 'Unknown';
                    const marketId = (price.markets as { id?: string })?.id || 'N/A';
                    return (
                      <tr key={price.id}>
                        <td className="font-medium">{productName}</td>
                        <td>
                          <span className={`badge ${marketId === 'TR' ? 'badge-success' : 'badge-info'}`}>
                            {marketId}
                          </span>
                        </td>
                        <td className="font-medium">
                          {price.currency} {Number(price.price).toLocaleString()}
                        </td>
                        <td>
                          <MarketPriceRowActions 
                            id={price.id} 
                            price={price.price} 
                            currency={price.currency} 
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Shipping Profiles */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="card-title">Shipping Profiles</h3>
              <p className="card-description">Shipping rates per region</p>
            </div>
            <Link href="/admin/settings/markets/shipping/new" className="btn btn-primary btn-sm">
              <IconPlus className="w-4 h-4" />
              Add Profile
            </Link>
          </div>

          {shippingProfiles.length === 0 ? (
            <div className="empty-state py-8">
              <div className="empty-state-icon">
                <IconTruck className="w-6 h-6" />
              </div>
              <p className="empty-state-title text-sm">No shipping profiles</p>
              <p className="empty-state-description text-xs">Configure shipping rates for each market</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Market</th>
                    <th>Base / Per kg</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {shippingProfiles.map((profile) => {
                    const marketId = (profile.markets as { id?: string })?.id || 'N/A';
                    return (
                      <tr key={profile.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <IconTruck className="w-4 h-4 text-[var(--muted)]" />
                            <span className="font-medium">{profile.provider}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${marketId === 'TR' ? 'badge-success' : 'badge-info'}`}>
                            {marketId}
                          </span>
                        </td>
                        <td className="text-sm">
                          ${Number(profile.base_rate).toFixed(2)} / ${Number(profile.per_kg_rate).toFixed(2)}
                        </td>
                        <td>
                          <ShippingProfileRowActions 
                            id={profile.id}
                            provider={profile.provider}
                            baseRate={profile.base_rate}
                            perKgRate={profile.per_kg_rate}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <IconMarkets className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Multi-Market Setup</h4>
              <p className="text-sm text-blue-700 mt-1">
                <strong>Turkey (TR):</strong> Prices in TRY, payments via Iyzico, domestic shipping.<br />
                <strong>Global:</strong> Prices in USD/EUR, payments via Stripe, international shipping via UPS/DHL.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
