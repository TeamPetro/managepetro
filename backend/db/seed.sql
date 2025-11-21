-- ManagePetro seed data for Supabase PostgreSQL
-- Run as a SQL script (e.g., in Supabase SQL editor or migration)
-- Assumes all tables are in the "public" schema.

SET search_path TO public;

-- =====================
-- Clear existing data (safe re-seeding)
-- =====================
TRUNCATE TABLE
  driver_shifts,
  weather_data,
  station_fuel_levels,
  deliveries,
  truck_compartments,
  trucks,
  drivers,
  stations,
  users
RESTART IDENTITY CASCADE;

-- Note: TRUNCATE with RESTART IDENTITY automatically resets sequences
-- (PostgreSQL equivalent of AUTO_INCREMENT)

-- =====================
-- Demo Users (for authentication)
-- =====================
-- Password for all demo users: "demo123"
-- Hash generated with: pwdlib PasswordHash using argon2
INSERT INTO users (username, email, hashed_password, is_active) VALUES
('demo', 'demo@managepetro.com', '$argon2id$v=19$m=65536,t=3,p=4$8B5DyDmnNAaAMIawVqqV0g$VjgNert3l1JlXH5AmC6f0vOGJmxLlAqSLV2gPBnGOGs', TRUE),
('admin', 'admin@managepetro.com', '$argon2id$v=19$m=65536,t=3,p=4$8B5DyDmnNAaAMIawVqqV0g$VjgNert3l1JlXH5AmC6f0vOGJmxLlAqSLV2gPBnGOGs', TRUE);

-- =====================
-- Drivers (~25 professional fuel truck drivers)
-- =====================
INSERT INTO drivers (
  employee_id,
  first_name,
  last_name,
  phone,
  email,
  license_number,
  license_class,
  license_expiry_date,
  hazmat_certified,
  hazmat_expiry_date,
  tanker_endorsement,
  years_experience,
  status,
  max_hours_per_shift,
  current_location,
  home_terminal,
  hourly_rate,
  certifications,
  hired_date,
  last_medical_exam,
  next_medical_exam
) VALUES
-- Toronto Drivers
('DRV001','John','Martinez','416-555-0101','john.martinez@managepetro.com','ON-CDL-10234','A','2026-06-15',TRUE,'2026-03-20',TRUE,12,'active',11.00,'Toronto, ON','Toronto',35.50,'Class A CDL, HazMat, Tanker, FAST Card','2015-03-10','2024-08-15','2026-08-15'),
('DRV002','Sarah','Chen','416-555-0102','sarah.chen@managepetro.com','ON-CDL-10891','A','2025-11-20',TRUE,'2025-09-10',TRUE,8,'active',11.00,'Toronto, ON','Toronto',32.75,'Class A CDL, HazMat, Tanker','2018-06-22','2024-05-10','2026-05-10'),
('DRV003','Michael','Johnson','416-555-0103','michael.johnson@managepetro.com','ON-CDL-11456','A','2026-03-18',TRUE,'2026-01-05',TRUE,15,'active',11.00,'Toronto, ON','Toronto',38.00,'Class A CDL, HazMat, Tanker, FAST Card, Trainer','2012-01-15','2024-09-20','2026-09-20'),
('DRV004','Emily','Rodriguez','416-555-0104','emily.rodriguez@managepetro.com','ON-CDL-12009','A','2025-08-25',TRUE,'2025-07-12',TRUE,6,'active',11.00,'Toronto, ON','Toronto',30.25,'Class A CDL, HazMat, Tanker','2020-02-10','2024-03-15','2026-03-15'),
('DRV005','David','Singh','416-555-0105','david.singh@managepetro.com','ON-CDL-12567','A','2026-05-10',FALSE,NULL,TRUE,4,'active',11.00,'Toronto, ON','Toronto',28.50,'Class A CDL, Tanker','2021-11-05','2024-11-01','2026-11-01'),
-- Vancouver Drivers
('DRV006','Jessica','Wong','604-555-0201','jessica.wong@managepetro.com','BC-CDL-20145','A','2026-07-22',TRUE,'2026-04-15',TRUE,10,'active',11.00,'Vancouver, BC','Vancouver',34.75,'Class A CDL, HazMat, Tanker','2016-05-12','2024-06-20','2026-06-20'),
('DRV007','Robert','Taylor','604-555-0202','robert.taylor@managepetro.com','BC-CDL-20678','A','2025-12-30',TRUE,'2025-10-20',TRUE,9,'active',11.00,'Vancouver, BC','Vancouver',33.50,'Class A CDL, HazMat, Tanker','2017-08-18','2024-07-10','2026-07-10'),
('DRV008','Amanda','Lee','604-555-0203','amanda.lee@managepetro.com','BC-CDL-21234','A','2026-02-14',TRUE,'2025-12-05',TRUE,7,'active',11.00,'Vancouver, BC','Vancouver',31.75,'Class A CDL, HazMat, Tanker','2019-03-25','2024-04-12','2026-04-12'),
('DRV009','Thomas','Brown','604-555-0204','thomas.brown@managepetro.com','BC-CDL-21789','A','2025-09-08',FALSE,NULL,TRUE,5,'on_leave',11.00,'Vancouver, BC','Vancouver',29.50,'Class A CDL, Tanker','2020-07-30','2024-02-18','2026-02-18'),
-- Calgary Drivers
('DRV010','Patricia','Anderson','403-555-0301','patricia.anderson@managepetro.com','AB-CDL-30234','A','2026-04-20',TRUE,'2026-02-10',TRUE,13,'active',11.00,'Calgary, AB','Calgary',36.25,'Class A CDL, HazMat, Tanker, Winter Driving','2014-09-15','2024-10-05','2026-10-05'),
('DRV011','James','Wilson','403-555-0302','james.wilson@managepetro.com','AB-CDL-30678','A','2025-10-15',TRUE,'2025-08-20',TRUE,11,'active',11.00,'Calgary, AB','Calgary',35.00,'Class A CDL, HazMat, Tanker','2015-12-20','2024-08-25','2026-08-25'),
('DRV012','Linda','Thompson','403-555-0303','linda.thompson@managepetro.com','AB-CDL-31123','A','2026-01-08',TRUE,'2025-11-15',TRUE,8,'active',11.00,'Calgary, AB','Calgary',32.50,'Class A CDL, HazMat, Tanker','2018-04-10','2024-06-30','2026-06-30'),
-- Montreal Drivers
('DRV013','Daniel','Dubois','514-555-0401','daniel.dubois@managepetro.com','QC-CDL-40156','A','2026-06-30',TRUE,'2026-03-25',TRUE,14,'active',11.00,'Montreal, QC','Montreal',37.00,'Class A CDL, HazMat, Tanker, Bilingual','2013-07-22','2024-09-10','2026-09-10'),
('DRV014','Marie','Lavoie','514-555-0402','marie.lavoie@managepetro.com','QC-CDL-40589','A','2025-11-18',TRUE,'2025-09-05',TRUE,10,'active',11.00,'Montreal, QC','Montreal',34.50,'Class A CDL, HazMat, Tanker, Bilingual','2016-02-14','2024-05-20','2026-05-20'),
('DRV015','Pierre','Gagnon','514-555-0403','pierre.gagnon@managepetro.com','QC-CDL-41012','A','2026-03-12',TRUE,'2026-01-08',TRUE,7,'active',11.00,'Montreal, QC','Montreal',31.50,'Class A CDL, HazMat, Tanker, Bilingual','2019-11-05','2024-04-15','2026-04-15'),
-- Edmonton Drivers
('DRV016','Christopher','Davis','780-555-0501','christopher.davis@managepetro.com','AB-CDL-50123','A','2025-12-20',TRUE,'2025-10-15',TRUE,9,'active',11.00,'Edmonton, AB','Edmonton',33.75,'Class A CDL, HazMat, Tanker','2017-05-18','2024-07-22','2026-07-22'),
('DRV017','Nancy','Moore','780-555-0502','nancy.moore@managepetro.com','AB-CDL-50567','A','2026-02-28',TRUE,'2025-12-20',TRUE,12,'active',11.00,'Edmonton, AB','Edmonton',35.75,'Class A CDL, HazMat, Tanker, Winter Driving','2014-10-30','2024-08-18','2026-08-18'),
-- Ottawa Drivers
('DRV018','Kevin','Martin','613-555-0601','kevin.martin@managepetro.com','ON-CDL-60234','A','2026-05-15',TRUE,'2026-02-20',TRUE,6,'active',11.00,'Ottawa, ON','Ottawa',30.75,'Class A CDL, HazMat, Tanker','2020-06-12','2024-03-25','2026-03-25'),
('DRV019','Michelle','Tremblay','613-555-0602','michelle.tremblay@managepetro.com','ON-CDL-60678','A','2025-09-22',TRUE,'2025-07-18',TRUE,8,'active',11.00,'Ottawa, ON','Ottawa',32.25,'Class A CDL, HazMat, Tanker, Bilingual','2018-08-20','2024-05-30','2026-05-30'),
-- Additional Float Drivers (multi-terminal)
('DRV020','Brian','Garcia','416-555-0701','brian.garcia@managepetro.com','ON-CDL-70145','A','2026-04-10',TRUE,'2026-01-15',TRUE,11,'active',11.00,'Toronto, ON','Toronto',35.25,'Class A CDL, HazMat, Tanker, Trainer','2015-09-08','2024-10-12','2026-10-12'),
('DRV021','Angela','White','604-555-0702','angela.white@managepetro.com','BC-CDL-70589','A','2025-10-28',TRUE,'2025-08-15',TRUE,13,'active',11.00,'Vancouver, BC','Vancouver',36.50,'Class A CDL, HazMat, Tanker, FAST Card','2014-03-22','2024-09-05','2026-09-05'),
('DRV022','Ryan','Campbell','403-555-0703','ryan.campbell@managepetro.com','AB-CDL-71012','A','2026-01-20',FALSE,NULL,TRUE,5,'active',11.00,'Calgary, AB','Calgary',29.75,'Class A CDL, Tanker','2021-02-15','2024-11-20','2026-11-20'),
('DRV023','Stephanie','Clark','514-555-0704','stephanie.clark@managepetro.com','QC-CDL-71456','A','2025-11-05',TRUE,'2025-09-01',TRUE,9,'active',11.00,'Montreal, QC','Montreal',33.25,'Class A CDL, HazMat, Tanker, Bilingual','2017-06-30','2024-06-15','2026-06-15'),
('DRV024','George','Lewis','780-555-0705','george.lewis@managepetro.com','AB-CDL-71890','A','2026-03-25',TRUE,'2026-01-10',TRUE,10,'active',11.00,'Edmonton, AB','Edmonton',34.25,'Class A CDL, HazMat, Tanker','2016-12-10','2024-07-08','2026-07-08'),
('DRV025','Karen','Hall','613-555-0706','karen.hall@managepetro.com','ON-CDL-72234','A','2025-08-30',TRUE,'2025-06-22',TRUE,7,'inactive',11.00,'Ottawa, ON','Ottawa',31.25,'Class A CDL, HazMat, Tanker','2019-10-18','2024-04-28','2026-04-28');

