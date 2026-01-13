-- Enforce order status transitions using can_transition helper
CREATE OR REPLACE FUNCTION enforce_order_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT can_transition(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'Transition % -> % is not allowed', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_transition_guard ON orders;
CREATE TRIGGER trg_orders_transition_guard
BEFORE UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION enforce_order_transition();
