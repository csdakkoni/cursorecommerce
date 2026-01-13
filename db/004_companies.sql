-- Companies table to separate TR vs US entities
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  tax_id TEXT,
  address JSONB,
  bank_info JSONB,
  is_tr_company BOOLEAN DEFAULT FALSE,
  is_us_company BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO companies (name, country, currency, is_tr_company) 
VALUES ('Grohn Tekstil', 'TR', 'TRY', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO companies (name, country, currency, is_us_company) 
VALUES ('Grohn LLC', 'US', 'USD', TRUE)
ON CONFLICT DO NOTHING;

-- Link markets to companies (seller per market)
ALTER TABLE markets ADD COLUMN IF NOT EXISTS seller_company_id UUID REFERENCES companies(id);
UPDATE markets SET seller_company_id = (SELECT id FROM companies WHERE is_tr_company = TRUE) WHERE code = 'TR' AND seller_company_id IS NULL;
UPDATE markets SET seller_company_id = (SELECT id FROM companies WHERE is_us_company = TRUE) WHERE code = 'GLOBAL' AND seller_company_id IS NULL;

-- Orders tie to company (seller of record)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
UPDATE orders o SET company_id = m.seller_company_id
FROM markets m
WHERE o.market_code = m.code AND o.company_id IS NULL;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  invoice_type TEXT NOT NULL, -- retail_tr, retail_us, export_b2b
  vat_rate NUMERIC(5,2) DEFAULT 0,
  currency TEXT NOT NULL,
  total NUMERIC(10,2),
  status TEXT DEFAULT 'draft', -- draft | issued | sent
  external_ref TEXT, -- e-fatura/e-arşiv id veya US invoice no
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intercompany invoices (TR -> US for global orders)
CREATE TABLE IF NOT EXISTS intercompany_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_company_id UUID NOT NULL REFERENCES companies(id),
  target_company_id UUID NOT NULL REFERENCES companies(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) DEFAULT 0,
  transfer_pricing_basis TEXT, -- e.g., cost+markup
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);
