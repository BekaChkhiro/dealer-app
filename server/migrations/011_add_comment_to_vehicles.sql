-- Add comment field to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS comment TEXT;
