-- Migration: Add index on vehicles.container_number for container status sync
-- This index improves performance when updating vehicle statuses based on container changes

CREATE INDEX IF NOT EXISTS idx_vehicles_container_number ON vehicles(container_number);
