-- Eliminar y recrear tabla payments correctamente
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS daily_receipts CASCADE;

-- Crear tabla payments sin conflictos
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    player_id INTEGER REFERENCES players(id),
    referee_id INTEGER REFERENCES referees(id),
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('registration', 'referee', 'fine', 'penalty')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para comprobantes diarios
CREATE TABLE daily_receipts (
    id SERIAL PRIMARY KEY,
    receipt_date DATE NOT NULL UNIQUE,
    total_received DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    games_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actualizar tabla staff para incluir permisos y cuentas
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_edit_games BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_edit_scores BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_manage_payments BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Actualizar tabla referees para incluir todas las columnas necesarias
ALTER TABLE referees ADD COLUMN IF NOT EXISTS license_number VARCHAR(50);
ALTER TABLE referees ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) DEFAULT 'junior';
ALTER TABLE referees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2) DEFAULT 0;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE referees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Función para crear usuario automáticamente para staff
CREATE OR REPLACE FUNCTION create_staff_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id INTEGER;
    temp_password TEXT;
BEGIN
    -- Generar password temporal
    temp_password := 'staff' || NEW.id || '2025';
    
    -- Crear usuario en la tabla users
    INSERT INTO users (username, email, password_hash, role, status)
    VALUES (
        LOWER(REPLACE(NEW.name, ' ', '_')),
        NEW.email,
        crypt(temp_password, gen_salt('bf')),
        'staff',
        'active'
    )
    RETURNING id INTO new_user_id;
    
    -- Actualizar staff con el user_id
    NEW.user_id := new_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear usuario automáticamente para referees
CREATE OR REPLACE FUNCTION create_referee_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id INTEGER;
    temp_password TEXT;
BEGIN
    -- Solo crear usuario si se proporciona email
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        -- Generar password temporal
        temp_password := 'ref' || NEW.id || '2025';
        
        -- Crear usuario en la tabla users
        INSERT INTO users (username, email, password_hash, role, status)
        VALUES (
            LOWER(REPLACE(NEW.name, ' ', '_')) || '_ref',
            NEW.email,
            crypt(temp_password, gen_salt('bf')),
            'referee',
            'active'
        )
        RETURNING id INTO new_user_id;
        
        -- Actualizar referee con el user_id
        NEW.user_id := new_user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para crear usuarios automáticamente
DROP TRIGGER IF EXISTS create_staff_user_trigger ON staff;
CREATE TRIGGER create_staff_user_trigger
    BEFORE INSERT ON staff
    FOR EACH ROW
    EXECUTE FUNCTION create_staff_user();

DROP TRIGGER IF EXISTS create_referee_user_trigger ON referees;
CREATE TRIGGER create_referee_user_trigger
    BEFORE INSERT ON referees
    FOR EACH ROW
    EXECUTE FUNCTION create_referee_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_receipts_updated_at BEFORE UPDATE ON daily_receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referees_updated_at BEFORE UPDATE ON referees
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
        INSERT INTO daily_receipts (receipt_date, total_received)
        VALUES (receipt_date, NEW.amount)
        ON CONFLICT (receipt_date) 
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

-- Insertar algunos datos de ejemplo
INSERT INTO referees (name, phone, email, license_number, experience_level, hourly_rate) VALUES
('Juan Pérez', '618-123-4567', 'juan.perez@referee.com', 'REF001', 'senior', 500.00),
('María González', '618-234-5678', 'maria.gonzalez@referee.com', 'REF002', 'intermediate', 400.00),
('Carlos Rodríguez', '618-345-6789', 'carlos.rodriguez@referee.com', 'REF003', 'junior', 300.00);

INSERT INTO staff (name, role, phone, email, can_edit_games, can_edit_scores, can_manage_payments) VALUES
('Ana Martínez', 'coordinator', '618-456-7890', 'ana.martinez@liga.com', true, true, true),
('Luis Hernández', 'admin', '618-567-8901', 'luis.hernandez@liga.com', true, true, true),
('Sofia López', 'staff', '618-678-9012', 'sofia.lopez@liga.com', false, true, false);

-- Insertar algunos pagos de ejemplo
INSERT INTO payments (team_id, payment_type, amount, description, due_date, status) VALUES
(1, 'registration', 2500.00, 'Registro de temporada 2025', '2025-02-15', 'pending'),
(2, 'registration', 2500.00, 'Registro de temporada 2025', '2025-02-15', 'paid'),
(3, 'fine', 500.00, 'Falta de jugadores en partido', '2025-01-20', 'pending');

-- Actualizar los pagos pagados con fecha de pago
UPDATE payments SET paid_date = CURRENT_DATE WHERE status = 'paid';

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_payments_team_id ON payments(team_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_daily_receipts_date ON daily_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_referees_user_id ON referees(user_id);

-- Verificar que todo esté correcto
SELECT 'Database setup completed successfully' as status;
SELECT COUNT(*) as payment_count FROM payments;
SELECT COUNT(*) as receipt_count FROM daily_receipts;
SELECT COUNT(*) as staff_count FROM staff;
SELECT COUNT(*) as referee_count FROM referees;
SELECT COUNT(*) as user_count FROM users WHERE role IN ('staff', 'referee');
