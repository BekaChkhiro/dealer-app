-- Saved "frequent receivers" so dealers/admins don't re-type recurring
-- recipient data (name+surname, personal number, phone) for each car.
CREATE TABLE IF NOT EXISTS frequent_receivers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  fullname VARCHAR(255) NOT NULL,
  identity_number VARCHAR(100),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frequent_receivers_user ON frequent_receivers(user_id);
