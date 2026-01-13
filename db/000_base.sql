-- Core schema for textile e-commerce (clean baseline)
-- Run this as the first migration.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE product_type_enum AS ENUM ('fabric','curtain','pillow','tablecloth','runner');
CREATE TYPE sales_model_enum AS ENUM ('unit','meter','custom');
CREATE TYPE order_type_enum AS ENUM ('standard','custom');
CREATE TYPE order_status_enum AS ENUM (
  'new','measured','reserved','production','qc','shipped','cancelled','refunded','payment_failed'
);
CREATE TYPE pricing_type_enum AS ENUM ('unit','meter','area','custom_formula');
CREATE TYPE option_group_type_enum AS ENUM ('select','radio','color_swatch','size_grid');
CREATE TYPE reservation_status_enum AS ENUM ('reserved','released','consumed','expired');
CREATE TYPE order_status_strict_enum AS ENUM ('new','reserved','production','qc','shipped','cancelled','refunded','payment_failed','paid');

-- Simple order status transition function (server-side guard)
CREATE OR REPLACE FUNCTION can_transition(p_from order_status_strict_enum, p_to order_status_strict_enum)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (p_from = 'new' AND p_to IN ('reserved','payment_failed','cancelled'))
    OR (p_from = 'reserved' AND p_to IN ('production','cancelled'))
    OR (p_from = 'production' AND p_to IN ('qc','cancelled'))
    OR (p_from = 'qc' AND p_to IN ('shipped','cancelled'))
    OR (p_from = 'paid' AND p_to IN ('reserved','payment_failed','cancelled'))
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Markets (TR / GLOBAL, etc.)
CREATE TABLE markets (
  code TEXT PRIMARY KEY, -- e.g. TR, GLOBAL
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  locale TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);
INSERT INTO markets (code, name, currency, locale, is_default)
VALUES ('TR', 'Türkiye', 'TRY', 'tr', TRUE)
ON CONFLICT (code) DO NOTHING;
INSERT INTO markets (code, name, currency, locale, is_default)
VALUES ('GLOBAL', 'Global', 'USD', 'en', FALSE)
ON CONFLICT (code) DO NOTHING;

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Materials (fabric base)
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  composition TEXT,
  width_cm INTEGER CHECK (width_cm > 0),
  weight_gsm INTEGER,
  shrinkage_ratio NUMERIC(5,2),
  supplier TEXT,
  usable_for TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trg_materials_updated_at
BEFORE UPDATE ON materials FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  product_type product_type_enum NOT NULL,
  sales_model sales_model_enum NOT NULL,
  base_material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  description TEXT,
  care_instructions TEXT,
  attributes JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  has_variants BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT product_type_sales_model_check CHECK (product_type IS NOT NULL AND sales_model IS NOT NULL)
);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_sales_model ON products(sales_model);
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Product option groups & values
CREATE TABLE product_option_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  type option_group_type_enum DEFAULT 'select',
  is_required BOOLEAN DEFAULT TRUE,
  affects_price BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_option_groups_product ON product_option_groups(product_id);
CREATE TRIGGER trg_option_groups_updated_at
BEFORE UPDATE ON product_option_groups FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id UUID NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  value_en TEXT,
  price_modifier NUMERIC(10,2) DEFAULT 0,
  price_modifier_percent NUMERIC(5,2) DEFAULT 0,
  sku_suffix TEXT,
  image TEXT,
  hex_color VARCHAR(7),
  is_default BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_option_values_group ON product_option_values(option_group_id);
