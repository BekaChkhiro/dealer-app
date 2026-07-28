-- Soft-delete support for vehicles (trash / restore / purge) and a direct
-- booking_number column on the vehicle itself.
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS booking_number VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles(deleted_at);
