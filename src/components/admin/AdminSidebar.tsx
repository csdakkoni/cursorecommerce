'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconDashboard,
  IconProducts,
  IconMaterials,
  IconOrders,
  IconPricing,
  IconStock,
  IconMarkets,
  IconMedia,
  IconSettings
} from '@/components/ui/icons';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: IconDashboard },
  { name: 'Products', href: '/admin/products', icon: IconProducts },
  { name: 'Materials', href: '/admin/materials', icon: IconMaterials },
  { name: 'Orders', href: '/admin/orders', icon: IconOrders },
  { name: 'Pricing', href: '/admin/pricing', icon: IconPricing },
  { name: 'Stock', href: '/admin/stock', icon: IconStock },
  { name: 'Markets', href: '/admin/settings/markets', icon: IconMarkets },
  { name: 'Media', href: '/admin/media', icon: IconMedia },
];

const settingsNav = [
  { name: 'Settings', href: '/admin/settings', icon: IconSettings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--sidebar-bg)] flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-white font-semibold text-lg">Grohn Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 mb-2">
          Main Menu
        </div>
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${active
                  ? 'bg-[var(--sidebar-active-bg)] text-white'
                  : 'text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-slate-800'
                }
              `}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-[var(--sidebar-icon)]'}`} />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-6 pb-2">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 mb-2">
            System
          </div>
          {settingsNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${active
                    ? 'bg-[var(--sidebar-active-bg)] text-white'
                    : 'text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-slate-800'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-[var(--sidebar-icon)]'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin</p>
            <p className="text-xs text-slate-400 truncate">grohn@grohn.com.tr</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
