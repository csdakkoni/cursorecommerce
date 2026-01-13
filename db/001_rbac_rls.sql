-- RBAC & RLS configuration
-- Assumes 000_base.sql is applied first.

-- Helper tables for roles (optional in addition to user_metadata)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Seed roles
INSERT INTO roles (name)
VALUES ('ADMIN'), ('SALES'), ('PRODUCTION'), ('WAREHOUSE')
ON CONFLICT (name) DO NOTHING;

-- Helper: check role via user_metadata.role or user_roles mapping
CREATE OR REPLACE FUNCTION public.has_role(p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN
    -- user_metadata single role
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = p_role, FALSE)
    OR
    -- user_roles table
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = p_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Convenience admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_role('ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_pricing_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE curtain_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_profiles ENABLE ROW LEVEL SECURITY;

-- Products
CREATE POLICY products_public_select ON products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY products_admin_all ON products
  FOR ALL USING (public.is_admin());

-- Materials
CREATE POLICY materials_public_select ON materials
  FOR SELECT USING (TRUE);
CREATE POLICY materials_admin_all ON materials
  FOR ALL USING (public.is_admin());

-- Option groups/values/variants
CREATE POLICY option_groups_public_select ON product_option_groups
  FOR SELECT USING (TRUE);
CREATE POLICY option_groups_admin_all ON product_option_groups
  FOR ALL USING (public.is_admin());

CREATE POLICY option_values_public_select ON product_option_values
  FOR SELECT USING (TRUE);
CREATE POLICY option_values_admin_all ON product_option_values
  FOR ALL USING (public.is_admin());

CREATE POLICY product_variants_public_select ON product_variants
  FOR SELECT USING (TRUE);
CREATE POLICY product_variants_admin_all ON product_variants
  FOR ALL USING (public.is_admin());

-- Pricing & rules
CREATE POLICY pricing_admin_all ON pricing_rules
  FOR ALL USING (public.is_admin());
CREATE POLICY custom_pricing_admin_all ON custom_pricing_formulas
  FOR ALL USING (public.is_admin());
CREATE POLICY curtain_rules_admin_all ON curtain_rules
  FOR ALL USING (public.is_admin());

-- Markets
CREATE POLICY markets_public_select ON markets
  FOR SELECT USING (TRUE);
CREATE POLICY markets_admin_all ON markets
  FOR ALL USING (public.is_admin());

-- Product market prices
CREATE POLICY product_market_prices_public_select ON product_market_prices
  FOR SELECT USING (TRUE);
CREATE POLICY product_market_prices_admin_all ON product_market_prices
  FOR ALL USING (public.is_admin());

-- Shipping profiles
CREATE POLICY shipping_profiles_public_select ON shipping_profiles
  FOR SELECT USING (TRUE);
CREATE POLICY shipping_profiles_admin_all ON shipping_profiles
  FOR ALL USING (public.is_admin());

-- Fabric rolls
CREATE POLICY fabric_rolls_view ON fabric_rolls
  FOR SELECT USING (public.is_admin() OR public.has_role('WAREHOUSE'));
CREATE POLICY fabric_rolls_manage ON fabric_rolls
  FOR ALL USING (public.is_admin() OR public.has_role('WAREHOUSE'));

-- Stock reservations
CREATE POLICY stock_reservations_view ON stock_reservations
  FOR SELECT USING (public.is_admin() OR public.has_role('WAREHOUSE') OR public.has_role('PRODUCTION'));
CREATE POLICY stock_reservations_manage ON stock_reservations
  FOR ALL USING (public.is_admin() OR public.has_role('WAREHOUSE'));

-- Orders
CREATE POLICY orders_insert_public ON orders
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY orders_select_own_or_admin ON orders
  FOR SELECT USING (
    public.is_admin()
    OR (customer_id IS NOT NULL AND auth.uid() = customer_id)
  );

CREATE POLICY orders_update_admin_sales ON orders
  FOR UPDATE USING (public.is_admin() OR public.has_role('SALES'));

-- Order items
CREATE POLICY order_items_insert_public ON order_items
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY order_items_select_own_or_admin ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (
          public.is_admin() OR public.has_role('SALES') OR
          (o.customer_id IS NOT NULL AND auth.uid() = o.customer_id)
        )
    )
  );

CREATE POLICY order_items_update_admin ON order_items
  FOR UPDATE USING (public.is_admin());

-- Media assets
CREATE POLICY media_public_select ON media_assets
  FOR SELECT USING (TRUE);
CREATE POLICY media_admin_all ON media_assets
  FOR ALL USING (public.is_admin());

-- Measurement profiles
CREATE POLICY measurement_profiles_select ON measurement_profiles
  FOR SELECT USING (public.is_admin() OR auth.uid() = customer_id);
CREATE POLICY measurement_profiles_insert ON measurement_profiles
  FOR INSERT WITH CHECK (auth.uid() = customer_id OR public.is_admin());
CREATE POLICY measurement_profiles_update ON measurement_profiles
  FOR UPDATE USING (auth.uid() = customer_id OR public.is_admin());
CREATE POLICY measurement_profiles_delete ON measurement_profiles
  FOR DELETE USING (auth.uid() = customer_id OR public.is_admin());

-- Audit logs (admin only)
CREATE POLICY audit_logs_admin ON audit_logs
  FOR ALL USING (public.is_admin());
