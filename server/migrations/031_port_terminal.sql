-- Destination ports get an optional terminal name, shown with the port.
ALTER TABLE ports ADD COLUMN IF NOT EXISTS terminal VARCHAR(160);
