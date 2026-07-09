-- Admin-managed geography subsystem: countries, states, cities, loading ports.
-- Replaces the hardcoded frontend lists (client/src/utils/usLocations.js) with
-- an admin-editable dataset, and normalizes calculator/vehicle city+state data.

CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(3),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS states (
  id SERIAL PRIMARY KEY,
  country_id INT REFERENCES countries(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(10),
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  state_id INT REFERENCES states(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS loading_ports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  country_id INT REFERENCES countries(id) ON DELETE SET NULL,
  code VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_states_country_id ON states(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

-- ---- Seed: countries ----
INSERT INTO countries (name, code, sort_order)
SELECT v.name, v.code, v.sort_order
FROM (VALUES
  ('United States', 'US', 1),
  ('Canada', 'CA', 2)
) AS v(name, code, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM countries c WHERE c.code = v.code);

-- ---- Seed: US states + DC (matches client/src/utils/usLocations.js US_STATES,
-- excluding the US territories AS/GU/MP/PR/VI) ----
INSERT INTO states (country_id, name, code, sort_order)
SELECT (SELECT id FROM countries WHERE code = 'US'), v.name, v.code, v.sort_order
FROM (VALUES
  ('Alabama', 'AL', 1),
  ('Alaska', 'AK', 2),
  ('Arizona', 'AZ', 3),
  ('Arkansas', 'AR', 4),
  ('California', 'CA', 5),
  ('Colorado', 'CO', 6),
  ('Connecticut', 'CT', 7),
  ('Delaware', 'DE', 8),
  ('District of Columbia', 'DC', 9),
  ('Florida', 'FL', 10),
  ('Georgia', 'GA', 11),
  ('Hawaii', 'HI', 12),
  ('Idaho', 'ID', 13),
  ('Illinois', 'IL', 14),
  ('Indiana', 'IN', 15),
  ('Iowa', 'IA', 16),
  ('Kansas', 'KS', 17),
  ('Kentucky', 'KY', 18),
  ('Louisiana', 'LA', 19),
  ('Maine', 'ME', 20),
  ('Maryland', 'MD', 21),
  ('Massachusetts', 'MA', 22),
  ('Michigan', 'MI', 23),
  ('Minnesota', 'MN', 24),
  ('Mississippi', 'MS', 25),
  ('Missouri', 'MO', 26),
  ('Montana', 'MT', 27),
  ('Nebraska', 'NE', 28),
  ('Nevada', 'NV', 29),
  ('New Hampshire', 'NH', 30),
  ('New Jersey', 'NJ', 31),
  ('New Mexico', 'NM', 32),
  ('New York', 'NY', 33),
  ('North Carolina', 'NC', 34),
  ('North Dakota', 'ND', 35),
  ('Ohio', 'OH', 36),
  ('Oklahoma', 'OK', 37),
  ('Oregon', 'OR', 38),
  ('Pennsylvania', 'PA', 39),
  ('Rhode Island', 'RI', 40),
  ('South Carolina', 'SC', 41),
  ('South Dakota', 'SD', 42),
  ('Tennessee', 'TN', 43),
  ('Texas', 'TX', 44),
  ('Utah', 'UT', 45),
  ('Vermont', 'VT', 46),
  ('Virginia', 'VA', 47),
  ('Washington', 'WA', 48),
  ('West Virginia', 'WV', 49),
  ('Wisconsin', 'WI', 50),
  ('Wyoming', 'WY', 51)
) AS v(name, code, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM states s
  JOIN countries c ON c.id = s.country_id
  WHERE c.code = 'US' AND s.code = v.code
);

-- ---- Seed: Canadian provinces ----
INSERT INTO states (country_id, name, code, sort_order)
SELECT (SELECT id FROM countries WHERE code = 'CA'), v.name, v.code, v.sort_order
FROM (VALUES
  ('Ontario', 'ON', 1),
  ('Quebec', 'QC', 2),
  ('British Columbia', 'BC', 3),
  ('Alberta', 'AB', 4),
  ('Manitoba', 'MB', 5),
  ('Nova Scotia', 'NS', 6),
  ('New Brunswick', 'NB', 7),
  ('Saskatchewan', 'SK', 8),
  ('Newfoundland and Labrador', 'NL', 9),
  ('Prince Edward Island', 'PE', 10)
) AS v(name, code, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM states s
  JOIN countries c ON c.id = s.country_id
  WHERE c.code = 'CA' AND s.code = v.code
);

-- ---- Seed: US loading ports (matches client/src/utils/usLocations.js US_PORTS) ----
INSERT INTO loading_ports (name, country_id, code, is_active, sort_order)
SELECT v.name, (SELECT id FROM countries WHERE code = 'US'), v.code, TRUE, v.sort_order
FROM (VALUES
  ('Portland, ME', 'PWM', 1),
  ('Portsmouth, NH', 'PSM', 2),
  ('Boston, MA', 'BOS', 3),
  ('Providence, RI', 'PVD', 4),
  ('New London, CT', 'NLN', 5),
  ('New Haven, CT', 'NHV', 6),
  ('Bridgeport, CT', 'BDR', 7),
  ('New York / New Jersey', 'NYC', 8),
  ('Albany, NY', 'ALB', 9),
  ('Philadelphia, PA', 'PHL', 10),
  ('Camden, NJ', 'CDM', 11),
  ('Wilmington, DE', 'WIL', 12),
  ('Baltimore, MD', 'BAL', 13),
  ('Norfolk / Hampton Roads, VA', 'ORF', 14),
  ('Newport News, VA', 'PHF', 15),
  ('Richmond, VA', 'RIC', 16),
  ('Wilmington, NC', 'ILM', 17),
  ('Morehead City, NC', 'MRH', 18),
  ('Charleston, SC', 'CHS', 19),
  ('Georgetown, SC', 'GGE', 20),
  ('Savannah, GA', 'SAV', 21),
  ('Brunswick, GA', 'BQK', 22),
  ('Jacksonville, FL', 'JAX', 23),
  ('Fernandina, FL', 'FEC', 24),
  ('Port Canaveral, FL', 'PCA', 25),
  ('Port Everglades / Fort Lauderdale, FL', 'PEF', 26),
  ('Miami, FL', 'MIA', 27),
  ('Palm Beach, FL', 'PWP', 28),
  ('Key West, FL', 'KEY', 29),
  ('Tampa, FL', 'TPA', 30),
  ('Manatee, FL', 'MTH', 31),
  ('Pensacola, FL', 'PNS', 32),
  ('Panama City, FL', 'PCS', 33),
  ('Mobile, AL', 'MOB', 34),
  ('Pascagoula, MS', 'PGL', 35),
  ('Gulfport, MS', 'GPT', 36),
  ('New Orleans, LA', 'NWO', 37),
  ('Baton Rouge, LA', 'BTR', 38),
  ('Lake Charles, LA', 'LCH', 39),
  ('Beaumont, TX', 'BPT', 40),
  ('Port Arthur, TX', 'PRA', 41),
  ('Orange, TX', 'ORG', 42),
  ('Houston, TX', 'HOU', 43),
  ('Galveston, TX', 'GLO', 44),
  ('Texas City, TX', 'TXC', 45),
  ('Freeport, TX', 'FRE', 46),
  ('Corpus Christi, TX', 'CRP', 47),
  ('Brownsville, TX', 'BRO', 48),
  ('San Diego, CA', 'SAN', 49),
  ('Long Beach, CA', 'LGB', 50),
  ('Los Angeles, CA', 'LAX', 51),
  ('Port Hueneme, CA', 'HUE', 52),
  ('San Francisco, CA', 'SFO', 53),
  ('Oakland, CA', 'OAK', 54),
  ('Benicia, CA', 'BNC', 55),
  ('Richmond, CA', 'RCH', 56),
  ('Stockton, CA', 'STK', 57),
  ('Sacramento, CA', 'SAC', 58),
  ('Portland, OR', 'PDX', 59),
  ('Coos Bay, OR', 'CFL', 60),
  ('Astoria, OR', 'AST', 61),
  ('Vancouver, WA', 'VAN', 62),
  ('Longview, WA', 'LGV', 63),
  ('Kalama, WA', 'KSO', 64),
  ('Tacoma, WA', 'TAC', 65),
  ('Seattle, WA', 'SEA', 66),
  ('Everett, WA', 'EVT', 67),
  ('Bellingham, WA', 'BLI', 68),
  ('Anchorage, AK', 'ANC', 69),
  ('Whittier, AK', 'WTR', 70),
  ('Seward, AK', 'SWD', 71),
  ('Valdez, AK', 'VDZ', 72),
  ('Ketchikan, AK', 'KTN', 73),
  ('Juneau, AK', 'JNU', 74),
  ('Dutch Harbor, AK', 'DUT', 75),
  ('Honolulu, HI', 'HNL', 76),
  ('Hilo, HI', 'ITO', 77),
  ('Kahului, HI (Maui)', 'OGG', 78),
  ('Nawiliwili, HI (Kauai)', 'LIH', 79),
  ('Buffalo, NY', 'BUF', 80),
  ('Rochester, NY', 'ROC', 81),
  ('Oswego, NY', 'OSW', 82),
  ('Ogdensburg, NY', 'OGS', 83),
  ('Erie, PA', 'ERI', 84),
  ('Cleveland, OH', 'CLE', 85),
  ('Toledo, OH', 'TOL', 86),
  ('Detroit, MI', 'DET', 87),
  ('Muskegon, MI', 'MUS', 88),
  ('Chicago, IL', 'CHI', 89),
  ('Burns Harbor, IN', 'BRT', 90),
  ('Indiana Harbor, IN', 'IND', 91),
  ('Milwaukee, WI', 'MKE', 92),
  ('Green Bay, WI', 'GRB', 93),
  ('Manitowoc, WI', 'MAN', 94),
  ('Duluth, MN', 'DLH', 95),
  ('Superior, WI', 'SUW', 96),
  ('Memphis, TN', 'MEM', 97),
  ('St. Louis, MO', 'STL', 98),
  ('Cincinnati, OH', 'CIN', 99),
  ('Louisville, KY', 'LOU', 100),
  ('Pittsburgh, PA', 'PIT', 101),
  ('Nashville, TN', 'NSH', 102),
  ('San Juan, PR', 'SJU', 103),
  ('Ponce, PR', 'PSE', 104),
  ('Mayagüez, PR', 'MAZ', 105),
  ('Charlotte Amalie, USVI (St. Thomas)', 'STT', 106),
  ('Frederiksted, USVI (St. Croix)', 'STX', 107),
  ('Apra Harbor, Guam', 'GUM', 108),
  ('Saipan, MP', 'SPN', 109),
  ('Pago Pago, AS', 'PPG', 110)
) AS v(name, code, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM loading_ports lp WHERE lp.code = v.code);

-- ---- Seed: Canadian loading ports, pulled live from the existing calc_ports
-- admin table so any ports added there are picked up automatically ----
INSERT INTO loading_ports (name, country_id, code, is_active, sort_order)
SELECT cp.name, (SELECT id FROM countries WHERE code = 'CA'), NULL, TRUE, 1000 + cp.sort_order
FROM calc_ports cp
WHERE cp.kind = 'loading' AND cp.name ILIKE 'CANADA%'
  AND NOT EXISTS (
    SELECT 1 FROM loading_ports lp
    WHERE lp.name = cp.name AND lp.country_id = (SELECT id FROM countries WHERE code = 'CA')
  );

-- ---- Seed: cities, from existing known auction locations in the calculator
-- matrix. Match calculator.state against states.code OR states.name
-- (case-insensitive); rows whose state can't be matched are skipped. ----
INSERT INTO cities (state_id, name, sort_order)
SELECT s.id, calc.city, 0
FROM (
  SELECT DISTINCT city, state FROM calculator WHERE city IS NOT NULL AND city <> ''
) AS calc
JOIN states s
  ON UPPER(s.code) = UPPER(calc.state) OR UPPER(s.name) = UPPER(calc.state)
WHERE NOT EXISTS (
  SELECT 1 FROM cities existing
  WHERE existing.state_id = s.id AND UPPER(existing.name) = UPPER(calc.city)
);
