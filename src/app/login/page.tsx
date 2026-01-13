'use client';

import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border rounded p-6 space-y-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">Giriş</h1>
          <p className="text-sm text-muted-foreground">Admin için Supabase kullanıcı girişi</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">E-posta</label>
          <input
            type="email"
            className="input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Şifre</label>
          <input
            type="password"
            className="input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-black text-white text-sm font-semibold"
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
        <p className="text-xs text-muted-foreground">
          Kullanıcının user_metadata.role = ADMIN olduğundan emin olun (Supabase Studio &gt; Auth &gt; Users).
        </p>
      </form>
    </div>
  );
}
