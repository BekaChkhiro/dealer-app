-- Add insurance_type column to vehicles table
-- Values: 'none', 'franchise', 'full'
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(20) DEFAULT 'none';
