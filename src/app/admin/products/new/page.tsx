import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NewProductPage() {
  const apiExample = `
curl -X POST https://your-domain.com/api/admin/products \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Sample Fabric",
    "slug": "sample-fabric",
    "product_type": "fabric",
    "sales_model": "meter",
    "description": "Example",
    "care_instructions": "Hand wash",
    "is_active": true
  }'
`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Add Product (API)</h1>
      <p className="text-sm text-muted-foreground">
        Şu anda UI form eklemedim. Aşağıdaki REST endpoint ile ürün ekleyebilirsin. İstersen UI formu da ekleyebilirim.
      </p>
      <div className="rounded border bg-white p-3">
        <pre className="whitespace-pre-wrap text-xs text-gray-800">{apiExample}</pre>
      </div>
      <div className="text-sm text-muted-foreground">
        Zorunlu alanlar: title, slug, product_type (fabric/curtain/pillow/tablecloth/runner), sales_model (unit/meter/custom).
      </div>
      <Link href="/admin/products" className="text-sm underline">
        ← Products
      </Link>
    </div>
  );
}
