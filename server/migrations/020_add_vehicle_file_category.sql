-- Add a category to vehicle_files so photos can be grouped:
--   'auction'      -> auction photos
--   'port'         -> port photos
--   'port_opening' -> photos taken when the container/port is opened on arrival
-- NULL category = general file/document (existing behaviour, unchanged).
ALTER TABLE vehicle_files ADD COLUMN IF NOT EXISTS category VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_vehicle_files_vehicle_category
  ON vehicle_files(vehicle_id, category);
