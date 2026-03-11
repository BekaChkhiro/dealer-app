-- Migration: Add address field to users table
-- Date: 2026-03-10
-- Task: T8.1

-- Add address column to users table (VARCHAR 500)
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'address';
