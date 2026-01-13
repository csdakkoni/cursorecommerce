import '@/app/globals.css';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = {
  title: 'Admin | Grohn',
  description: 'Grohn Admin Panel'
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-[var(--background)]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col ml-64">
          <AdminHeader />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
