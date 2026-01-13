export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-6">
        <h1 className="text-3xl font-semibold">Grohn Commerce</h1>
        <p className="text-muted-foreground text-sm">
          Tekstil odaklı e-ticaret ve custom perde siparişleri için admin-first iskelet. Admin paneli için /admin
          adresine gidin. Vitrin henüz minimal; sonraki iterasyonda genişleteceğiz.
        </p>
        <div className="rounded-lg border bg-gray-50 p-4 text-sm leading-relaxed">
          <div className="font-semibold mb-2">Hızlı notlar</div>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Supabase env’lerini (.env.local) doldurun; migrations: db/000_base.sql → 001_rbac_rls.sql → 002_audit.sql</li>
            <li>Admin girişi: user_metadata.role = ADMIN (veya roles tablosu üzerinden)</li>
            <li>Görseller: /api/image/upload ile yükle, /api/image/[path]?w=800&fm=webp ile tüket</li>
            <li>Ödeme: TR için Iyzico; global için Stripe stub eklenecek</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <a className="px-4 py-2 rounded bg-black text-white text-sm" href="/admin">
            Admin Paneline Git
          </a>
          <a className="px-4 py-2 rounded border text-sm" href="/api/image/upload">
            Image API (POST form-data)
          </a>
        </div>
      </div>
    </div>
  );
}
