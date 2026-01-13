import '@/app/globals.css';
import { AdminGuard } from '@/components/admin/AdminGuard';
import Link from 'next/link';

export const metadata = {
  title: 'Admin | Grohn',
  description: 'Admin panel'
};

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/materials', label: 'Materials' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/pricing', label: 'Pricing' },
  { href: '/admin/stock', label: 'Stock' },
  { href: '/admin/settings/markets', label: 'Markets' },
  { href: '/admin/media', label: 'Media' }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-gray-50">
        <aside className="w-56 border-r bg-white">
          <div className="px-4 py-3 font-bold">Admin</div>
          <nav className="space-y-1 px-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded hover:bg-gray-100 text-sm"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AdminGuard>
  );
}
