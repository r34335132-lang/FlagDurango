-- Crear tabla de asistencia a partidos
CREATE TABLE IF NOT EXISTS game_attendance (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, player_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_game_attendance_game ON game_attendance(game_id);
CREATE INDEX IF NOT EXISTS idx_game_attendance_player ON game_attendance(player_id);
