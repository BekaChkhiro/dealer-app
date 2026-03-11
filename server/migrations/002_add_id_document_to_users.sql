-- Migration: Add ID document fields to users table
-- Created: 2026-03-10

-- Add id_document_url column for storing the uploaded document URL
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_document_url VARCHAR(500);

-- Add id_verified column for storing verification status
-- Values: NULL (not uploaded), false (pending verification), true (verified)
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT NULL;

-- Add timestamp for when the document was uploaded
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_document_uploaded_at TIMESTAMP;

-- Add who verified the document (admin user id)
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add timestamp for when the document was verified
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMP;
