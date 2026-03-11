-- Migration: Add port_id foreign key to containers table
-- This links containers to ports for the "container creation on Ports page" feature

-- Add port_id column to containers table
ALTER TABLE containers ADD COLUMN IF NOT EXISTS port_id INTEGER REFERENCES ports(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_containers_port_id ON containers(port_id);

-- Add container_count to ports (denormalized for performance, optional)
-- We'll compute this dynamically instead via COUNT aggregation
