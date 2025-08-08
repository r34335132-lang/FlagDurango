-- Arreglar constraints y estructura de base de datos

-- 1. Crear tabla de noticias si no existe
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100) NOT NULL DEFAULT 'Admin Liga',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Arreglar constraints de payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
CHECK (payment_type IN ('team_registration', 'arbitration', 'fine', 'penalty'));

-- 3. Arreglar constraints de staff
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_role_check 
CHECK (role IN ('staff', 'admin', 'coordinator'));

-- 4. Arreglar constraints de referees - usar certification_level que es la columna real
ALTER TABLE referees DROP CONSTRAINT IF EXISTS referees_certification_level_check;
ALTER TABLE referees ADD CONSTRAINT referees_certification_level_check 
CHECK (certification_level IN ('junior', 'senior', 'expert'));

-- 5. Si existe experience_level, también agregar constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referees' AND column_name = 'experience_level') THEN
        ALTER TABLE referees DROP CONSTRAINT IF EXISTS referees_experience_level_check;
        ALTER TABLE referees ADD CONSTRAINT referees_experience_level_check 
        CHECK (experience_level IN ('junior', 'senior', 'expert'));
    END IF;
END $$;

-- 6. Asegurar que status tenga valores válidos
ALTER TABLE referees DROP CONSTRAINT IF EXISTS referees_status_check;
ALTER TABLE referees ADD CONSTRAINT referees_status_check 
CHECK (status IN ('active', 'inactive') OR status IS NULL);

-- 7. Actualizar referees sin certification_level
UPDATE referees SET certification_level = 'junior' WHERE certification_level IS NULL;

-- 8. Actualizar referees sin status
UPDATE referees SET status = 'active' WHERE status IS NULL;

-- 9. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_payments_team_id ON payments(team_id);
CREATE INDEX IF NOT EXISTS idx_payments_referee_id ON payments(referee_id);
CREATE INDEX IF NOT EXISTS idx_payments_player_id ON payments(player_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);
CREATE INDEX IF NOT EXISTS idx_referees_status ON referees(status);

-- 10. Verificar que todo esté correcto
SELECT 'Payments constraints' as check_type, COUNT(*) as count FROM payments;
SELECT 'Staff constraints' as check_type, COUNT(*) as count FROM staff;
SELECT 'Referees constraints' as check_type, COUNT(*) as count FROM referees;
SELECT 'News table' as check_type, COUNT(*) as count FROM news;
