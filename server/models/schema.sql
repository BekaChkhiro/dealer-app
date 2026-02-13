-- Dealer App - Database Schema
-- All tables for the dealer/car import management dashboard

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  surname VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  balance DECIMAL(12,2) DEFAULT 0,
  phone VARCHAR(50),
  calculator_category VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  identity_number VARCHAR(50),
  signup_date TIMESTAMP DEFAULT NOW(),
  last_login_time TIMESTAMP,
  last_purchase_date TIMESTAMP,
  superviser_fee DECIMAL(12,2) DEFAULT 0,
  creator INTEGER,
  debt DECIMAL(12,2) DEFAULT 0
);

-- 2. Boats table (created before booking/containers since they reference it)
CREATE TABLE IF NOT EXISTS boats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  identification_code VARCHAR(100),
  departure_date TIMESTAMP,
  estimated_arrival_date TIMESTAMP,
  arrival_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'us_port'
);

-- 3. Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  buyer VARCHAR(255),
  dealer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  receiver_fullname VARCHAR(255),
  receiver_identity_number VARCHAR(50),
  mark VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  vin VARCHAR(50),
  lot_number VARCHAR(100),
  auction VARCHAR(100),
  receiver_phone VARCHAR(50),
  us_state VARCHAR(100),
  destination_port VARCHAR(100),
  us_port VARCHAR(100),
  is_sublot BOOLEAN DEFAULT FALSE,
  is_fully_paid BOOLEAN DEFAULT FALSE,
  is_partially_paid BOOLEAN DEFAULT FALSE,
  is_funded BOOLEAN DEFAULT FALSE,
  is_insured BOOLEAN DEFAULT FALSE,
  doc_type VARCHAR(50),
  container_cost DECIMAL(12,2) DEFAULT 0,
  landing_cost DECIMAL(12,2) DEFAULT 0,
  vehicle_price DECIMAL(12,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  payed_amount DECIMAL(12,2) DEFAULT 0,
  debt_amount DECIMAL(12,2) DEFAULT 0,
  create_date TIMESTAMP DEFAULT NOW(),
  container_number VARCHAR(100),
  line VARCHAR(100),
  current_status VARCHAR(100),
  vehicle_pickup_date TIMESTAMP,
  warehouse_receive_date TIMESTAMP,
  container_loading_date TIMESTAMP,
  estimated_receive_date TIMESTAMP,
  receive_date TIMESTAMP,
  booking VARCHAR(100),
  dealer_fee DECIMAL(12,2) DEFAULT 0,
  status_color VARCHAR(20),
  buyer_number VARCHAR(50),
  has_key BOOLEAN DEFAULT FALSE,
  profile_image_url VARCHAR(500),
  has_auction_image BOOLEAN DEFAULT FALSE,
  has_transportation_image BOOLEAN DEFAULT FALSE,
  has_port_image BOOLEAN DEFAULT FALSE,
  has_poti_image BOOLEAN DEFAULT FALSE,
  is_hybrid BOOLEAN DEFAULT FALSE,
  vehicle_type VARCHAR(50),
  container_open_date TIMESTAMP,
  container_receive_date TIMESTAMP,
  receiver_changed BOOLEAN DEFAULT FALSE,
  receiver_change_date TIMESTAMP,
  driver_fullname VARCHAR(255),
  driver_phone VARCHAR(50),
  driver_car_license_number VARCHAR(50),
  purchase_date TIMESTAMP,
  driver_company VARCHAR(255),
  late_car_payment DECIMAL(12,2) DEFAULT 0
);

-- 4. Booking table
CREATE TABLE IF NOT EXISTS booking (
  id SERIAL PRIMARY KEY,
  vin VARCHAR(50),
  buyer_fullname VARCHAR(255),
  booking_number VARCHAR(100),
  booking_paid BOOLEAN DEFAULT FALSE,
  container VARCHAR(100),
  container_loaded_date TIMESTAMP,
  container_receiver VARCHAR(255),
  container_receive_date TIMESTAMP,
  container_released BOOLEAN DEFAULT FALSE,
  delivery_location VARCHAR(255),
  estimated_arrival_date TIMESTAMP,
  line VARCHAR(100),
  open_date TIMESTAMP,
  est_opening_date TIMESTAMP,
  loading_port VARCHAR(100),
  terminal VARCHAR(100),
  car_details TEXT,
  lot_number VARCHAR(100),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  create_date TIMESTAMP DEFAULT NOW(),
  boat_id INTEGER REFERENCES boats(id) ON DELETE SET NULL,
  boat_name VARCHAR(255)
);

-- 5. Containers table
CREATE TABLE IF NOT EXISTS containers (
  id SERIAL PRIMARY KEY,
  container_number VARCHAR(100),
  vin VARCHAR(50),
  purchase_date TIMESTAMP,
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  manufacturer_year INTEGER,
  buyer_name VARCHAR(255),
  booking VARCHAR(100),
  delivery_location VARCHAR(255),
  container_open_date TIMESTAMP,
  line VARCHAR(100),
  personal_number VARCHAR(50),
  lot_number VARCHAR(100),
  loading_port VARCHAR(100),
  container_loaded_date TIMESTAMP,
  container_receive_date TIMESTAMP,
  boat_id INTEGER REFERENCES boats(id) ON DELETE SET NULL,
  boat_name VARCHAR(255),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'booked'
);

-- 6. Calculator table
CREATE TABLE IF NOT EXISTS calculator (
  id SERIAL PRIMARY KEY,
  auction VARCHAR(100),
  city VARCHAR(255),
  destination VARCHAR(255),
  land_price DECIMAL(12,2) DEFAULT 0,
  container_price DECIMAL(12,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0,
  port VARCHAR(100)
);

-- 7. Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  payer VARCHAR(255),
  create_date TIMESTAMP DEFAULT NOW(),
  vin VARCHAR(50),
  mark VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  buyer VARCHAR(255),
  personal_number VARCHAR(50),
  paid_amount DECIMAL(12,2) DEFAULT 0,
  payment_type VARCHAR(50),
  "addToBalanseAmount" DECIMAL(12,2) DEFAULT 0
);

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_vehicles_dealer_id ON vehicles(dealer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_auction ON vehicles(auction);
CREATE INDEX IF NOT EXISTS idx_vehicles_current_status ON vehicles(current_status);
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON booking(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_vin ON booking(vin);
CREATE INDEX IF NOT EXISTS idx_containers_user_id ON containers(user_id);
CREATE INDEX IF NOT EXISTS idx_containers_vin ON containers(vin);
CREATE INDEX IF NOT EXISTS idx_transactions_vin ON transactions(vin);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