-- =====================
-- Stations (~78, multiple per city CA + US)
-- =====================
INSERT INTO stations (
  code,
  name,
  lat,
  lon,
  city,
  region,
  fuel_type,
  capacity_liters,
  current_level_liters,
  request_method,
  low_fuel_threshold
) VALUES
-- Canada: Toronto (6)
('S001','Manage Petro - Toronto East',43.6530,-79.3400,'Toronto','ON','diesel',120000,26000,'IoT',30000),
('S002','Manage Petro - Toronto West',43.6490,-79.3800,'Toronto','ON','diesel',110000,23000,'IoT',30000),
('S003','Manage Petro - Toronto North',43.7250,-79.4500,'Toronto','ON','gasoline',95000,21000,'Manual',25000),
('S004','Manage Petro - Toronto South',43.6340,-79.4050,'Toronto','ON','diesel',105000,24000,'IoT',28000),
('S005','Manage Petro - Toronto Airport',43.6777,-79.6248,'Toronto','ON','gasoline',98000,25000,'IoT',26000),
('S006','Manage Petro - Toronto Port',43.6426,-79.3549,'Toronto','ON','diesel',115000,29000,'Manual',30000),
-- Vancouver (4)
('S007','Manage Petro - Vancouver East',49.2820,-123.0900,'Vancouver','BC','gasoline',90000,22000,'IoT',24000),
('S008','Manage Petro - Vancouver West',49.2570,-123.1960,'Vancouver','BC','diesel',95000,20000,'Manual',26000),
('S009','Manage Petro - Vancouver North',49.3200,-123.0720,'Vancouver','BC','diesel',98000,26000,'IoT',27000),
('S010','Manage Petro - Vancouver South',49.2100,-123.1200,'Vancouver','BC','gasoline',88000,21000,'IoT',23000),
-- Calgary (3)
('S011','Manage Petro - Calgary NE',51.0900,-114.0110,'Calgary','AB','diesel',110000,40000,'Manual',35000),
('S012','Manage Petro - Calgary NW',51.1000,-114.1500,'Calgary','AB','gasoline',98000,26000,'IoT',28000),
('S013','Manage Petro - Calgary South',50.9500,-114.0700,'Calgary','AB','diesel',100000,30000,'Manual',30000),
-- Montreal (3)
('S014','Manage Petro - Montreal East',45.5500,-73.5200,'Montreal','QC','diesel',120000,41000,'Manual',38000),
('S015','Manage Petro - Montreal West',45.4700,-73.6800,'Montreal','QC','gasoline',98000,23000,'IoT',26000),
('S016','Manage Petro - Montreal South',45.4500,-73.5200,'Montreal','QC','diesel',105000,31000,'IoT',30000),
-- Edmonton (2)
('S017','Manage Petro - Edmonton North',53.6000,-113.5000,'Edmonton','AB','propane',105000,35000,'Manual',30000),
('S018','Manage Petro - Edmonton South',53.4700,-113.5100,'Edmonton','AB','diesel',98000,28000,'IoT',28000),
-- Ottawa (2)
('S019','Manage Petro - Ottawa East',45.4300,-75.6200,'Ottawa','ON','gasoline',98000,22000,'IoT',28000),
('S020','Manage Petro - Ottawa West',45.3500,-75.8000,'Ottawa','ON','diesel',95000,24000,'Manual',26000),
-- Winnipeg (2)
('S021','Manage Petro - Winnipeg North',49.9300,-97.1300,'Winnipeg','MB','diesel',115000,27000,'IoT',35000),
('S022','Manage Petro - Winnipeg South',49.8400,-97.1800,'Winnipeg','MB','gasoline',90000,20000,'Manual',25000),
-- Victoria (2)
('S023','Manage Petro - Victoria Core',48.4284,-123.3656,'Victoria','BC','diesel',80000,18000,'IoT',26000),
('S024','Manage Petro - Victoria Westshore',48.4410,-123.5020,'Victoria','BC','gasoline',76000,19000,'Manual',23000),
-- Regina + Saskatoon
('S025','Manage Petro - Regina',50.4452,-104.6189,'Regina','SK','diesel',82000,19000,'IoT',26000),
('S026','Manage Petro - Saskatoon',52.1332,-106.6700,'Saskatoon','SK','gasoline',85000,21000,'Manual',28000),
-- Kelowna + Kamloops
('S027','Manage Petro - Kelowna',49.8879,-119.4960,'Kelowna','BC','diesel',78000,20000,'IoT',24000),
('S028','Manage Petro - Kamloops',50.6745,-120.3273,'Kamloops','BC','gasoline',76000,19000,'Manual',23000),
-- London + Windsor
('S029','Manage Petro - London',42.9849,-81.2453,'London','ON','gasoline',88000,23000,'Manual',28000),
('S030','Manage Petro - Windsor',42.3149,-83.0364,'Windsor','ON','diesel',90000,24000,'IoT',30000),
-- St John’s + Charlottetown + Red Deer + Sudbury + Thunder Bay
('S031','Manage Petro - St Johns',47.5615,-52.7126,'St John''s','NL','diesel',74000,18000,'IoT',22000),
('S032','Manage Petro - Charlottetown',46.2382,-63.1311,'Charlottetown','PE','diesel',70000,17000,'IoT',20000),
('S033','Manage Petro - Red Deer',52.2681,-113.8112,'Red Deer','AB','gasoline',82000,24000,'Manual',26000),
('S034','Manage Petro - Sudbury',46.4917,-80.9930,'Sudbury','ON','diesel',78000,21000,'IoT',23000),
('S035','Manage Petro - Thunder Bay',48.3809,-89.2477,'Thunder Bay','ON','diesel',80000,21000,'IoT',26000),

