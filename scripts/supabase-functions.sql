-- Función para calcular y actualizar las estadísticas del equipo
CREATE OR REPLACE FUNCTION calculate_team_stats()
RETURNS TRIGGER AS $$
DECLARE
    home_team_id_val INT;
    away_team_id_val INT;
    home_score_val INT;
    away_score_val INT;
    current_season INT := EXTRACT(YEAR FROM NOW()); -- Asume la temporada actual como el año actual
BEGIN
    -- Determinar si es un INSERT o UPDATE y obtener los valores relevantes
    IF TG_OP = 'INSERT' THEN
        home_team_id_val := NEW.home_team_id;
        away_team_id_val := NEW.away_team_id;
        home_score_val := NEW.home_score;
        away_score_val := NEW.away_score;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Solo recalcular si los scores o el estado cambian a 'finished'
        IF OLD.home_score IS NOT DISTINCT FROM NEW.home_score OR
           OLD.away_score IS NOT DISTINCT FROM NEW.away_score OR
           OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'finished' THEN
            home_team_id_val := NEW.home_team_id;
            away_team_id_val := NEW.away_team_id;
            home_score_val := NEW.home_score;
            away_score_val := NEW.away_score;
        ELSE
            RETURN NEW; -- No hay cambios relevantes para las estadísticas
        END IF;
    ELSE
        RETURN NEW; -- No aplica para DELETE
    END IF;

    -- Actualizar estadísticas para el equipo local
    INSERT INTO team_stats (team_id, season, games_played, games_won, games_lost, games_tied, points_for, points_against, point_difference, win_percentage)
    VALUES (home_team_id_val, current_season, 0, 0, 0, 0, 0, 0, 0, 0.00)
    ON CONFLICT (team_id, season) DO UPDATE SET updated_at = NOW();

    UPDATE team_stats
    SET
        games_played = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_won = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id AND home_score > away_score) OR (away_team_id = team_stats.team_id AND away_score > home_score) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_lost = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id AND home_score < away_score) OR (away_team_id = team_stats.team_id AND away_score < home_score) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_tied = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND home_score = away_score AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        points_for = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN home_score ELSE away_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        points_against = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN away_score ELSE home_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        point_difference = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN home_score - away_score ELSE away_score - home_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        win_percentage = CASE
            WHEN (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season) = 0 THEN 0.00
            ELSE (SELECT (COUNT(CASE WHEN (home_team_id = team_stats.team_id AND home_score > away_score) OR (away_team_id = team_stats.team_id AND away_score > home_score) THEN 1 END) * 100.0) / COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season)
        END
    WHERE team_id = home_team_id_val AND season = current_season;

    -- Actualizar estadísticas para el equipo visitante
    INSERT INTO team_stats (team_id, season, games_played, games_won, games_lost, games_tied, points_for, points_against, point_difference, win_percentage)
    VALUES (away_team_id_val, current_season, 0, 0, 0, 0, 0, 0, 0, 0.00)
    ON CONFLICT (team_id, season) DO UPDATE SET updated_at = NOW();

    UPDATE team_stats
    SET
        games_played = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_won = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id AND home_score > away_score) OR (away_team_id = team_stats.team_id AND away_score > home_score) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_lost = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id AND home_score < away_score) OR (away_team_id = team_stats.team_id AND away_score < home_score) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        games_tied = (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND home_score = away_score AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        points_for = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN home_score ELSE away_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        points_against = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN away_score ELSE home_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        point_difference = (SELECT COALESCE(SUM(CASE WHEN home_team_id = team_stats.team_id THEN home_score - away_score ELSE away_score - home_score END), 0) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season),
        win_percentage = CASE
            WHEN (SELECT COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season) = 0 THEN 0.00
            ELSE (SELECT (COUNT(CASE WHEN (home_team_id = team_stats.team_id AND home_score > away_score) OR (away_team_id = team_stats.team_id AND away_score > home_score) THEN 1 END) * 100.0) / COUNT(*) FROM games WHERE (home_team_id = team_stats.team_id OR away_team_id = team_stats.team_id) AND status = 'finished' AND EXTRACT(YEAR FROM date) = team_stats.season)
        END
    WHERE team_id = away_team_id_val AND season = current_season;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función después de INSERT o UPDATE en la tabla 'games'
CREATE OR REPLACE TRIGGER trg_update_team_stats
AFTER INSERT OR UPDATE OF home_score, away_score, status ON games
FOR EACH ROW
WHEN (NEW.status = 'finished') -- Solo cuando el partido está finalizado
EXECUTE FUNCTION calculate_team_stats();
