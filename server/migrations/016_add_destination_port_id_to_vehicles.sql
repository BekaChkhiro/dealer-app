-- Add destination_port_id FK column to vehicles table
-- This links vehicles to the ports table for destination port selection

-- First make sure the column exists
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS destination_port_id INTEGER;

-- Then add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'vehicles_destination_port_id_fkey'
        AND table_name = 'vehicles'
    ) THEN
        ALTER TABLE vehicles
        ADD CONSTRAINT vehicles_destination_port_id_fkey
        FOREIGN KEY (destination_port_id) REFERENCES ports(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_destination_port_id ON vehicles(destination_port_id);