-- United States: Seattle (3)
('S036','Manage Petro - Seattle North',47.7000,-122.3300,'Seattle','WA','diesel',120000,30000,'IoT',32000),
('S037','Manage Petro - Seattle South',47.5200,-122.3300,'Seattle','WA','diesel',105000,28000,'Manual',30000),
('S038','Manage Petro - Seattle East',47.6200,-122.2000,'Seattle','WA','gasoline',95000,26000,'IoT',26000),
-- Portland (2)
('S039','Manage Petro - Portland Central',45.5051,-122.6750,'Portland','OR','gasoline',95000,26000,'Manual',26000),
('S040','Manage Petro - Portland East',45.5200,-122.5200,'Portland','OR','diesel',90000,23000,'IoT',24000),
-- Bay Area (5)
('S041','Manage Petro - San Francisco North',37.8044,-122.2712,'San Francisco','CA','diesel',115000,45000,'IoT',30000),
('S042','Manage Petro - San Francisco South',37.6879,-122.4702,'San Francisco','CA','gasoline',110000,42000,'Manual',32000),
('S043','Manage Petro - Oakland',37.8044,-122.2711,'Oakland','CA','diesel',100000,38000,'IoT',30000),
('S044','Manage Petro - San Jose',37.3382,-121.8863,'San Jose','CA','gasoline',105000,35000,'Manual',30000),
('S045','Manage Petro - Peninsula',37.5610,-122.3255,'San Mateo','CA','diesel',98000,31000,'IoT',28000),
-- Los Angeles (4)
('S046','Manage Petro - LA Downtown',34.0522,-118.2437,'Los Angeles','CA','gasoline',130000,52000,'IoT',35000),
('S047','Manage Petro - LA Harbor',33.7405,-118.2780,'Los Angeles','CA','diesel',120000,48000,'Manual',33000),
('S048','Manage Petro - LA Valley',34.2000,-118.4500,'Los Angeles','CA','gasoline',100000,36000,'IoT',30000),
('S049','Manage Petro - LA East',34.0400,-118.1100,'Los Angeles','CA','diesel',98000,32000,'Manual',28000),
-- San Diego (2)
('S050','Manage Petro - San Diego North',33.2000,-117.2400,'San Diego','CA','diesel',100000,38000,'Manual',28000),
('S051','Manage Petro - San Diego South',32.6400,-117.0900,'San Diego','CA','gasoline',90000,30000,'IoT',26000),
-- Phoenix (3)
('S052','Manage Petro - Phoenix Central',33.4484,-112.0740,'Phoenix','AZ','gasoline',98000,25000,'IoT',26000),
('S053','Manage Petro - Phoenix East',33.4500,-111.9000,'Phoenix','AZ','diesel',95000,27000,'Manual',26000),
('S054','Manage Petro - Phoenix West',33.4600,-112.2500,'Phoenix','AZ','diesel',98000,28000,'IoT',28000),
-- Denver (2)
('S055','Manage Petro - Denver North',39.8000,-104.9900,'Denver','CO','diesel',105000,30000,'Manual',30000),
('S056','Manage Petro - Denver South',39.6200,-104.9900,'Denver','CO','gasoline',98000,26000,'IoT',28000),
-- Texas: Dallas/Houston/Austin (5)
('S057','Manage Petro - Dallas',32.7767,-96.7970,'Dallas','TX','diesel',140000,60000,'IoT',40000),
('S058','Manage Petro - Houston North',29.9000,-95.3600,'Houston','TX','gasoline',135000,50000,'Manual',38000),
('S059','Manage Petro - Houston South',29.5300,-95.2000,'Houston','TX','diesel',120000,42000,'IoT',34000),
('S060','Manage Petro - Austin Central',30.2672,-97.7431,'Austin','TX','diesel',100000,32000,'IoT',30000),
('S061','Manage Petro - Austin North',30.4500,-97.7000,'Austin','TX','gasoline',95000,30000,'Manual',26000),
-- Midwest/East hubs (Chicago, Detroit, Minneapolis, St Louis, Kansas City)
('S062','Manage Petro - Chicago West',41.8800,-87.7200,'Chicago','IL','gasoline',120000,42000,'Manual',33000),
('S063','Manage Petro - Chicago South',41.7400,-87.6200,'Chicago','IL','diesel',110000,35000,'IoT',30000),
('S064','Manage Petro - Detroit',42.3314,-83.0458,'Detroit','MI','diesel',110000,35000,'IoT',30000),
('S065','Manage Petro - Minneapolis',44.9778,-93.2650,'Minneapolis','MN','diesel',90000,28000,'Manual',25000),
('S066','Manage Petro - St Louis',38.6270,-90.1994,'St Louis','MO','gasoline',98000,30000,'IoT',27000),
('S067','Manage Petro - Kansas City',39.0997,-94.5786,'Kansas City','MO','diesel',95000,26000,'Manual',26000),
-- Southeast (Atlanta, Miami, Orlando, Charlotte, Raleigh, Nashville)
('S068','Manage Petro - Atlanta North',33.9000,-84.3800,'Atlanta','GA','diesel',115000,37000,'IoT',32000),
('S069','Manage Petro - Atlanta South',33.6400,-84.4200,'Atlanta','GA','gasoline',98000,30000,'Manual',26000),
('S070','Manage Petro - Miami',25.7617,-80.1918,'Miami','FL','diesel',110000,34000,'Manual',30000),
('S071','Manage Petro - Orlando',28.5383,-81.3792,'Orlando','FL','gasoline',96000,24000,'IoT',26000),
('S072','Manage Petro - Charlotte',35.2271,-80.8431,'Charlotte','NC','gasoline',97000,25000,'IoT',25000),
('S073','Manage Petro - Raleigh',35.7796,-78.6382,'Raleigh','NC','diesel',93000,24000,'Manual',24000),
('S074','Manage Petro - Nashville',36.1627,-86.7816,'Nashville','TN','gasoline',96000,26000,'IoT',25000),
-- Northeast (NYC, Boston, Philly, Baltimore, DC, Pittsburgh)
('S075','Manage Petro - New York Bronx',40.8448,-73.8648,'New York','NY','diesel',130000,50000,'Manual',36000),
('S076','Manage Petro - New York Queens',40.7282,-73.7949,'New York','NY','gasoline',120000,45000,'IoT',34000),
('S077','Manage Petro - Boston',42.3601,-71.0589,'Boston','MA','gasoline',100000,30000,'IoT',28000),
('S078','Manage Petro - Philadelphia',39.9526,-75.1652,'Philadelphia','PA','diesel',105000,31000,'Manual',30000),
('S079','Manage Petro - Baltimore',39.2904,-76.6122,'Baltimore','MD','gasoline',92000,23000,'IoT',24000),
('S080','Manage Petro - Washington DC',38.9072,-77.0369,'Washington','DC','diesel',98000,26000,'Manual',25000);

