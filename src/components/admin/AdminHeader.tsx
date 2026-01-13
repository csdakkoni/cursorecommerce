'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { IconSearch, IconUser, IconLogout, IconChevronDown } from '@/components/ui/icons';

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/products/new': 'New Product',
  '/admin/materials': 'Materials',
  '/admin/materials/new': 'New Material',
  '/admin/orders': 'Orders',
  '/admin/pricing': 'Pricing',
  '/admin/stock': 'Stock & Inventory',
  '/admin/settings/markets': 'Markets & Regions',
  '/admin/media': 'Media Library',
  '/admin/settings': 'Settings',
};

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get page title
  let pageTitle = pageTitles[pathname];
  if (!pageTitle) {
    // Check for dynamic routes
    if (pathname.includes('/products/') && pathname.includes('/options')) {
      pageTitle = 'Product Options';
    } else if (pathname.includes('/products/')) {
      pageTitle = 'Edit Product';
    } else {
      pageTitle = 'Admin';
    }
  }

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">{pageTitle}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <IconSearch className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 h-9 pl-9 pr-4 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all"
          />
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-[var(--background)] transition-colors"
          >
            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
              <IconUser className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">Admin</span>
            <IconChevronDown className={`w-4 h-4 text-[var(--muted)] transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--border)] py-1 z-50">
                <div className="px-4 py-2 border-b border-[var(--border)]">
                  <p className="text-sm font-medium text-[var(--foreground)]">Admin User</p>
                  <p className="text-xs text-[var(--muted)]">grohn@grohn.com.tr</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <IconLogout className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
