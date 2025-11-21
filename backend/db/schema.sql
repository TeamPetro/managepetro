-- PostgreSQL-compatible schema for ManagePetro
-- This file is automatically executed by init_production_db.py on Render
-- (CREATE DATABASE and USE commands are skipped by init_production_db.py)

-- USERS (Authentication)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_email ON users(email);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DRIVERS

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(32) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  license_number VARCHAR(50) UNIQUE NOT NULL,
  license_class VARCHAR(10) NOT NULL,
  license_expiry_date DATE NOT NULL,
  hazmat_certified BOOLEAN DEFAULT FALSE,
  hazmat_expiry_date DATE,
  tanker_endorsement BOOLEAN DEFAULT FALSE,
  years_experience INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
  max_hours_per_shift DECIMAL(4,2) DEFAULT 12.00,
  current_location VARCHAR(255),
  home_terminal VARCHAR(100),
  hourly_rate DECIMAL(8,2),
  certifications TEXT,
  notes TEXT,
  hired_date DATE,
  last_medical_exam DATE,
  next_medical_exam DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_employee_id ON drivers(employee_id);
CREATE INDEX IF NOT EXISTS idx_driver_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_license_number ON drivers(license_number);

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STATIONS

CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  lat DECIMAL(9,6),
  lon DECIMAL(9,6),
  city VARCHAR(100),
  region VARCHAR(100),
  fuel_type VARCHAR(20) DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'gasoline', 'propane')),
  capacity_liters DECIMAL(12,2),
  current_level_liters DECIMAL(12,2),
  request_method VARCHAR(20) DEFAULT 'Manual' CHECK (request_method IN ('IoT', 'Manual')),
  low_fuel_threshold DECIMAL(12,2) DEFAULT 5000
);

-- TRUCKS

CREATE TABLE IF NOT EXISTS trucks (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  plate VARCHAR(32),
  capacity_liters DECIMAL(12,2),
  fuel_level_percent SMALLINT,
  fuel_type VARCHAR(20) DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'gasoline', 'propane')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline')),
  current_driver_id INT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  current_location VARCHAR(255),
  FOREIGN KEY (current_driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_current_driver ON trucks(current_driver_id);

-- DELIVERIES

CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  truck_id INT,
  station_id INT,
  driver_id INT,
  volume_liters DECIMAL(12,2),
  delivery_date TIMESTAMP,
  completed_date TIMESTAMP,
  estimated_duration_minutes INT,
  actual_duration_minutes INT,
  distance_km DECIMAL(8,2),
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'enroute', 'delivered', 'canceled')),
  notes TEXT,
  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_delivery_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_delivery_date ON deliveries(delivery_date);

-- STATION FUEL LEVELS

CREATE TABLE IF NOT EXISTS station_fuel_levels (
  id SERIAL PRIMARY KEY,
  station_id INT,
  recorded_at TIMESTAMP DEFAULT NOW(),
  fuel_level_liters DECIMAL(12,2),
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- TRUCK COMPARTMENTS

CREATE TABLE IF NOT EXISTS truck_compartments (
  id SERIAL PRIMARY KEY,
  truck_id INT NOT NULL,
  compartment_number INT NOT NULL,
  fuel_type VARCHAR(20) NOT NULL CHECK (fuel_type IN ('diesel', 'gasoline', 'propane')),
  capacity_liters DECIMAL(12,2) NOT NULL,
  current_level_liters DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  UNIQUE (truck_id, compartment_number)
);

-- WEATHER

CREATE TABLE IF NOT EXISTS weather_data (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100),
  temperature DOUBLE PRECISION,
  condition TEXT,
  wind DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  collected_at TIMESTAMP
);

-- DRIVER SHIFTS (for Hours of Service compliance)

CREATE TABLE IF NOT EXISTS driver_shifts (
  id SERIAL PRIMARY KEY,
  driver_id INT NOT NULL,
  shift_start TIMESTAMP NOT NULL,
  shift_end TIMESTAMP,
  total_hours DECIMAL(4,2),
  break_hours DECIMAL(4,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'interrupted')),
  notes TEXT,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_driver_shift ON driver_shifts(driver_id, shift_start);
CREATE INDEX IF NOT EXISTS idx_shift_status ON driver_shifts(status);