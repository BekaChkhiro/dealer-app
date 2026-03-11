-- Add fuel_type column to vehicles table
-- Values: gasoline, diesel, hybrid, electric, plug_in_hybrid

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20);

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON vehicles(fuel_type);
