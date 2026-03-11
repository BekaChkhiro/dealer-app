-- Apply receiver ID document migration to vehicles table
-- Run this SQL directly in your database if the migration script fails

-- Add receiver ID document fields
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS receiver_id_document_url VARCHAR(500);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS receiver_id_uploaded_at TIMESTAMP;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name LIKE 'receiver_id%';
