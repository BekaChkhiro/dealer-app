-- Vehicle types with an inland price modifier, managed from the admin and used
-- by the public calculator (was previously hardcoded in the frontend).
CREATE TABLE IF NOT EXISTS vehicle_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_modifier DECIMAL(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- Seed the defaults only if the table is empty.
INSERT INTO vehicle_types (name, price_modifier, sort_order)
SELECT * FROM (VALUES
  ('Sedan', 0, 1),
  ('Medium Duty Truck', 150, 2),
  ('Quadrocycle', -150, 3),
  ('Motorcycles', -180, 4),
  ('Bob Cat', 120, 5),
  ('3 Cars Cont. (SUV)', 90, 6),
  ('Van', 100, 7),
  ('Boat', 80, 8),
  ('Truck', 200, 9),
  ('Heavy Equipment', 300, 10)
) AS v(name, price_modifier, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM vehicle_types);
