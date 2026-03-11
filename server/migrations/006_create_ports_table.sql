-- Migration: Create ports table
-- This migration adds the ports table for managing shipping ports

CREATE TABLE IF NOT EXISTS ports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  country VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ports_is_active ON ports(is_active);
CREATE INDEX IF NOT EXISTS idx_ports_code ON ports(code);
