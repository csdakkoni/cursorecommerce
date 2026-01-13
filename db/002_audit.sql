-- Audit logging baseline
-- Requires audit_logs table from 000_base.sql

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    before_state,
    after_state,
    reason,
    created_at
  )
  VALUES (
    v_user,
    TG_ARGV[0],
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW),
    NULL,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for sensitive tables
CREATE TRIGGER trg_audit_pricing_rules
AFTER INSERT OR UPDATE OR DELETE ON pricing_rules
FOR EACH ROW EXECUTE FUNCTION public.log_audit('pricing_rules_change');

CREATE TRIGGER trg_audit_custom_pricing
AFTER INSERT OR UPDATE OR DELETE ON custom_pricing_formulas
FOR EACH ROW EXECUTE FUNCTION public.log_audit('custom_pricing_change');

CREATE TRIGGER trg_audit_fabric_rolls
AFTER UPDATE ON fabric_rolls
FOR EACH ROW EXECUTE FUNCTION public.log_audit('fabric_roll_update');

CREATE TRIGGER trg_audit_orders_status
AFTER UPDATE ON orders
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.log_audit('order_status_change');

CREATE TRIGGER trg_audit_stock_reservations
AFTER INSERT OR UPDATE OR DELETE ON stock_reservations
FOR EACH ROW EXECUTE FUNCTION public.log_audit('stock_reservation_change');
