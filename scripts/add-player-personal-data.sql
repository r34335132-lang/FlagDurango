-- Migration: Add personal data fields to players table for individual player registration
-- This allows players to complete their profile with personal information

-- Add new columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE players ADD COLUMN IF NOT EXISTS cedula_url TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS seasons_played INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS playing_since DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS admin_verified_at TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS category_verified BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_profile_completed ON players(profile_completed);
CREATE INDEX IF NOT EXISTS idx_players_admin_verified ON players(admin_verified);

-- Add comment to table for documentation
COMMENT ON COLUMN players.user_id IS 'Link to user account for player login';
COMMENT ON COLUMN players.cedula_url IS 'URL to uploaded cedula/ID document (Vercel Blob)';
COMMENT ON COLUMN players.seasons_played IS 'Number of seasons the player has played';
COMMENT ON COLUMN players.playing_since IS 'Date when player started playing in the league';
COMMENT ON COLUMN players.profile_completed IS 'Whether player has completed their profile';
COMMENT ON COLUMN players.admin_verified IS 'Whether admin has verified player info and category';
COMMENT ON COLUMN players.category_verified IS 'Whether player is in correct category based on age/info';
