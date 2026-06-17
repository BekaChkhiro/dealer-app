-- Admin-managed loading & destination ports for the calculator (name + map
-- coordinates). Previously hardcoded in the frontend.
CREATE TABLE IF NOT EXISTS calc_ports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  kind VARCHAR(20) NOT NULL DEFAULT 'loading', -- 'loading' | 'destination'
  lat DECIMAL(9,5),
  lon DECIMAL(9,5),
  sort_order INTEGER DEFAULT 0
);

INSERT INTO calc_ports (name, kind, lat, lon, sort_order)
SELECT * FROM (VALUES
  ('CA - LOS ANGELES',    'loading', 33.74000, -118.27000, 1),
  ('CA - OAKLAND',        'loading', 37.80000, -122.30000, 2),
  ('FL - MIAMI',          'loading', 25.77000, -80.19000,  3),
  ('GA - SAVANNAH',       'loading', 32.08000, -81.10000,  4),
  ('IL - CHICAGO',        'loading', 41.85000, -87.65000,  5),
  ('NJ - NEWARK',         'loading', 40.69000, -74.17000,  6),
  ('TX - HOUSTON',        'loading', 29.75000, -95.36000,  7),
  ('VA - NORFOLK',        'loading', 36.85000, -76.29000,  8),
  ('WA - SEATTLE',        'loading', 47.61000, -122.33000, 9),
  ('CANADA - MONTREAL',   'loading', 45.50000, -73.55000,  10),
  ('CANADA - TORONTO',    'loading', 43.65000, -79.38000,  11),
  ('CANADA - VANCOUVER',  'loading', 49.28000, -123.12000, 12),
  ('GE - Poti / Batumi',  'destination', 42.15000, 41.67000, 1),
  ('GE - Tbilisi 30 Days','destination', 41.72000, 44.78000, 2),
  ('AM - Gyumri',         'destination', 40.79000, 43.85000, 3)
) AS v(name, kind, lat, lon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM calc_ports);
