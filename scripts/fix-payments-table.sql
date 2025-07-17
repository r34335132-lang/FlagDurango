-- Eliminar tabla payments si existe y recrearla correctamente
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS daily_receipts CASCADE;

-- Crear tabla payments sin payment_date problemática
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('registration', 'referee', 'fine', 'penalty')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para comprobantes diarios
CREATE TABLE daily_receipts (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_received DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    games_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para actualizar updated_at en payments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_receipts_updated_at BEFORE UPDATE ON daily_receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar comprobantes diarios
CREATE OR REPLACE FUNCTION update_daily_receipt()
RETURNS TRIGGER AS $$
DECLARE
    receipt_date DATE;
BEGIN
    -- Usar la fecha de pago si existe, sino la fecha actual
    receipt_date := COALESCE(NEW.paid_date, CURRENT_DATE);
    
    -- Solo actualizar si el pago está marcado como pagado
    IF NEW.status = 'paid' AND NEW.paid_date IS NOT NULL THEN
        INSERT INTO daily_receipts (date, total_received)
        VALUES (receipt_date, NEW.amount)
        ON CONFLICT (date) 
        DO UPDATE SET 
            total_received = daily_receipts.total_received + NEW.amount,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar comprobantes cuando se marca un pago como pagado
CREATE TRIGGER update_daily_receipt_on_payment AFTER UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_daily_receipt();

-- Insertar algunos pagos de ejemplo
INSERT INTO payments (team_id, amount, type, description, due_date, status) VALUES
(1, 2500.00, 'registration', 'Registro de temporada 2025', '2025-02-15', 'pending'),
(2, 2500.00, 'registration', 'Registro de temporada 2025', '2025-02-15', 'paid'),
(3, 500.00, 'fine', 'Falta de jugadores en partido', '2025-01-20', 'pending'),
(1, 800.00, 'referee', 'Pago de árbitro - Partido vs Team 2', '2025-01-25', 'paid');

-- Actualizar los pagos pagados con fecha de pago
UPDATE payments SET paid_date = CURRENT_DATE WHERE status = 'paid';

-- Crear índices para mejor rendimiento
CREATE INDEX idx_payments_team_id ON payments(team_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(type);
CREATE INDEX idx_daily_receipts_date ON daily_receipts(date);

-- Verificar que todo esté correcto
SELECT 'Payments table created successfully' as status;
SELECT COUNT(*) as payment_count FROM payments;
SELECT COUNT(*) as receipt_count FROM daily_receipts;
