-- Add a separate `state` column to the calculator pricing matrix so that
-- locations can be stored as city + state (e.g. city='Los Angeles', state='CA').
ALTER TABLE calculator ADD COLUMN IF NOT EXISTS state VARCHAR(100);
