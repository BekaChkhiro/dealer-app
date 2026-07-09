-- Link vehicles to the new admin-managed geography tables (server/migrations/025_geography.sql).
-- Kept as plain nullable INT (no FK) to avoid delete coupling with countries/states/cities/loading_ports.
-- The existing us_state / us_port text columns are left untouched — they continue
-- to hold denormalized display names.
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS city_id INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS city VARCHAR(160);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS loading_port_id INTEGER;
-- Sublot: car sold in one city but physically located in another.
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sublot_city VARCHAR(160);
