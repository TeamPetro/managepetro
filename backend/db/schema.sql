CREATE DATABASE IF NOT EXISTS manage_petro;
USE manage_petro;

-- USERS (Authentication)

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- DRIVERS

CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  status ENUM('active', 'on_leave', 'inactive') DEFAULT 'active',
  max_hours_per_shift DECIMAL(4,2) DEFAULT 12.00,
  current_location VARCHAR(255),
  home_terminal VARCHAR(100),
  hourly_rate DECIMAL(8,2),
  certifications TEXT,
  notes TEXT,
  hired_date DATE,
  last_medical_exam DATE,
  next_medical_exam DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_id (employee_id),
  INDEX idx_status (status),
  INDEX idx_license_number (license_number)
);

-- STATIONS

CREATE TABLE IF NOT EXISTS stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  lat DECIMAL(9,6),
  lon DECIMAL(9,6),
  city VARCHAR(100),
  region VARCHAR(100),
  fuel_type ENUM('diesel', 'gasoline', 'propane') DEFAULT 'diesel',
  capacity_liters DECIMAL(12,2),
  current_level_liters DECIMAL(12,2),
  request_method ENUM('IoT', 'Manual') DEFAULT 'Manual',
  low_fuel_threshold DECIMAL(12,2) DEFAULT 5000
);

-- TRUCKS

CREATE TABLE IF NOT EXISTS trucks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  plate VARCHAR(32),
  capacity_liters DECIMAL(12,2),
  fuel_level_percent TINYINT,
  fuel_type ENUM('diesel', 'gasoline', 'propane') DEFAULT 'diesel',
  status ENUM('active', 'maintenance', 'offline') DEFAULT 'active',
  current_driver_id INT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  current_location VARCHAR(255),
  FOREIGN KEY (current_driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  INDEX idx_current_driver (current_driver_id)
);

-- DELIVERIES
CREATE TABLE IF NOT EXISTS deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  truck_id INT,
  station_id INT,
  driver_id INT,
  volume_liters DECIMAL(12,2),
  delivery_date DATETIME,
  completed_date DATETIME,
  estimated_duration_minutes INT,
  actual_duration_minutes INT,
  distance_km DECIMAL(8,2),
  status ENUM('planned', 'enroute', 'delivered', 'canceled') DEFAULT 'planned',
  notes TEXT,
  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  INDEX idx_driver (driver_id),
  INDEX idx_status (status),
  INDEX idx_delivery_date (delivery_date)
);

-- STATION FUEL LEVELS

CREATE TABLE IF NOT EXISTS station_fuel_levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  fuel_level_liters DECIMAL(12,2),
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- TRUCK COMPARTMENTS

CREATE TABLE IF NOT EXISTS truck_compartments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  truck_id INT NOT NULL,
  compartment_number INT NOT NULL,
  fuel_type ENUM('diesel', 'gasoline', 'propane') NOT NULL,
  capacity_liters DECIMAL(12,2) NOT NULL,
  current_level_liters DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  UNIQUE KEY unique_truck_compartment (truck_id, compartment_number)
);

-- WEATHER

CREATE TABLE IF NOT EXISTS weather_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city VARCHAR(100),
  temperature FLOAT,
  `condition` TEXT,
  wind FLOAT,
  humidity FLOAT,
  collected_at TIMESTAMP
);

-- DRIVER SHIFTS (for Hours of Service compliance)

CREATE TABLE IF NOT EXISTS driver_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  shift_start DATETIME NOT NULL,
  shift_end DATETIME,
  total_hours DECIMAL(4,2),
  break_hours DECIMAL(4,2) DEFAULT 0,
  status ENUM('active', 'completed', 'interrupted') DEFAULT 'active',
  notes TEXT,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  INDEX idx_driver_shift (driver_id, shift_start),
  INDEX idx_shift_status (status)
);