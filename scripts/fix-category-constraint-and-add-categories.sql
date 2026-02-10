-- Remove the restrictive CHECK constraint on teams.category
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_category_check;

-- Remove any CHECK constraint on games.category too
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_category_check;

-- Add category defaults to system_config for the estadisticas page
INSERT INTO system_config (config_key, config_value, description)
VALUES 
  ('enabled_categories', 'varonil-libre,varonil-gold,varonil-silver,femenil-gold,femenil-silver,femenil-cooper,mixto-gold,mixto-silver,mixto-recreativo,teens', 'Categorias habilitadas para estadisticas (separadas por coma)')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;
