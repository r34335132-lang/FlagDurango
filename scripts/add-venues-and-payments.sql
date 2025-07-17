-- Crear las sedes predefinidas
INSERT INTO venues (name, address, city, phone) VALUES
('Polideportivo M.V.R', 'Av. Universidad s/n', 'Durango', '618-123-4567'),
('CCH', 'Blvd. Dolores del Río', 'Durango', '618-234-5678'),
('110', 'Calle 110 Norte', 'Durango', '618-345-6789'),
('Campo Lobos', 'Fraccionamiento Los Lobos', 'Durango', '618-456-7890')
ON CONFLICT (name) DO NOTHING;

-- Crear campos A-L para cada sede (como ya los tenías definidos)
INSERT INTO fields (name, venue_id, surface_type, capacity) 
SELECT 
    'Campo A', v.id, 'Césped sintético', 200
FROM venues v WHERE v.name = 'Polideportivo M.V.R'
UNION ALL
SELECT 
    'Campo B', v.id, 'Césped sintético', 200
FROM venues v WHERE v.name = 'Polideportivo M.V.R'
UNION ALL
SELECT 
    'Campo C', v.id, 'Césped sintético', 200
FROM venues v WHERE v.name = 'Polideportivo M.V.R'
UNION ALL
SELECT 
    'Campo A', v.id, 'Césped natural', 300
FROM venues v WHERE v.name = 'CCH'
UNION ALL
SELECT 
    'Campo B', v.id, 'Césped sintético', 150
FROM venues v WHERE v.name = 'CCH'
UNION ALL
SELECT 
    'Campo C', v.id, 'Césped sintético', 150
FROM venues v WHERE v.name = 'CCH'
UNION ALL
SELECT 
    'Campo D', v.id, 'Césped sintético', 150
FROM venues v WHERE v.name = 'CCH'
UNION ALL
SELECT 
    'Campo A', v.id, 'Césped sintético', 180
FROM venues v WHERE v.name = '110'
UNION ALL
SELECT 
    'Campo B', v.id, 'Césped sintético', 180
FROM venues v WHERE v.name = '110'
UNION ALL
SELECT 
    'Campo C', v.id, 'Césped sintético', 180
FROM venues v WHERE v.name = '110'
UNION ALL
SELECT 
    'Campo A', v.id, 'Césped natural', 250
FROM venues v WHERE v.name = 'Campo Lobos'
UNION ALL
SELECT 
    'Campo B', v.id, 'Césped natural', 250
FROM venues v WHERE v.name = 'Campo Lobos'
ON CONFLICT (name, venue_id) DO NOTHING;

-- Verificar que las tablas de pagos existan
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    player_id INTEGER REFERENCES players(id),
    referee_id INTEGER REFERENCES referees(id),
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('registration', 'arbitration', 'fine', 'penalty')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear algunos pagos de ejemplo
INSERT INTO payments (team_id, payment_type, amount, description, status, due_date) 
SELECT 
    t.id,
    'registration',
    2500.00,
    'Registro de temporada 2025',
    'pending',
    '2025-02-15'
FROM teams t
WHERE NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.team_id = t.id AND p.payment_type = 'registration'
)
LIMIT 5;
