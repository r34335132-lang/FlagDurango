-- Primero eliminar datos existentes si los hay
DELETE FROM fields WHERE venue_id IN (SELECT id FROM venues WHERE name IN ('Polideportivo M.V.R', 'CCH', '110', 'Campo Lobos'));
DELETE FROM venues WHERE name IN ('Polideportivo M.V.R', 'CCH', '110', 'Campo Lobos');

-- Crear las sedes predefinidas
INSERT INTO venues (name, address, city, phone) VALUES
('Polideportivo M.V.R', 'Av. Universidad s/n', 'Durango', '618-123-4567'),
('CCH', 'Blvd. Dolores del Río', 'Durango', '618-234-5678'),
('110', 'Calle 110 Norte', 'Durango', '618-345-6789'),
('Campo Lobos', 'Fraccionamiento Los Lobos', 'Durango', '618-456-7890');

-- Crear campos para cada sede
INSERT INTO fields (name, venue_id, surface_type, capacity) VALUES
-- Polideportivo M.V.R
('Campo 1', (SELECT id FROM venues WHERE name = 'Polideportivo M.V.R'), 'Césped sintético', 100),
('Campo 2', (SELECT id FROM venues WHERE name = 'Polideportivo M.V.R'), 'Césped sintético', 100),
-- CCH
('Campo Principal', (SELECT id FROM venues WHERE name = 'CCH'), 'Césped natural', 150),
-- 110
('Campo Norte', (SELECT id FROM venues WHERE name = '110'), 'Césped sintético', 80),
-- Campo Lobos
('Campo Lobos', (SELECT id FROM venues WHERE name = 'Campo Lobos'), 'Césped natural', 120);

-- Verificar que las tablas de pagos existan y tengan las columnas correctas
DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    player_id INTEGER REFERENCES players(id),
    referee_id INTEGER REFERENCES referees(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('registration', 'arbitration', 'fine', 'penalty')),
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
LIMIT 5;

-- Crear tabla de comprobantes diarios
CREATE TABLE IF NOT EXISTS daily_receipts (
    id SERIAL PRIMARY KEY,
    receipt_date DATE NOT NULL,
    total_received DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    games_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Función para actualizar comprobantes diarios
CREATE OR REPLACE FUNCTION update_daily_receipt()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar o crear comprobante del día
    INSERT INTO daily_receipts (receipt_date, total_received, total_paid)
    VALUES (CURRENT_DATE, 0, 0)
    ON CONFLICT (receipt_date) DO NOTHING;
    
    -- Actualizar totales
    UPDATE daily_receipts 
    SET 
        total_received = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE paid_date = CURRENT_DATE AND status = 'paid'
        ),
        total_paid = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM payments 
            WHERE created_at::date = CURRENT_DATE
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE receipt_date = CURRENT_DATE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar comprobantes
DROP TRIGGER IF EXISTS payment_receipt_trigger ON payments;
CREATE TRIGGER payment_receipt_trigger
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_receipt();
