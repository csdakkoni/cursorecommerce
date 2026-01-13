"use client";

import { useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PRODUCT_TYPES = ["fabric", "curtain", "pillow", "tablecloth", "runner"] as const;
const SALES_MODELS = ["unit", "meter", "custom"] as const;

export default function NewProductPage() {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    product_type: "fabric",
    sales_model: "unit",
    description: "",
    care_instructions: "",
    base_material_id: "",
    is_active: true,
    has_variants: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    setOk(false);
    const payload: any = {
      ...form,
      base_material_id: form.base_material_id || null,
    };
    const res = await fetch("/api/admin/products", {
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
        title: "",
        slug: "",
        product_type: "fabric",
        sales_model: "unit",
        description: "",
        care_instructions: "",
        base_material_id: "",
        is_active: true,
        has_variants: false,
      });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Product</h1>
      <p className="text-sm text-muted-foreground">Zorunlu: title, slug, product_type, sales_model.</p>

      <div className="grid md:grid-cols-2 gap-3 bg-white border rounded p-4">
        <label className="space-y-1 text-sm">
          <span>Title</span>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Slug</span>
          <input
            className="input"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Product Type</span>
          <select
            className="input"
            value={form.product_type}
            onChange={(e) => setForm((f) => ({ ...f, product_type: e.target.value }))}
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Sales Model</span>
          <select
            className="input"
            value={form.sales_model}
            onChange={(e) => setForm((f) => ({ ...f, sales_model: e.target.value }))}
          >
            {SALES_MODELS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span>Description</span>
          <textarea
            className="input"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span>Care Instructions</span>
          <textarea
            className="input"
            value={form.care_instructions}
            onChange={(e) => setForm((f) => ({ ...f, care_instructions: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Base Material ID (opsiyonel)</span>
          <input
            className="input"
            value={form.base_material_id}
            onChange={(e) => setForm((f) => ({ ...f, base_material_id: e.target.value }))}
            placeholder="UUID"
          />
        </label>
        <div className="flex items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <span>Active</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.has_variants}
              onChange={(e) => setForm((f) => ({ ...f, has_variants: e.target.checked }))}
            />
            <span>Has variants</span>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-600">Ürün eklendi.</p>}
      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white text-sm font-semibold"
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <Link href="/admin/products" className="text-sm underline">
          ← Products
        </Link>
      </div>
    </div>
  );
}
