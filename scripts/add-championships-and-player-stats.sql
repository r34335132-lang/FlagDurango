-- Tabla de historial de campeonatos del coach
CREATE TABLE IF NOT EXISTS coach_championships (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    coach_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    year INTEGER NOT NULL,
    tournament VARCHAR(200),
    position VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de estadisticas individuales de jugadores por partido
CREATE TABLE IF NOT EXISTS player_game_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    -- Estadisticas de ATAQUE
    pases_completos INTEGER DEFAULT 0,
    pases_intentados INTEGER DEFAULT 0,
    yardas_pase INTEGER DEFAULT 0,
    touchdowns_pase INTEGER DEFAULT 0,
    intercepciones_lanzadas INTEGER DEFAULT 0,
    carreras INTEGER DEFAULT 0,
    yardas_carrera INTEGER DEFAULT 0,
    touchdowns_carrera INTEGER DEFAULT 0,
    recepciones INTEGER DEFAULT 0,
    yardas_recepcion INTEGER DEFAULT 0,
    touchdowns_recepcion INTEGER DEFAULT 0,
    puntos_extra INTEGER DEFAULT 0,
    -- Estadisticas de DEFENSA
    tackleos INTEGER DEFAULT 0,
    sacks INTEGER DEFAULT 0,
    intercepciones INTEGER DEFAULT 0,
    yardas_intercepcion INTEGER DEFAULT 0,
    touchdowns_intercepcion INTEGER DEFAULT 0,
    pases_defendidos INTEGER DEFAULT 0,
    fumbles_forzados INTEGER DEFAULT 0,
    fumbles_recuperados INTEGER DEFAULT 0,
    banderas_jaladas INTEGER DEFAULT 0,
    -- Especiales
    touchdowns_totales INTEGER DEFAULT 0,
    puntos_totales INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, game_id)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_player_game_stats_player ON player_game_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_game_stats_game ON player_game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_player_game_stats_team ON player_game_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_coach_championships_team ON coach_championships(team_id);
CREATE INDEX IF NOT EXISTS idx_coach_championships_coach ON coach_championships(coach_id);
