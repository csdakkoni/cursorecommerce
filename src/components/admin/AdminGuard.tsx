'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Status = 'loading' | 'ok' | 'unauthenticated' | 'unauthorized';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setStatus('unauthenticated');
        return;
      }
      const user = data.session.user;
      setEmail(user.email ?? null);
      const role = user.user_metadata?.role;
      if (role === 'ADMIN' || role === 'admin') setStatus('ok');
      else setStatus('unauthorized');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setStatus('unauthenticated');
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Yetki kontrolü yapılıyor...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-lg font-semibold">Giriş gerekiyor</p>
        <button
          className="px-4 py-2 rounded bg-black text-white"
          onClick={() => router.push('/login')}
        >
          Giriş yap
        </button>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2">
        <p className="text-lg font-semibold">Erişim reddedildi</p>
        {email && <p className="text-sm text-muted-foreground">{email}</p>}
        <button
          className="text-sm underline"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
        >
          Çıkış yap
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
