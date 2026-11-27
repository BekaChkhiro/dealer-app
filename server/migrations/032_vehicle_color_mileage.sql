-- Vehicle colour and odometer reading (as printed on the auction invoice).
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(40);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mileage INTEGER;
