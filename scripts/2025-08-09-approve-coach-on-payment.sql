-- Aprueba automáticamente permisos de coach/capitán cuando se paga la inscripción del equipo
-- Supone:
--   payments.type = 'team_registration'
--   payments.status = 'paid'
--   payments.team_id referencia al equipo
--   coach_permissions (user_id, team_id, approved_by_admin, can_manage_players, can_upload_photos, can_upload_logo, can_view_stats)

CREATE OR REPLACE FUNCTION approve_coach_on_payment() RETURNS trigger AS $$
BEGIN
  -- Solo cuando el pago queda en 'paid' y es de inscripción de equipo
  IF NEW.status = 'paid' AND NEW.type = 'team_registration' AND NEW.team_id IS NOT NULL THEN
    UPDATE coach_permissions
      SET approved_by_admin = TRUE,
          can_manage_players = TRUE,
          can_upload_photos = TRUE,
          can_upload_logo = TRUE,
          can_view_stats = TRUE
      WHERE team_id = NEW.team_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_approve_coach_on_payment_ins ON payments;
CREATE TRIGGER trg_approve_coach_on_payment_ins
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION approve_coach_on_payment();

DROP TRIGGER IF EXISTS trg_approve_coach_on_payment_upd ON payments;
CREATE TRIGGER trg_approve_coach_on_payment_upd
AFTER UPDATE OF status ON payments
FOR EACH ROW
EXECUTE FUNCTION approve_coach_on_payment();
