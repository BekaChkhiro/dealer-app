-- Admin announcements shown to all dealers on their dashboard (non-dismissible).
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
