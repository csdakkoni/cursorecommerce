"use client";

import { useEffect, useState } from "react";

type Product = { id: string; title: string };

export function PricingForms() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    product_id: "",
    pricing_type: "unit",
    base_price: "",
    currency: "TRY",
    min_quantity: "1",
    step: "1",
  });
  const [formulaForm, setFormulaForm] = useState({
    product_id: "",
    sewing_cost: "",
    accessory_cost: "",
    wastage_ratio: "",
    fullness_ratio_default: "1.0",
    currency: "TRY",
  });

  useEffect(() => {
    async function load() {
      setLoadingProducts(true);
      const res = await fetch("/api/admin/products");
      if (!res.ok) {
        setError("Ürün listesi alınamadı");
        setLoadingProducts(false);
        return;
      }
      const json = await res.json();
      const list = json.data || [];
      setProducts(list);
      if (list[0]) {
        setRuleForm((f) => ({ ...f, product_id: list[0].id }));
        setFormulaForm((f) => ({ ...f, product_id: list[0].id }));
      }
      setLoadingProducts(false);
    }
    load();
  }, []);

  async function saveRule() {
    setError(null);
    setOk(null);
    const payload = {
      ...ruleForm,
      base_price: Number(ruleForm.base_price),
      min_quantity: Number(ruleForm.min_quantity),
      step: Number(ruleForm.step),
    };
    const res = await fetch("/api/admin/pricing-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Pricing rule kaydedilemedi");
    } else {
      setOk("Pricing rule eklendi");
    }
  }

  async function saveFormula() {
    setError(null);
    setOk(null);
    const payload = {
      ...formulaForm,
      sewing_cost: formulaForm.sewing_cost ? Number(formulaForm.sewing_cost) : 0,
      accessory_cost: formulaForm.accessory_cost ? Number(formulaForm.accessory_cost) : 0,
      wastage_ratio: formulaForm.wastage_ratio ? Number(formulaForm.wastage_ratio) : 0,
      fullness_ratio_default: formulaForm.fullness_ratio_default
        ? Number(formulaForm.fullness_ratio_default)
        : 1,
    };
    const res = await fetch("/api/admin/custom-pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Custom formula kaydedilemedi");
    } else {
      setOk("Custom formula eklendi");
    }
  }

  if (loadingProducts) {
    return <div className="text-sm text-muted-foreground">Ürünler yükleniyor...</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3 border rounded p-3 bg-white">
        <div className="text-sm font-semibold">Pricing Rule</div>
        <label className="text-xs">Product</label>
        <select
          className="input"
          value={ruleForm.product_id}
          onChange={(e) => setRuleForm((f) => ({ ...f, product_id: e.target.value }))}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <label className="text-xs">Pricing Type</label>
        <select
          className="input"
          value={ruleForm.pricing_type}
          onChange={(e) => setRuleForm((f) => ({ ...f, pricing_type: e.target.value }))}
        >
          <option value="unit">unit</option>
          <option value="meter">meter</option>
          <option value="area">area</option>
          <option value="custom_formula">custom_formula</option>
        </select>
        <label className="text-xs">Base Price</label>
        <input
          className="input"
          type="number"
          value={ruleForm.base_price}
          onChange={(e) => setRuleForm((f) => ({ ...f, base_price: e.target.value }))}
        />
        <label className="text-xs">Currency</label>
        <input
          className="input"
          value={ruleForm.currency}
          onChange={(e) => setRuleForm((f) => ({ ...f, currency: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">Min Qty</label>
          <input
            className="input"
            type="number"
            value={ruleForm.min_quantity}
            onChange={(e) => setRuleForm((f) => ({ ...f, min_quantity: e.target.value }))}
          />
          <label className="text-xs">Step</label>
          <input
            className="input"
            type="number"
            value={ruleForm.step}
            onChange={(e) => setRuleForm((f) => ({ ...f, step: e.target.value }))}
          />
        </div>
        <button
          onClick={saveRule}
          className="px-3 py-2 rounded bg-black text-white text-sm font-semibold"
        >
          Kaydet (Rule)
        </button>
      </div>

      <div className="space-y-3 border rounded p-3 bg-white">
        <div className="text-sm font-semibold">Custom Formula (Curtain)</div>
        <label className="text-xs">Product</label>
        <select
          className="input"
          value={formulaForm.product_id}
          onChange={(e) => setFormulaForm((f) => ({ ...f, product_id: e.target.value }))}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <label className="text-xs">Sewing Cost</label>
        <input
          className="input"
          type="number"
          value={formulaForm.sewing_cost}
          onChange={(e) => setFormulaForm((f) => ({ ...f, sewing_cost: e.target.value }))}
        />
        <label className="text-xs">Accessory Cost</label>
        <input
          className="input"
          type="number"
          value={formulaForm.accessory_cost}
          onChange={(e) => setFormulaForm((f) => ({ ...f, accessory_cost: e.target.value }))}
        />
        <label className="text-xs">Wastage Ratio</label>
        <input
          className="input"
          type="number"
          value={formulaForm.wastage_ratio}
          onChange={(e) => setFormulaForm((f) => ({ ...f, wastage_ratio: e.target.value }))}
        />
        <label className="text-xs">Fullness Default</label>
        <input
          className="input"
          type="number"
          value={formulaForm.fullness_ratio_default}
          onChange={(e) =>
            setFormulaForm((f) => ({ ...f, fullness_ratio_default: e.target.value }))
          }
        />
        <label className="text-xs">Currency</label>
        <input
          className="input"
          value={formulaForm.currency}
          onChange={(e) => setFormulaForm((f) => ({ ...f, currency: e.target.value }))}
        />
        <button
          onClick={saveFormula}
          className="px-3 py-2 rounded bg-black text-white text-sm font-semibold"
        >
          Kaydet (Custom)
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-600">{ok}</p>}
    </div>
  );
}
