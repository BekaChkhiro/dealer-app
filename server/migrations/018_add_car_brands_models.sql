-- Migration: Add car_brands and car_models reference tables
-- Allows the vehicle form to autocomplete mark/model from a managed list,
-- while still letting users type new values that get saved on first use.

CREATE TABLE IF NOT EXISTS car_brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_car_brands_name ON car_brands(name);

CREATE TABLE IF NOT EXISTS car_models (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER NOT NULL REFERENCES car_brands(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

CREATE INDEX IF NOT EXISTS idx_car_models_brand_id ON car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_car_models_name ON car_models(name);

-- Seed brands from existing distinct vehicle marks
INSERT INTO car_brands (name)
SELECT DISTINCT TRIM(mark)
FROM vehicles
WHERE mark IS NOT NULL AND TRIM(mark) <> ''
ON CONFLICT (name) DO NOTHING;

-- Seed models linked to the matching brand
INSERT INTO car_models (brand_id, name)
SELECT b.id, TRIM(v.model)
FROM vehicles v
JOIN car_brands b ON LOWER(TRIM(v.mark)) = LOWER(b.name)
WHERE v.model IS NOT NULL AND TRIM(v.model) <> ''
GROUP BY b.id, TRIM(v.model)
ON CONFLICT (brand_id, name) DO NOTHING;
