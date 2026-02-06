-- Migration: Add missing columns to players table
-- These columns are referenced by the player profile API and admin dashboard
-- but were never added to the actual database schema.

-- Personal data columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS personal_email TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE players ADD COLUMN IF NOT EXISTS cedula_url TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS seasons_played INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS playing_since TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS medical_conditions TEXT;

-- Profile and verification status columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS category_verified BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_profile_completed ON players(profile_completed);
CREATE INDEX IF NOT EXISTS idx_players_admin_verified ON players(admin_verified);