-- =====================
-- Trucks (30 trucks assigned to drivers)
-- =====================
INSERT INTO trucks (
  code,
  plate,
  capacity_liters,
  fuel_level_percent,
  fuel_type,
  status,
  current_driver_id,
  current_location,
  last_maintenance_date,
  next_maintenance_date
) VALUES
('T01','AB-1421',32000,FLOOR(RANDOM()*50)+50,'diesel','active',1,'Toronto, ON','2024-09-15','2025-03-15'),
('T02','BC-4422',30000,FLOOR(RANDOM()*50)+50,'gasoline','active',2,'Toronto, ON','2024-08-20','2025-02-20'),
('T03','QC-9832',31000,FLOOR(RANDOM()*50)+50,'diesel','maintenance',NULL,'Toronto Maintenance Bay','2024-10-28','2024-11-15'),
('T04','ON-1742',34000,FLOOR(RANDOM()*50)+50,'propane','active',3,'Toronto, ON','2024-07-10','2025-01-10'),
('T05','MB-2344',29000,FLOOR(RANDOM()*50)+50,'diesel','offline',NULL,'Toronto, ON','2024-06-05','2024-12-05'),
('T06','AB-8732',31000,FLOOR(RANDOM()*50)+50,'gasoline','active',4,'Toronto, ON','2024-10-01','2025-04-01'),
('T07','NS-1289',33000,FLOOR(RANDOM()*50)+50,'diesel','active',5,'Toronto, ON','2024-09-22','2025-03-22'),
('T08','ON-7742',30000,FLOOR(RANDOM()*50)+50,'propane','active',6,'Vancouver, BC','2024-08-15','2025-02-15'),
('T09','WA-8811',40000,FLOOR(RANDOM()*50)+50,'diesel','active',7,'Vancouver, BC','2024-10-10','2025-04-10'),
('T10','CA-2211',36000,FLOOR(RANDOM()*50)+50,'gasoline','active',8,'Vancouver, BC','2024-07-28','2025-01-28'),
('T11','TX-3344',42000,FLOOR(RANDOM()*50)+50,'diesel','active',10,'Calgary, AB','2024-09-05','2025-03-05'),
('T12','NY-5566',38000,FLOOR(RANDOM()*50)+50,'diesel','active',11,'Calgary, AB','2024-10-12','2025-04-12'),
('T13','FL-7788',30000,FLOOR(RANDOM()*50)+50,'gasoline','active',12,'Calgary, AB','2024-08-30','2025-02-28'),
('T14','IL-9900',37000,FLOOR(RANDOM()*50)+50,'diesel','active',13,'Montreal, QC','2024-09-18','2025-03-18'),
('T15','CO-1122',45000,FLOOR(RANDOM()*50)+50,'diesel','active',14,'Montreal, QC','2024-10-05','2025-04-05'),
('T16','AZ-3344',32000,FLOOR(RANDOM()*50)+50,'gasoline','active',15,'Montreal, QC','2024-07-22','2025-01-22'),
('T17','NV-5566',38000,FLOOR(RANDOM()*50)+50,'diesel','active',16,'Edmonton, AB','2024-09-10','2025-03-10'),
('T18','GA-7788',40000,FLOOR(RANDOM()*50)+50,'diesel','active',17,'Edmonton, AB','2024-10-20','2025-04-20'),
('T19','MO-9900',35000,FLOOR(RANDOM()*50)+50,'diesel','active',18,'Ottawa, ON','2024-08-25','2025-02-25'),
('T20','MN-1111',33000,FLOOR(RANDOM()*50)+50,'gasoline','active',19,'Ottawa, ON','2024-09-30','2025-03-30'),
('T21','OH-2222',38000,FLOOR(RANDOM()*50)+50,'diesel','active',20,'Toronto, ON','2024-10-15','2025-04-15'),
('T22','IN-3333',36000,FLOOR(RANDOM()*50)+50,'diesel','active',21,'Vancouver, BC','2024-07-18','2025-01-18'),
('T23','NC-4444',34000,FLOOR(RANDOM()*50)+50,'gasoline','active',22,'Calgary, AB','2024-09-08','2025-03-08'),
('T24','TN-5555',40000,FLOOR(RANDOM()*50)+50,'diesel','active',23,'Montreal, QC','2024-10-22','2025-04-22'),
('T25','PA-6666',37000,FLOOR(RANDOM()*50)+50,'diesel','active',24,'Edmonton, AB','2024-08-12','2025-02-12'),
('T26','MI-7777',35000,FLOOR(RANDOM()*50)+50,'gasoline','active',NULL,'Calgary, AB','2024-09-25','2025-03-25'),
('T27','OR-8888',39000,FLOOR(RANDOM()*50)+50,'diesel','active',NULL,'Vancouver, BC','2024-10-08','2025-04-08'),
('T28','UT-9999',36000,FLOOR(RANDOM()*50)+50,'diesel','active',NULL,'Toronto, ON','2024-07-30','2025-01-30'),
('T29','MA-1234',34000,FLOOR(RANDOM()*50)+50,'gasoline','active',NULL,'Montreal, QC','2024-09-15','2025-03-15'),
('T30','WA-2345',38000,FLOOR(RANDOM()*50)+50,'diesel','active',NULL,'Edmonton, AB','2024-10-18','2025-04-18');

