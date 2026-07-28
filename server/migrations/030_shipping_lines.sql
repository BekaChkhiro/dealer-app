-- Admin-managed shipping lines with per-line container tracking URL templates.
-- The tracking_url_template holds a {container} placeholder that gets replaced
-- with the vehicle's container number so a click opens the line's tracking page.
CREATE TABLE IF NOT EXISTS shipping_lines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  tracking_url_template TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed a few common shipping lines. Guarded so re-running is safe.
INSERT INTO shipping_lines (name, tracking_url_template, sort_order)
SELECT 'MSC', 'https://www.msc.com/en/track-a-shipment?trackingNumber={container}', 1
WHERE NOT EXISTS (SELECT 1 FROM shipping_lines WHERE LOWER(name) = LOWER('MSC'));

INSERT INTO shipping_lines (name, tracking_url_template, sort_order)
SELECT 'Maersk', 'https://www.maersk.com/tracking/{container}', 2
WHERE NOT EXISTS (SELECT 1 FROM shipping_lines WHERE LOWER(name) = LOWER('Maersk'));

INSERT INTO shipping_lines (name, tracking_url_template, sort_order)
SELECT 'ZIM', 'https://www.zim.com/tools/track-a-shipment?consnumber={container}', 3
WHERE NOT EXISTS (SELECT 1 FROM shipping_lines WHERE LOWER(name) = LOWER('ZIM'));

INSERT INTO shipping_lines (name, tracking_url_template, sort_order)
SELECT 'CMA CGM', 'https://www.cma-cgm.com/ebusiness/tracking/search?SearchBy=Container&Reference={container}', 4
WHERE NOT EXISTS (SELECT 1 FROM shipping_lines WHERE LOWER(name) = LOWER('CMA CGM'));

INSERT INTO shipping_lines (name, tracking_url_template, sort_order)
SELECT 'Hapag-Lloyd', 'https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container={container}', 5
WHERE NOT EXISTS (SELECT 1 FROM shipping_lines WHERE LOWER(name) = LOWER('Hapag-Lloyd'));
