-- Migration: Remove booking field from vehicles table
-- Task: T8.13 - Remove booking field from vehicles

-- Drop booking column from vehicles table
ALTER TABLE vehicles DROP COLUMN IF EXISTS booking;
