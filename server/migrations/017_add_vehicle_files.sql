-- Create vehicle_files table for storing multiple files per vehicle
CREATE TABLE IF NOT EXISTS vehicle_files (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on vehicle_id for faster lookups
CREATE INDEX idx_vehicle_files_vehicle_id ON vehicle_files(vehicle_id);

-- Create index on uploaded_by
CREATE INDEX idx_vehicle_files_uploaded_by ON vehicle_files(uploaded_by);
