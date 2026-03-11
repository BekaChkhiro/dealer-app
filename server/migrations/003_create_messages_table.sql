-- Migration: Create messages table for admin-to-dealer messaging
-- Created: 2026-03-11

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(500) NOT NULL,
  body TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Comments
COMMENT ON TABLE messages IS 'Admin-to-dealer messaging system';
COMMENT ON COLUMN messages.from_user_id IS 'User who sent the message (typically admin)';
COMMENT ON COLUMN messages.to_user_id IS 'User who receives the message (typically dealer)';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read (NULL = unread)';