-- =====================
-- Truck compartments (2 per truck)
-- =====================
INSERT INTO truck_compartments (
  truck_id,
  compartment_number,
  fuel_type,
  capacity_liters,
  current_level_liters
) VALUES
(1,1,'diesel',16000,14000),(1,2,'diesel',16000,15000),
(2,1,'gasoline',15000,13500),(2,2,'gasoline',15000,12500),
(3,1,'diesel',15500,13000),(3,2,'diesel',15500,14000),
(4,1,'propane',17000,16000),(4,2,'propane',17000,16500),
(5,1,'diesel',14500,12000),(5,2,'diesel',14500,13000),
(6,1,'gasoline',15500,14000),(6,2,'gasoline',15500,14500),
(7,1,'diesel',16500,15000),(7,2,'diesel',16500,15500),
(8,1,'propane',15000,14000),(8,2,'propane',15000,14500),
(9,1,'diesel',20000,18000),(9,2,'diesel',20000,18500),
(10,1,'gasoline',18000,16000),(10,2,'gasoline',18000,17000),
(11,1,'diesel',21000,18500),(11,2,'diesel',21000,19500),
(12,1,'diesel',19000,17000),(12,2,'diesel',19000,17500),
(13,1,'gasoline',15000,13500),(13,2,'gasoline',15000,14000),
(14,1,'diesel',18500,16500),(14,2,'diesel',18500,17000),
(15,1,'diesel',22500,20500),(15,2,'diesel',22500,21000),
(16,1,'gasoline',16000,15000),(16,2,'gasoline',16000,15500),
(17,1,'diesel',19000,17500),(17,2,'diesel',19000,18000),
(18,1,'diesel',20000,18500),(18,2,'diesel',20000,19000),
(19,1,'diesel',17500,16000),(19,2,'diesel',17500,16500),
(20,1,'gasoline',16500,15000),(20,2,'gasoline',16500,15500),
(21,1,'diesel',19000,17500),(21,2,'diesel',19000,18000),
(22,1,'diesel',18000,16500),(22,2,'diesel',18000,17000),
(23,1,'gasoline',17000,15500),(23,2,'gasoline',17000,16000),
(24,1,'diesel',20000,18500),(24,2,'diesel',20000,19000),
(25,1,'diesel',18500,17000),(25,2,'diesel',18500,17500),
(26,1,'gasoline',17500,16000),(26,2,'gasoline',17500,16500),
(27,1,'diesel',19500,18000),(27,2,'diesel',19500,18500),
(28,1,'diesel',18000,16500),(28,2,'diesel',18000,17000),
(29,1,'gasoline',17000,15500),(29,2,'gasoline',17000,16000),
(30,1,'diesel',19000,17500),(30,2,'diesel',19000,18000);

