-- Add driver_id_number (personal ID number) to vehicles table
-- This is distinct from driver_car_license_number (driving license)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_id_number VARCHAR(50);
