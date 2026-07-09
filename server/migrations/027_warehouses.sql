-- Admin-managed warehouses, and link vehicles to a warehouse.
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  code VARCHAR(40),
  location VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS warehouse_id INTEGER;
