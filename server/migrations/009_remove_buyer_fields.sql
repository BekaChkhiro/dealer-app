-- Migration: Remove buyer fields from vehicles table
-- Task: T8.9 - Remove buyer fields from vehicles

-- Drop buyer and buyer_number columns from vehicles table
ALTER TABLE vehicles DROP COLUMN IF EXISTS buyer;
ALTER TABLE vehicles DROP COLUMN IF EXISTS buyer_number;