-- =====================
-- Deliveries (70 mixed, trucks → stations)
-- =====================
INSERT INTO deliveries (
  truck_id,
  station_id,
  volume_liters,
  delivery_date,
  status
) VALUES
(1,1,28000, NOW() + INTERVAL '1 DAY','planned'),
(2,2,25000, NOW() + INTERVAL '2 DAY','planned'),
(3,3,26000, NOW() + INTERVAL '1 DAY','enroute'),
(4,4,27000, NOW() + INTERVAL '3 DAY','planned'),
(5,5,31000, NOW() + INTERVAL '4 DAY','planned'),
(6,6,33000, NOW() + INTERVAL '0 DAY','delivered'),
(7,7,28000, NOW() + INTERVAL '2 DAY','planned'),
(8,8,30000, NOW() + INTERVAL '5 DAY','canceled'),
(9,9,26000, NOW() + INTERVAL '1 DAY','planned'),
(10,10,24000, NOW() + INTERVAL '2 DAY','planned'),
(11,11,23000, NOW() + INTERVAL '3 DAY','planned'),
(12,12,27000, NOW() + INTERVAL '1 DAY','planned'),
(13,13,25000, NOW() + INTERVAL '2 DAY','planned'),
(14,14,26000, NOW() + INTERVAL '2 DAY','planned'),
(15,15,28000, NOW() + INTERVAL '1 DAY','enroute'),
(16,16,22000, NOW() + INTERVAL '3 DAY','planned'),
(17,17,24000, NOW() + INTERVAL '4 DAY','planned'),
(18,18,27000, NOW() + INTERVAL '0 DAY','delivered'),
(19,19,26000, NOW() + INTERVAL '2 DAY','planned'),
(20,20,22000, NOW() + INTERVAL '1 DAY','planned'),
(21,21,25000, NOW() + INTERVAL '1 DAY','planned'),
(22,22,26000, NOW() + INTERVAL '3 DAY','enroute'),
(23,23,20000, NOW() + INTERVAL '0 DAY','delivered'),
(24,24,23000, NOW() + INTERVAL '1 DAY','planned'),
(25,25,24000, NOW() + INTERVAL '2 DAY','planned'),
(26,26,25000, NOW() + INTERVAL '2 DAY','planned'),
(27,27,20000, NOW() + INTERVAL '3 DAY','planned'),
(28,28,21000, NOW() + INTERVAL '1 DAY','planned'),
(29,29,23000, NOW() + INTERVAL '2 DAY','planned'),
(30,30,24000, NOW() + INTERVAL '3 DAY','planned'),
(1,31,22000, NOW() + INTERVAL '1 DAY','planned'),
(2,32,20000, NOW() + INTERVAL '2 DAY','planned'),
(3,33,26000, NOW() + INTERVAL '0 DAY','delivered'),
(4,34,28000, NOW() + INTERVAL '1 DAY','enroute'),
(5,35,27000, NOW() + INTERVAL '2 DAY','planned'),
(6,36,23000, NOW() + INTERVAL '3 DAY','planned'),
(7,37,24000, NOW() + INTERVAL '2 DAY','planned'),
(8,38,25000, NOW() + INTERVAL '1 DAY','planned'),
(9,39,26000, NOW() + INTERVAL '1 DAY','planned'),
(10,40,27000, NOW() + INTERVAL '2 DAY','planned'),
(11,41,22000, NOW() + INTERVAL '3 DAY','planned'),
(12,42,21000, NOW() + INTERVAL '2 DAY','planned'),
(13,43,23000, NOW() + INTERVAL '1 DAY','planned'),
(14,44,24000, NOW() + INTERVAL '2 DAY','planned'),
(15,45,25000, NOW() + INTERVAL '0 DAY','delivered'),
(16,46,26000, NOW() + INTERVAL '1 DAY','planned'),
(17,47,27000, NOW() + INTERVAL '2 DAY','planned'),
(18,48,28000, NOW() + INTERVAL '3 DAY','planned'),
(19,49,20000, NOW() + INTERVAL '1 DAY','planned'),
(20,50,21000, NOW() + INTERVAL '2 DAY','planned'),
(21,60,24000, NOW() + INTERVAL '2 DAY','planned'),
(22,59,26000, NOW() + INTERVAL '2 DAY','planned'),
(23,58,23000, NOW() + INTERVAL '3 DAY','planned'),
(24,57,22000, NOW() + INTERVAL '1 DAY','planned'),
(25,56,24000, NOW() + INTERVAL '2 DAY','planned'),
(26,55,25000, NOW() + INTERVAL '2 DAY','planned'),
(27,54,26000, NOW() + INTERVAL '3 DAY','planned'),
(28,53,23000, NOW() + INTERVAL '1 DAY','planned'),
(29,52,22000, NOW() + INTERVAL '1 DAY','planned'),
(30,51,24000, NOW() + INTERVAL '2 DAY','planned'),
(1,62,26000, NOW() + INTERVAL '2 DAY','planned'),
(2,63,25000, NOW() + INTERVAL '2 DAY','planned'),
(3,64,22000, NOW() + INTERVAL '1 DAY','planned'),
(4,65,23000, NOW() + INTERVAL '2 DAY','planned'),
(5,66,24000, NOW() + INTERVAL '2 DAY','planned'),
(6,67,25000, NOW() + INTERVAL '3 DAY','planned'),
(7,68,22000, NOW() + INTERVAL '1 DAY','planned'),
(8,69,23000, NOW() + INTERVAL '2 DAY','planned'),
(9,70,24000, NOW() + INTERVAL '2 DAY','planned'),
(10,71,25000, NOW() + INTERVAL '3 DAY','planned'),
(11,72,22000, NOW() + INTERVAL '1 DAY','planned'),
(12,73,23000, NOW() + INTERVAL '2 DAY','planned'),
(13,74,24000, NOW() + INTERVAL '2 DAY','planned'),
(14,75,26000, NOW() + INTERVAL '3 DAY','planned'),
(15,76,25000, NOW() + INTERVAL '1 DAY','planned'),
(16,77,24000, NOW() + INTERVAL '2 DAY','planned'),
(17,78,23000, NOW() + INTERVAL '2 DAY','planned'),
(18,79,22000, NOW() + INTERVAL '1 DAY','planned'),
(19,80,25000, NOW() + INTERVAL '2 DAY','planned');