CREATE TRIGGER trg_option_values_updated_at
BEFORE UPDATE ON product_option_values FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Product variants (stocked combinations)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_combination JSONB NOT NULL,
  sku VARCHAR(100) UNIQUE,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  price_override NUMERIC(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE TRIGGER trg_product_variants_updated_at
BEFORE UPDATE ON product_variants FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Market-specific product prices
CREATE TABLE product_market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  market_code TEXT NOT NULL REFERENCES markets(code) ON DELETE CASCADE,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  sale_price NUMERIC(10,2),
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX uq_product_market ON product_market_prices(product_id, market_code);

-- Pricing rules
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pricing_type pricing_type_enum NOT NULL,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  currency VARCHAR(10) DEFAULT 'TRY',
  min_quantity NUMERIC(10,2) DEFAULT 1 CHECK (min_quantity > 0),
  step NUMERIC(10,2) DEFAULT 1 CHECK (step > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX uq_pricing_rule_per_type ON pricing_rules(product_id, pricing_type);

-- Shipping profiles by market
CREATE TABLE shipping_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_code TEXT NOT NULL REFERENCES markets(code) ON DELETE CASCADE,
  free_threshold NUMERIC(10,2) DEFAULT 0,
  flat_cost NUMERIC(10,2) DEFAULT 0,
  currency TEXT NOT NULL,
  carrier TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX uq_shipping_market ON shipping_profiles(market_code);

-- Custom pricing formulas (curtains)
CREATE TABLE custom_pricing_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sewing_cost NUMERIC(10,2) DEFAULT 0,
  accessory_cost NUMERIC(10,2) DEFAULT 0,
  wastage_ratio NUMERIC(5,2) DEFAULT 0,
  fullness_ratio_default NUMERIC(5,2) DEFAULT 1.0,
  currency VARCHAR(10) DEFAULT 'TRY',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Measurement profiles (customer reusable sizes)
CREATE TABLE measurement_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  name TEXT NOT NULL,
  width_cm INTEGER NOT NULL CHECK (width_cm > 0),
  height_cm INTEGER NOT NULL CHECK (height_cm > 0),
  ceiling_height INTEGER,
  mounting_type TEXT,
  fullness_ratio NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Curtain production rules (internal)
CREATE TABLE curtain_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stitching_type TEXT,
  hem_allowance_cm INTEGER,
  panel_max_width INTEGER,
  wastage_ratio NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fabric rolls (meter-based stock)
CREATE TABLE fabric_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id),
  roll_code TEXT UNIQUE,
  total_meters NUMERIC(10,2) NOT NULL CHECK (total_meters >= 0),
  reserved_meters NUMERIC(10,2) DEFAULT 0 CHECK (reserved_meters >= 0),
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TRIGGER trg_fabric_rolls_updated_at
BEFORE UPDATE ON fabric_rolls FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  order_type order_type_enum NOT NULL,
  status order_status_strict_enum DEFAULT 'new',
  currency VARCHAR(10) DEFAULT 'TRY',
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  conversation_id TEXT,
  payment_token TEXT,
  payment_id TEXT,
  payment_details JSONB,
  shipping_address JSONB,
  billing_address JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_orders_status ON orders(status);
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Reservation helper: process_reservation
-- Atomically reserve meters on a roll and record reservation
CREATE OR REPLACE FUNCTION process_reservation(p_roll_id UUID, p_order_id UUID, p_meters NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_free NUMERIC;
BEGIN
  SELECT (total_meters - reserved_meters) INTO v_free FROM fabric_rolls WHERE id = p_roll_id FOR UPDATE;
  IF v_free IS NULL THEN
    RAISE EXCEPTION 'Roll not found';
  END IF;
  IF p_meters > v_free THEN
    RAISE EXCEPTION 'Not enough free meters';
  END IF;

  UPDATE fabric_rolls
    SET reserved_meters = reserved_meters + p_meters
    WHERE id = p_roll_id;

  INSERT INTO stock_reservations (order_id, roll_id, meters_reserved, status)
    VALUES (p_order_id, p_roll_id, p_meters, 'reserved');
END;
$$ LANGUAGE plpgsql;

-- Stock reservations (roll-specific, tied to orders)
CREATE TABLE stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  roll_id UUID REFERENCES fabric_rolls(id) ON DELETE SET NULL,
  meters_reserved NUMERIC(10,2) NOT NULL CHECK (meters_reserved > 0),
  status reservation_status_enum DEFAULT 'reserved',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Release reservation helper
CREATE OR REPLACE FUNCTION release_reservation(p_reservation_id UUID)
RETURNS VOID AS $$
DECLARE
  v_res record;
BEGIN
  SELECT * INTO v_res FROM stock_reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;
  IF v_res.status <> 'reserved' THEN
    RAISE EXCEPTION 'Only reserved status can be released';
  END IF;

  UPDATE fabric_rolls
    SET reserved_meters = GREATEST(0, reserved_meters - v_res.meters_reserved)
    WHERE id = v_res.roll_id;

  UPDATE stock_reservations
    SET status = 'released'
    WHERE id = p_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Consume reservation helper (production)
CREATE OR REPLACE FUNCTION consume_reservation(p_reservation_id UUID)
RETURNS VOID AS $$
DECLARE
  v_res record;
BEGIN
  SELECT * INTO v_res FROM stock_reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;
  IF v_res.status <> 'reserved' THEN
    RAISE EXCEPTION 'Only reserved status can be consumed';
  END IF;

  UPDATE fabric_rolls
    SET reserved_meters = GREATEST(0, reserved_meters - v_res.meters_reserved),
        total_meters    = GREATEST(0, total_meters - v_res.meters_reserved)
    WHERE id = v_res.roll_id;

  UPDATE stock_reservations
    SET status = 'consumed'
    WHERE id = p_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Order items with price snapshot
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  product_type product_type_enum,
  sales_model sales_model_enum,
  unit_type TEXT, -- meter/unit/custom snapshot
  unit_price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TRY',
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  selected_options JSONB,
  variant_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Media assets
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  role TEXT, -- hero | detail | swatch
  original_path TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  content_type TEXT,
  hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Basic helper indexes
CREATE INDEX idx_media_assets_product ON media_assets(product_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
