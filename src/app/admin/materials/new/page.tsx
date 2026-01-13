"use client";

import { useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewMaterialPage() {
  const [form, setForm] = useState({
    name: "",
    composition: "",
    width_cm: "",
    weight_gsm: "",
    shrinkage_ratio: "",
    supplier: "",
    usable_for: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    setOk(false);
    const payload: any = {
      name: form.name,
      composition: form.composition || null,
      width_cm: Number(form.width_cm),
      weight_gsm: form.weight_gsm ? Number(form.weight_gsm) : null,
      shrinkage_ratio: form.shrinkage_ratio ? Number(form.shrinkage_ratio) : null,
      supplier: form.supplier || null,
      usable_for: form.usable_for
        ? form.usable_for.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };
    const res = await fetch("/api/admin/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Hata");
    } else {
      setOk(true);
      setForm({
        name: "",
        composition: "",
        width_cm: "",
        weight_gsm: "",
        shrinkage_ratio: "",
        supplier: "",
        usable_for: "",
      });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Material</h1>
      <div className="grid md:grid-cols-2 gap-3 bg-white border rounded p-4">
        <label className="space-y-1 text-sm">
          <span>Name</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Composition</span>
          <input
            className="input"
            value={form.composition}
            onChange={(e) => setForm((f) => ({ ...f, composition: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Width (cm)</span>
          <input
            className="input"
            type="number"
            value={form.width_cm}
            onChange={(e) => setForm((f) => ({ ...f, width_cm: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Weight (gsm)</span>
          <input
            className="input"
            type="number"
            value={form.weight_gsm}
            onChange={(e) => setForm((f) => ({ ...f, weight_gsm: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Shrinkage Ratio (%)</span>
          <input
            className="input"
            type="number"
            step="0.01"
            value={form.shrinkage_ratio}
            onChange={(e) => setForm((f) => ({ ...f, shrinkage_ratio: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Supplier</span>
          <input
            className="input"
            value={form.supplier}
            onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span>Usable for (comma separated)</span>
          <input
            className="input"
            value={form.usable_for}
            onChange={(e) => setForm((f) => ({ ...f, usable_for: e.target.value }))}
            placeholder="curtain,pillow,tablecloth"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-600">Kayıt eklendi.</p>}
      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white text-sm font-semibold"
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <Link href="/admin/materials" className="text-sm underline">
          ← Materials
        </Link>
      </div>
    </div>
  );
}