-- =====================
-- Station fuel levels (3 days per station: 80 * 3 = 240 rows)
-- =====================
INSERT INTO station_fuel_levels (
  station_id,
  recorded_at,
  fuel_level_liters
) VALUES
-- 1..10
(1,NOW() - INTERVAL '3 DAY',30000),(1,NOW() - INTERVAL '2 DAY',27000),(1,NOW() - INTERVAL '1 DAY',25000),
(2,NOW() - INTERVAL '3 DAY',20000),(2,NOW() - INTERVAL '2 DAY',19000),(2,NOW() - INTERVAL '1 DAY',18000),
(3,NOW() - INTERVAL '3 DAY',36000),(3,NOW() - INTERVAL '2 DAY',33000),(3,NOW() - INTERVAL '1 DAY',30000),
(4,NOW() - INTERVAL '3 DAY',38000),(4,NOW() - INTERVAL '2 DAY',36000),(4,NOW() - INTERVAL '1 DAY',35000),
(5,NOW() - INTERVAL '3 DAY',28000),(5,NOW() - INTERVAL '2 DAY',26000),(5,NOW() - INTERVAL '1 DAY',25000),
(6,NOW() - INTERVAL '3 DAY',26000),(6,NOW() - INTERVAL '2 DAY',24000),(6,NOW() - INTERVAL '1 DAY',23000),
(7,NOW() - INTERVAL '3 DAY',24000),(7,NOW() - INTERVAL '2 DAY',23000),(7,NOW() - INTERVAL '1 DAY',22000),
(8,NOW() - INTERVAL '3 DAY',22000),(8,NOW() - INTERVAL '2 DAY',21000),(8,NOW() - INTERVAL '1 DAY',20000),
(9,NOW() - INTERVAL '3 DAY',26000),(9,NOW() - INTERVAL '2 DAY',24000),(9,NOW() - INTERVAL '1 DAY',23000),
(10,NOW() - INTERVAL '3 DAY',23000),(10,NOW() - INTERVAL '2 DAY',22000),(10,NOW() - INTERVAL '1 DAY',21000),
-- 11..20
(11,NOW() - INTERVAL '3 DAY',40000),(11,NOW() - INTERVAL '2 DAY',38000),(11,NOW() - INTERVAL '1 DAY',36000),
(12,NOW() - INTERVAL '3 DAY',26000),(12,NOW() - INTERVAL '2 DAY',24500),(12,NOW() - INTERVAL '1 DAY',23500),
(13,NOW() - INTERVAL '3 DAY',30000),(13,NOW() - INTERVAL '2 DAY',28000),(13,NOW() - INTERVAL '1 DAY',27000),
(14,NOW() - INTERVAL '3 DAY',21000),(14,NOW() - INTERVAL '2 DAY',20500),(14,NOW() - INTERVAL '1 DAY',20000),
(15,NOW() - INTERVAL '3 DAY',20000),(15,NOW() - INTERVAL '2 DAY',19500),(15,NOW() - INTERVAL '1 DAY',19000),
(16,NOW() - INTERVAL '3 DAY',23000),(16,NOW() - INTERVAL '2 DAY',22000),(16,NOW() - INTERVAL '1 DAY',21000),
(17,NOW() - INTERVAL '3 DAY',21000),(17,NOW() - INTERVAL '2 DAY',20500),(17,NOW() - INTERVAL '1 DAY',20000),
(18,NOW() - INTERVAL '3 DAY',20000),(18,NOW() - INTERVAL '2 DAY',19000),(18,NOW() - INTERVAL '1 DAY',18000),
(19,NOW() - INTERVAL '3 DAY',24000),(19,NOW() - INTERVAL '2 DAY',23500),(19,NOW() - INTERVAL '1 DAY',23000),
(20,NOW() - INTERVAL '3 DAY',22000),(20,NOW() - INTERVAL '2 DAY',21500),(20,NOW() - INTERVAL '1 DAY',21000),
-- 21..30
(21,NOW() - INTERVAL '3 DAY',32000),(21,NOW() - INTERVAL '2 DAY',31000),(21,NOW() - INTERVAL '1 DAY',30000),
(22,NOW() - INTERVAL '3 DAY',27000),(22,NOW() - INTERVAL '2 DAY',26500),(22,NOW() - INTERVAL '1 DAY',26000),
(23,NOW() - INTERVAL '3 DAY',47000),(23,NOW() - INTERVAL '2 DAY',46000),(23,NOW() - INTERVAL '1 DAY',45000),
(24,NOW() - INTERVAL '3 DAY',54000),(24,NOW() - INTERVAL '2 DAY',53000),(24,NOW() - INTERVAL '1 DAY',52000),
(25,NOW() - INTERVAL '3 DAY',39000),(25,NOW() - INTERVAL '2 DAY',38500),(25,NOW() - INTERVAL '1 DAY',38000),
(26,NOW() - INTERVAL '3 DAY',26000),(26,NOW() - INTERVAL '2 DAY',25500),(26,NOW() - INTERVAL '1 DAY',25000),
(27,NOW() - INTERVAL '3 DAY',31000),(27,NOW() - INTERVAL '2 DAY',30500),(27,NOW() - INTERVAL '1 DAY',30000),
(28,NOW() - INTERVAL '3 DAY',61000),(28,NOW() - INTERVAL '2 DAY',60500),(28,NOW() - INTERVAL '1 DAY',60000),
(29,NOW() - INTERVAL '3 DAY',51000),(29,NOW() - INTERVAL '2 DAY',50500),(29,NOW() - INTERVAL '1 DAY',50000),
(30,NOW() - INTERVAL '3 DAY',33000),(30,NOW() - INTERVAL '2 DAY',32500),(30,NOW() - INTERVAL '1 DAY',32000),
-- 31..40
(31,NOW() - INTERVAL '3 DAY',43000),(31,NOW() - INTERVAL '2 DAY',42500),(31,NOW() - INTERVAL '1 DAY',42000),
(32,NOW() - INTERVAL '3 DAY',36000),(32,NOW() - INTERVAL '2 DAY',35500),(32,NOW() - INTERVAL '1 DAY',35000),
(33,NOW() - INTERVAL '3 DAY',30000),(33,NOW() - INTERVAL '2 DAY',29000),(33,NOW() - INTERVAL '1 DAY',28000),
(34,NOW() - INTERVAL '3 DAY',31000),(34,NOW() - INTERVAL '2 DAY',30500),(34,NOW() - INTERVAL '1 DAY',30000),
(35,NOW() - INTERVAL '3 DAY',28000),(35,NOW() - INTERVAL '2 DAY',27000),(35,NOW() - INTERVAL '1 DAY',26000),
(36,NOW() - INTERVAL '3 DAY',34000),(36,NOW() - INTERVAL '2 DAY',33500),(36,NOW() - INTERVAL '1 DAY',33000),
(37,NOW() - INTERVAL '3 DAY',35000),(37,NOW() - INTERVAL '2 DAY',34500),(37,NOW() - INTERVAL '1 DAY',34000),
(38,NOW() - INTERVAL '3 DAY',25000),(38,NOW() - INTERVAL '2 DAY',24500),(38,NOW() - INTERVAL '1 DAY',24000),
(39,NOW() - INTERVAL '3 DAY',52000),(39,NOW() - INTERVAL '2 DAY',51000),(39,NOW() - INTERVAL '1 DAY',50000),
(40,NOW() - INTERVAL '3 DAY',31000),(40,NOW() - INTERVAL '2 DAY',30500),(40,NOW() - INTERVAL '1 DAY',30000),
-- 41..50
(41,NOW() - INTERVAL '3 DAY',32000),(41,NOW() - INTERVAL '2 DAY',31500),(41,NOW() - INTERVAL '1 DAY',31000),
(42,NOW() - INTERVAL '3 DAY',24000),(42,NOW() - INTERVAL '2 DAY',23500),(42,NOW() - INTERVAL '1 DAY',23000),
(43,NOW() - INTERVAL '3 DAY',27000),(43,NOW() - INTERVAL '2 DAY',26500),(43,NOW() - INTERVAL '1 DAY',26000),
(44,NOW() - INTERVAL '3 DAY',26000),(44,NOW() - INTERVAL '2 DAY',25500),(44,NOW() - INTERVAL '1 DAY',25000),
(45,NOW() - INTERVAL '3 DAY',25000),(45,NOW() - INTERVAL '2 DAY',24500),(45,NOW() - INTERVAL '1 DAY',24000),
(46,NOW() - INTERVAL '3 DAY',27000),(46,NOW() - INTERVAL '2 DAY',26500),(46,NOW() - INTERVAL '1 DAY',26000),
(47,NOW() - INTERVAL '3 DAY',25000),(47,NOW() - INTERVAL '2 DAY',24500),(47,NOW() - INTERVAL '1 DAY',24000),
(48,NOW() - INTERVAL '3 DAY',26000),(48,NOW() - INTERVAL '2 DAY',25500),(48,NOW() - INTERVAL '1 DAY',25000),
(49,NOW() - INTERVAL '3 DAY',23000),(49,NOW() - INTERVAL '2 DAY',22500),(49,NOW() - INTERVAL '1 DAY',22000),
(50,NOW() - INTERVAL '3 DAY',27000),(50,NOW() - INTERVAL '2 DAY',26500),(50,NOW() - INTERVAL '1 DAY',26000),
-- 51..60
(51,NOW() - INTERVAL '3 DAY',29000),(51,NOW() - INTERVAL '2 DAY',28000),(51,NOW() - INTERVAL '1 DAY',27000),
(52,NOW() - INTERVAL '3 DAY',25000),(52,NOW() - INTERVAL '2 DAY',24500),(52,NOW() - INTERVAL '1 DAY',24000),
(53,NOW() - INTERVAL '3 DAY',27000),(53,NOW() - INTERVAL '2 DAY',26500),(53,NOW() - INTERVAL '1 DAY',26000),
(54,NOW() - INTERVAL '3 DAY',28000),(54,NOW() - INTERVAL '2 DAY',27000),(54,NOW() - INTERVAL '1 DAY',26000),
(55,NOW() - INTERVAL '3 DAY',30000),(55,NOW() - INTERVAL '2 DAY',29000),(55,NOW() - INTERVAL '1 DAY',28000),
(56,NOW() - INTERVAL '3 DAY',26000),(56,NOW() - INTERVAL '2 DAY',25500),(56,NOW() - INTERVAL '1 DAY',25000),
(57,NOW() - INTERVAL '3 DAY',60000),(57,NOW() - INTERVAL '2 DAY',59000),(57,NOW() - INTERVAL '1 DAY',58000),
(58,NOW() - INTERVAL '3 DAY',52000),(58,NOW() - INTERVAL '2 DAY',51000),(58,NOW() - INTERVAL '1 DAY',50000),
(59,NOW() - INTERVAL '3 DAY',42000),(59,NOW() - INTERVAL '2 DAY',41000),(59,NOW() - INTERVAL '1 DAY',40000),
(60,NOW() - INTERVAL '3 DAY',33000),(60,NOW() - INTERVAL '2 DAY',32500),(60,NOW() - INTERVAL '1 DAY',32000),
-- 61..70
(61,NOW() - INTERVAL '3 DAY',30000),(61,NOW() - INTERVAL '2 DAY',29000),(61,NOW() - INTERVAL '1 DAY',28000),
(62,NOW() - INTERVAL '3 DAY',42000),(62,NOW() - INTERVAL '2 DAY',41000),(62,NOW() - INTERVAL '1 DAY',40000),
(63,NOW() - INTERVAL '3 DAY',36000),(63,NOW() - INTERVAL '2 DAY',35000),(63,NOW() - INTERVAL '1 DAY',34000),
(64,NOW() - INTERVAL '3 DAY',28000),(64,NOW() - INTERVAL '2 DAY',27000),(64,NOW() - INTERVAL '1 DAY',26000),
(65,NOW() - INTERVAL '3 DAY',26000),(65,NOW() - INTERVAL '2 DAY',25000),(65,NOW() - INTERVAL '1 DAY',24000),
(66,NOW() - INTERVAL '3 DAY',30000),(66,NOW() - INTERVAL '2 DAY',29000),(66,NOW() - INTERVAL '1 DAY',28000),
(67,NOW() - INTERVAL '3 DAY',27000),(67,NOW() - INTERVAL '2 DAY',26500),(67,NOW() - INTERVAL '1 DAY',26000),
(68,NOW() - INTERVAL '3 DAY',34000),(68,NOW() - INTERVAL '2 DAY',33500),(68,NOW() - INTERVAL '1 DAY',33000),
(69,NOW() - INTERVAL '3 DAY',30000),(69,NOW() - INTERVAL '2 DAY',29500),(69,NOW() - INTERVAL '1 DAY',29000),
(70,NOW() - INTERVAL '3 DAY',24000),(70,NOW() - INTERVAL '2 DAY',23500),(70,NOW() - INTERVAL '1 DAY',23000),
-- 71..80
(71,NOW() - INTERVAL '3 DAY',24000),(71,NOW() - INTERVAL '2 DAY',23500),(71,NOW() - INTERVAL '1 DAY',23000),
(72,NOW() - INTERVAL '3 DAY',25000),(72,NOW() - INTERVAL '2 DAY',24500),(72,NOW() - INTERVAL '1 DAY',24000),
(73,NOW() - INTERVAL '3 DAY',24000),(73,NOW() - INTERVAL '2 DAY',23500),(73,NOW() - INTERVAL '1 DAY',23000),
(74,NOW() - INTERVAL '3 DAY',26000),(74,NOW() - INTERVAL '2 DAY',25500),(74,NOW() - INTERVAL '1 DAY',25000),
(75,NOW() - INTERVAL '3 DAY',52000),(75,NOW() - INTERVAL '2 DAY',51000),(75,NOW() - INTERVAL '1 DAY',50000),
(76,NOW() - INTERVAL '3 DAY',45000),(76,NOW() - INTERVAL '2 DAY',44000),(76,NOW() - INTERVAL '1 DAY',43000),
(77,NOW() - INTERVAL '3 DAY',30000),(77,NOW() - INTERVAL '2 DAY',29500),(77,NOW() - INTERVAL '1 DAY',29000),
(78,NOW() - INTERVAL '3 DAY',31000),(78,NOW() - INTERVAL '2 DAY',30500),(78,NOW() - INTERVAL '1 DAY',30000),
(79,NOW() - INTERVAL '3 DAY',23000),(79,NOW() - INTERVAL '2 DAY',22500),(79,NOW() - INTERVAL '1 DAY',22000),
(80,NOW() - INTERVAL '3 DAY',26000),(80,NOW() - INTERVAL '2 DAY',25500),(80,NOW() - INTERVAL '1 DAY',25000);
