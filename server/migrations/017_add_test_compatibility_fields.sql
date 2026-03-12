-- Migration: Add fields for Phase 8-10 test compatibility
-- Adds missing fields that tests expect

-- 1. Add container date fields with consistent naming
ALTER TABLE containers ADD COLUMN IF NOT EXISTS loaded_date TIMESTAMP;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS estimated_arrival TIMESTAMP;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS received_date TIMESTAMP;
ALTER TABLE containers ADD COLUMN IF NOT EXISTS opened_date TIMESTAMP;

-- Copy existing data to new columns
UPDATE containers SET loaded_date = container_loaded_date WHERE loaded_date IS NULL AND container_loaded_date IS NOT NULL;
UPDATE containers SET received_date = container_receive_date WHERE received_date IS NULL AND container_receive_date IS NOT NULL;
UPDATE containers SET opened_date = container_open_date WHERE opened_date IS NULL AND container_open_date IS NOT NULL;

-- 2. Add user ID verification status field
-- We'll use a computed column approach with a GENERATED column
-- Or we can just add the column and use a trigger/function to keep it in sync with id_verified
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verification_status VARCHAR(20) DEFAULT NULL;

-- Sync existing data: id_verified = true -> 'verified', false -> 'rejected', null -> null or 'pending'
UPDATE users
SET id_verification_status = CASE
    WHEN id_verified = true THEN 'verified'
    WHEN id_verified = false THEN 'rejected'
    WHEN id_document_url IS NOT NULL AND id_verified IS NULL THEN 'pending'
    ELSE NULL
END
WHERE id_verification_status IS NULL;

-- 3. Add container_id FK to vehicles table (to properly link vehicles to containers)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS container_id INTEGER;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'vehicles_container_id_fkey'
        AND table_name = 'vehicles'
    ) THEN
        ALTER TABLE vehicles
        ADD CONSTRAINT vehicles_container_id_fkey
        FOREIGN KEY (container_id) REFERENCES containers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_container_id ON vehicles(container_id);

-- 4. Add ports active field (alias for is_active)
-- We'll handle this in the controller by selecting is_active AS active

-- 5. Create a view or handle field aliases in controllers
-- lot_number -> lot
-- driver_fullname -> driver_full_name
-- driver_car_license_number -> driver_license_number
-- receiver_identity_number -> receiver_personal_number
-- is_active -> active (ports)
-- These will be handled with SQL aliases in SELECT statements
