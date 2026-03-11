-- Migration: Add receiver ID document field to vehicles table
-- This allows dealers to upload receiver's ID document as an alternative to manual entry

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS receiver_id_document_url VARCHAR(500);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS receiver_id_uploaded_at TIMESTAMP;
