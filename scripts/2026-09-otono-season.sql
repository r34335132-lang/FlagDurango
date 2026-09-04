-- Temporada Otoño 2026: asegurar temporada activa y trigger de sync en teams.
-- Idempotente. Ejecutar en Supabase SQL Editor si aún no existe la temporada.

INSERT INTO public.seasons (name, year, status, is_active, start_date, end_date)
VALUES ('Temporada Otoño 2026', 2026, 'draft', false, '2026-09-20', '2026-11-30')
ON CONFLICT (year) DO UPDATE
SET
  name = EXCLUDED.name,
  start_date = COALESCE(public.seasons.start_date, EXCLUDED.start_date),
  end_date = COALESCE(public.seasons.end_date, EXCLUDED.end_date),
  updated_at = now();

-- Si Primavera 2026 ya ocupaba year=2026, renómbrala vía admin y activa Otoño manualmente.
-- Activar Otoño 2026 (desactiva cualquier otra):
-- SELECT public.set_active_season(id) FROM public.seasons WHERE name ILIKE '%Otoño 2026%' LIMIT 1;

CREATE OR REPLACE FUNCTION public.teams_sync_season_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  season_year integer;
BEGIN
  IF NEW.season_id IS NULL THEN
    RAISE EXCEPTION 'season_id es obligatorio en teams';
  END IF;

  SELECT year INTO season_year FROM public.seasons WHERE id = NEW.season_id;
  IF season_year IS NULL THEN
    RAISE EXCEPTION 'La temporada % no existe', NEW.season_id;
  END IF;

  -- Compatibilidad con columna legacy `season` (año)
  BEGIN
    NEW.season := season_year;
  EXCEPTION WHEN undefined_column THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS teams_sync_season_fields ON public.teams;
CREATE TRIGGER teams_sync_season_fields
BEFORE INSERT OR UPDATE OF season_id ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.teams_sync_season_fields();
