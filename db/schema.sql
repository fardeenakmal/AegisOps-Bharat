-- =============================================================================
-- AegisOps India: National Disaster Management & Emergency Coordination Platform
-- Database Schema: PostgreSQL 16+ with PostGIS 3.4+
-- Architected for NDMA / NDRF / SDMA / 112 India / 108 Emergency Services
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing types and tables if needed
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS prediction_alerts CASCADE;
DROP TABLE IF EXISTS dispatches CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS incident_report_links CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS zones CASCADE;

DROP TYPE IF EXISTS zone_level CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS incident_type CASCADE;
DROP TYPE IF EXISTS severity_label CASCADE;
DROP TYPE IF EXISTS incident_status CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS resource_status CASCADE;
DROP TYPE IF EXISTS dispatch_status CASCADE;
DROP TYPE IF EXISTS risk_type CASCADE;

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
CREATE TYPE zone_level AS ENUM ('city', 'state', 'national');
CREATE TYPE user_role AS ENUM (
    'CITIZEN',
    'CONTROL_ROOM_OPERATOR',
    'RESCUE_RESPONDER',
    'HOSPITAL_ADMIN',
    'STATE_COMMANDER',
    'NATIONAL_COMMANDER',
    'SYSTEM_ADMIN'
);
CREATE TYPE incident_type AS ENUM (
    'FLOOD',
    'FIRE',
    'EARTHQUAKE',
    'STRUCTURAL_COLLAPSE',
    'ROAD_ACCIDENT',
    'MEDICAL_EMERGENCY',
    'GAS_LEAK',
    'STORM_CYCLONE',
    'LANDSLIDE',
    'HAZMAT_SPILL',
    'OTHER'
);
CREATE TYPE severity_label AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE incident_status AS ENUM (
    'REPORTED',
    'VERIFIED',
    'TRIAGED',
    'DISPATCHED',
    'ON_SCENE',
    'CONTAINED',
    'RESOLVED',
    'CLOSED',
    'REJECTED_SPAM'
);
CREATE TYPE report_status AS ENUM (
    'PENDING_VERIFICATION',
    'VERIFIED',
    'MERGED_DUPLICATE',
    'SPAM_REJECTED',
    'ARCHIVED'
);
CREATE TYPE resource_type AS ENUM (
    'AMBULANCE',
    'FIRE_TRUCK',
    'RESCUE_BOAT',
    'SAR_TEAM',
    'NDRF_BATTALION',
    'SDRF_QRT',
    'HAZMAT_CREW',
    'POLICE_UNIT',
    'AIR_AMBULANCE_HELICOPTER'
);
CREATE TYPE resource_status AS ENUM (
    'AVAILABLE',
    'DISPATCHED',
    'ON_SCENE',
    'BUSY',
    'MAINTENANCE',
    'OFFLINE'
);
CREATE TYPE dispatch_status AS ENUM (
    'ASSIGNED',
    'ACKNOWLEDGED',
    'EN_ROUTE',
    'ON_SCENE',
    'RETURNING',
    'COMPLETED',
    'CANCELLED'
);
CREATE TYPE risk_type AS ENUM (
    'FLOOD_SPREAD',
    'WILDFIRE_PROPAGATION',
    'CYCLONE_LANDFALL',
    'LANDSLIDE_DEBRIS_FLOW',
    'AFTERSHOCK_RISK',
    'URBAN_INUNDATION',
    'HAZMAT_PLUME'
);

-- -----------------------------------------------------------------------------
-- 1. ZONES TABLE (Indian Administrative Hierarchy with PostGIS Polygons)
-- -----------------------------------------------------------------------------
CREATE TABLE zones (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level zone_level NOT NULL,
    parent_zone_id VARCHAR(64) REFERENCES zones(id) ON DELETE SET NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    center_location GEOMETRY(Point, 4326),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    population BIGINT DEFAULT 0,
    headquarters VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zones_level ON zones(level);
CREATE INDEX idx_zones_parent ON zones(parent_zone_id);
CREATE INDEX idx_zones_center_loc ON zones USING GIST(center_location);

-- -----------------------------------------------------------------------------
-- 2. USERS TABLE (RBAC & Jurisdiction Affiliation)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CITIZEN',
    zone_id VARCHAR(64) REFERENCES zones(id) ON DELETE SET NULL,
    phone_number VARCHAR(32),
    organization VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_zone ON users(zone_id);

-- -----------------------------------------------------------------------------
-- 3. INCIDENTS TABLE (Aggregate Root)
-- -----------------------------------------------------------------------------
CREATE TABLE incidents (
    id VARCHAR(64) PRIMARY KEY,
    tracking_code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    type incident_type NOT NULL,
    severity_score NUMERIC(5, 2) NOT NULL CHECK (severity_score >= 0.0 AND severity_score <= 100.0),
    severity_label severity_label NOT NULL,
    status incident_status NOT NULL DEFAULT 'REPORTED',
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(id) ON DELETE RESTRICT,
    canonical_location GEOMETRY(Point, 4326) NOT NULL,
    canonical_latitude NUMERIC(10, 7) NOT NULL,
    canonical_longitude NUMERIC(10, 7) NOT NULL,
    canonical_address TEXT NOT NULL,
    landmarks TEXT[],
    estimated_casualties INT DEFAULT 0,
    estimated_trapped INT DEFAULT 0,
    needs_summary JSONB DEFAULT '{}'::jsonb,
    model_confidence NUMERIC(4, 3) DEFAULT 1.0 CHECK (model_confidence >= 0.0 AND model_confidence <= 1.0),
    ai_classification_metadata JSONB DEFAULT '{}'::jsonb,
    report_count INT DEFAULT 1,
    sla_target_minutes INT DEFAULT 15,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    version INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity_label, severity_score DESC);
CREATE INDEX idx_incidents_zone ON incidents(zone_id);
CREATE INDEX idx_incidents_canonical_loc ON incidents USING GIST(canonical_location);

-- -----------------------------------------------------------------------------
-- 4. REPORTS TABLE (Citizen Submissions in Indian Languages / English)
-- -----------------------------------------------------------------------------
CREATE TABLE reports (
    id VARCHAR(64) PRIMARY KEY,
    tracking_id VARCHAR(32) NOT NULL UNIQUE,
    incident_id VARCHAR(64) REFERENCES incidents(id) ON DELETE SET NULL,
    reporter_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    reporter_name VARCHAR(128),
    reporter_contact VARCHAR(64),
    raw_text TEXT NOT NULL,
    normalized_text TEXT,
    detected_language VARCHAR(16) DEFAULT 'en', -- en, hi, mr, ta, bn, te, kn
    raw_location GEOMETRY(Point, 4326),
    raw_latitude NUMERIC(10, 7),
    raw_longitude NUMERIC(10, 7),
    reported_address TEXT,
    media_urls TEXT[] DEFAULT '{}',
    authenticity_score NUMERIC(4, 3) DEFAULT 1.0,
    is_spam BOOLEAN DEFAULT FALSE,
    status report_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    ai_features JSONB DEFAULT '{}'::jsonb,
    submission_channel VARCHAR(32) DEFAULT 'WEB', -- WEB, MOBILE_PWA, SMS_112, WHATSAPP, IVR
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_incident ON reports(incident_id);
CREATE INDEX idx_reports_tracking ON reports(tracking_id);
CREATE INDEX idx_reports_raw_loc ON reports USING GIST(raw_location);

-- -----------------------------------------------------------------------------
-- 5. INCIDENT_REPORT_LINKS TABLE (Clustering / Deduplication)
-- -----------------------------------------------------------------------------
CREATE TABLE incident_report_links (
    id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    report_id VARCHAR(64) NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    similarity_score NUMERIC(4, 3) NOT NULL,
    distance_meters NUMERIC(10, 2),
    merge_rationale TEXT,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(incident_id, report_id)
);

-- -----------------------------------------------------------------------------
-- 6. RESOURCES TABLE (NDRF Battalions, SDRF QRTs, 108 Ambulances, Fire Fleets)
-- -----------------------------------------------------------------------------
CREATE TABLE resources (
    id VARCHAR(64) PRIMARY KEY,
    call_sign VARCHAR(64) NOT NULL UNIQUE,
    type resource_type NOT NULL,
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(id) ON DELETE RESTRICT,
    status resource_status NOT NULL DEFAULT 'AVAILABLE',
    current_location GEOMETRY(Point, 4326),
    current_latitude NUMERIC(10, 7),
    current_longitude NUMERIC(10, 7),
    base_station_name VARCHAR(255) NOT NULL,
    crew_count INT DEFAULT 4,
    equipment_specs JSONB DEFAULT '{}'::jsonb,
    contact_radio VARCHAR(64),
    last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_zone ON resources(zone_id);
CREATE INDEX idx_resources_current_loc ON resources USING GIST(current_location);

-- -----------------------------------------------------------------------------
-- 7. DISPATCHES TABLE (Task Routing & Tactical Checklists)
-- -----------------------------------------------------------------------------
CREATE TABLE dispatches (
    id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE RESTRICT,
    resource_id VARCHAR(64) NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
    assigned_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    status dispatch_status NOT NULL DEFAULT 'ASSIGNED',
    priority INT DEFAULT 1,
    task_brief TEXT NOT NULL,
    equipment_checklist JSONB DEFAULT '[]'::jsonb,
    estimated_arrival_minutes INT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    en_route_at TIMESTAMP WITH TIME ZONE,
    on_scene_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    responder_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dispatches_incident ON dispatches(incident_id);
CREATE INDEX idx_dispatches_resource ON dispatches(resource_id);

-- -----------------------------------------------------------------------------
-- 8. HOSPITALS TABLE (AIIMS, Safdarjung, KEM, Victoria, RGGGH, SSKM)
-- -----------------------------------------------------------------------------
CREATE TABLE hospitals (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(id) ON DELETE RESTRICT,
    location GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    address TEXT NOT NULL,
    contact_phone VARCHAR(64) NOT NULL,
    total_beds INT NOT NULL DEFAULT 500,
    available_beds INT NOT NULL DEFAULT 80,
    total_icu_beds INT NOT NULL DEFAULT 80,
    available_icu_beds INT NOT NULL DEFAULT 15,
    trauma_center_level INT DEFAULT 1,
    blood_bank_status JSONB DEFAULT '{"O_POS": "OPTIMAL", "O_NEG": "LOW", "A_POS": "OPTIMAL", "B_POS": "OPTIMAL"}'::jsonb,
    mass_casualty_mode BOOLEAN DEFAULT FALSE,
    last_reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hospitals_zone ON hospitals(zone_id);
CREATE INDEX idx_hospitals_loc ON hospitals USING GIST(location);

-- -----------------------------------------------------------------------------
-- 9. PREDICTION_ALERTS TABLE (IMD Monsoon, Cyclone, River Surges)
-- -----------------------------------------------------------------------------
CREATE TABLE prediction_alerts (
    id VARCHAR(64) PRIMARY KEY,
    zone_id VARCHAR(64) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    risk_type risk_type NOT NULL,
    risk_score NUMERIC(5, 2) NOT NULL CHECK (risk_score >= 0.0 AND risk_score <= 100.0),
    severity_label severity_label NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    affected_polygon GEOMETRY(Polygon, 4326),
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    recommended_prepositioning JSONB DEFAULT '[]'::jsonb,
    confidence NUMERIC(4, 3) DEFAULT 0.90,
    predicted_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    predicted_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prediction_zone ON prediction_alerts(zone_id);
CREATE INDEX idx_prediction_risk ON prediction_alerts(risk_type, risk_score DESC);

-- -----------------------------------------------------------------------------
-- 10. AUDIT_LOGS TABLE (AI Model Governance & Human Overrides)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    actor_type VARCHAR(32) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(128),
    previous_value JSONB,
    new_value JSONB,
    override_reason TEXT,
    model_name VARCHAR(64),
    model_version VARCHAR(32),
    confidence NUMERIC(4, 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- AUTHENTIC SEED DATA (India National, States, Metros, NDRF, AIIMS, Live Incidents)
-- -----------------------------------------------------------------------------

-- 1. Indian Administrative Zones
INSERT INTO zones (id, name, level, parent_zone_id, code, center_location, latitude, longitude, population, headquarters)
VALUES 
    ('zone-ndma-in', 'National Disaster Management Authority (NDMA)', 'national', NULL, 'NDMA-HQ', ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326), 28.6139, 77.2090, 1428627663, 'NDMA Bhawan, Safdarjung Enclave, New Delhi'),
    ('zone-mh-mum', 'Brihanmumbai Municipal Corp (BMC) Disaster Cell', 'city', 'zone-ndma-in', 'BMC-MUM-01', ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326), 19.0760, 72.8777, 21000000, 'BMC HQ, Fort, Mumbai, Maharashtra'),
    ('zone-dl-ncr', 'Delhi Disaster Management Authority (DDMA)', 'city', 'zone-ndma-in', 'DDMA-DEL-02', ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326), 28.6139, 77.2090, 33000000, '5 Shamnath Marg, Civil Lines, Delhi'),
    ('zone-ka-blr', 'Bruhat Bengaluru Mahanagara Palike (BBMP) War Room', 'city', 'zone-ndma-in', 'BBMP-BLR-03', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 12.9716, 77.5946, 13600000, 'Hudson Circle, Bengaluru, Karnataka'),
    ('zone-tn-chn', 'Greater Chennai Corporation (GCC) Disaster Cell', 'city', 'zone-ndma-in', 'GCC-CHN-04', ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326), 13.0827, 80.2707, 11500000, 'Ripon Building, Chennai, Tamil Nadu'),
    ('zone-od-bbs', 'Odisha State Disaster Management Authority (OSDMA)', 'state', 'zone-ndma-in', 'OSDMA-OD-05', ST_SetSRID(ST_MakePoint(85.8245, 20.2961), 4326), 20.2961, 85.8245, 47000000, 'Rajiv Bhawan, Bhubaneswar, Odisha'),
    ('zone-wb-kol', 'Kolkata Municipal Corporation (KMC) Emergency Cell', 'city', 'zone-ndma-in', 'KMC-KOL-06', ST_SetSRID(ST_MakePoint(88.3639, 22.5726), 4326), 22.5726, 88.3639, 15000000, '5 S.N. Banerjee Road, Kolkata, West Bengal');

-- 2. Users (Indian Command & Responders)
INSERT INTO users (id, username, email, password_hash, full_name, role, zone_id, phone_number, organization)
VALUES
    ('usr-op-mum', 'operator_mumbai', 'ops.mumbai@ndma.gov.in', '$2a$10$e8wzY8l18N1gYv1YhM8lOeZ8v8zM0c8rP4wT8eR6q7y9u0i1o2p3a', 'Capt. Rajesh Kadam', 'CONTROL_ROOM_OPERATOR', 'zone-mh-mum', '+91-98201-91100', 'BMC Disaster Management Cell'),
    ('usr-cmd-nat', 'ndma_director', 'command@ndma.gov.in', '$2a$10$e8wzY8l18N1gYv1YhM8lOeZ8v8zM0c8rP4wT8eR6q7y9u0i1o2p3a', 'Brig. Vikramjit Singh (Retd.)', 'NATIONAL_COMMANDER', 'zone-ndma-in', '+91-11-2670-1700', 'National Disaster Management Authority'),
    ('usr-res-ndrf', 'ndrf_commander_5bn', '5bn.ndrf@gov.in', '$2a$10$e8wzY8l18N1gYv1YhM8lOeZ8v8zM0c8rP4wT8eR6q7y9u0i1o2p3a', 'Commandant Anup Kumar', 'RESCUE_RESPONDER', 'zone-mh-mum', '+91-94230-11200', '5th Battalion NDRF (Pune/Mumbai)'),
    ('usr-hosp-aiims', 'aiims_trauma_admin', 'trauma.lead@aiims.edu', '$2a$10$e8wzY8l18N1gYv1YhM8lOeZ8v8zM0c8rP4wT8eR6q7y9u0i1o2p3a', 'Dr. S. K. Anurag', 'HOSPITAL_ADMIN', 'zone-dl-ncr', '+91-11-2659-4400', 'Jai Prakash Narayan Apex Trauma Center, AIIMS');

-- 3. Hospitals (Premier Indian Trauma Centers)
INSERT INTO hospitals (id, name, zone_id, location, latitude, longitude, address, contact_phone, total_beds, available_beds, total_icu_beds, available_icu_beds, trauma_center_level, mass_casualty_mode)
VALUES
    ('hosp-aiims-del', 'JPN Apex Trauma Center, AIIMS New Delhi', 'zone-dl-ncr', ST_SetSRID(ST_MakePoint(77.2060, 28.5672), 4326), 28.5672, 77.2060, 'Ring Road, Safdarjung Enclave, New Delhi - 110029', '+91-11-2616-9000', 650, 112, 120, 24, 1, false),
    ('hosp-kem-mum', 'KEM Hospital & Seth GS Medical College', 'zone-mh-mum', ST_SetSRID(ST_MakePoint(72.8428, 19.0028), 4326), 19.0028, 72.8428, 'Acharya Donde Marg, Parel, Mumbai - 400012', '+91-22-2410-7000', 1800, 245, 180, 32, 1, false),
    ('hosp-vic-blr', 'Victoria Hospital Trauma & Emergency Center', 'zone-ka-blr', ST_SetSRID(ST_MakePoint(77.5753, 12.9634), 4326), 12.9634, 77.5753, 'Fort Road, Near City Market, Bengaluru - 560002', '+91-80-2670-1150', 950, 140, 90, 18, 1, false),
    ('hosp-rgggh-chn', 'Rajiv Gandhi Government General Hospital (RGGGH)', 'zone-tn-chn', ST_SetSRID(ST_MakePoint(80.2785, 13.0818), 4326), 13.0818, 80.2785, 'EVR Periyar Salai, Park Town, Chennai - 600003', '+91-44-2530-5000', 2200, 310, 210, 45, 1, false);

-- 4. Resources (NDRF Battalions, SDRF QRTs, 108 ALS Ambulances, Fire Fleets)
INSERT INTO resources (id, call_sign, type, zone_id, status, current_location, current_latitude, current_longitude, base_station_name, crew_count, equipment_specs, contact_radio)
VALUES
    ('res-ndrf-5bn', '5TH BN NDRF (QRT-ALPHA)', 'NDRF_BATTALION', 'zone-mh-mum', 'AVAILABLE', ST_SetSRID(ST_MakePoint(72.8680, 19.0720), 4326), 19.0720, 72.8680, 'NDRF Regional Response Centre, Andheri East', 18, '{"inflatable_boats": 4, "deep_diving_gear": true, "thermal_drones": 2, "hydraulic_cutters": true}'::jsonb, 'NDRF-CH-01 (VHF 156.8MHz)'),
    ('res-108-als-1', 'GVK-108 ALS AMBULANCE (MUM-09)', 'AMBULANCE', 'zone-mh-mum', 'AVAILABLE', ST_SetSRID(ST_MakePoint(72.8550, 19.0600), 4326), 19.0600, 72.8550, 'Bandra Kurla Complex Emergency Depot', 3, '{"ventilator": true, "multipara_monitor": true, "defibrillator": true, "stretchers": 2}'::jsonb, '108-DISPATCH-CH-4'),
    ('res-mfb-tower-1', 'MUMBAI FIRE BRIGADE (TURNTABLE-70M)', 'FIRE_TRUCK', 'zone-mh-mum', 'AVAILABLE', ST_SetSRID(ST_MakePoint(72.8350, 19.0150), 4326), 19.0150, 72.8350, 'Byculla Fire Command HQ', 6, '{"bronto_skylift_meters": 70, "high_pressure_foam": true, "water_tanker_litres": 8000}'::jsonb, 'MFB-CONTROL-101'),
    ('res-boat-sdrf', 'SDRF FLOOD RESCUE CRAFT (MAHA-04)', 'RESCUE_BOAT', 'zone-mh-mum', 'AVAILABLE', ST_SetSRID(ST_MakePoint(72.8850, 19.0650), 4326), 19.0650, 72.8850, 'Mithi River Basin Outpost, Kurla', 4, '{"gemini_inflatable_boats": 2, "life_jackets": 40, "underwater_cameras": true}'::jsonb, 'SDRF-TAC-03'),
    ('res-ndrf-8bn', '8TH BN NDRF (DELHI NCR COMMAND)', 'NDRF_BATTALION', 'zone-dl-ncr', 'AVAILABLE', ST_SetSRID(ST_MakePoint(77.3400, 28.6500), 4326), 28.6500, 77.3400, 'NDRF Base, Ghaziabad / Delhi Border', 22, '{"collapse_rescue_radar": true, "sniffer_canines": 4, "pneumatic_lifting_bags": true}'::jsonb, 'NDRF-NCR-PRIMARY');

-- 5. Active Incidents in Indian Metros
INSERT INTO incidents (id, tracking_code, title, type, severity_score, severity_label, status, zone_id, canonical_location, canonical_latitude, canonical_longitude, canonical_address, landmarks, estimated_casualties, estimated_trapped, needs_summary, model_confidence, report_count)
VALUES
    ('inc-in-001', 'INC-IND-2026-101', 'Mithi River Flash Inundation & Submerged Transit Hub', 'FLOOD', 94.00, 'CRITICAL', 'REPORTED', 'zone-mh-mum', ST_SetSRID(ST_MakePoint(72.8790, 19.0680), 4326), 19.0680, 72.8790, 'Kurla Railway Subway & CST Road Junction, Mumbai', ARRAY['Kurla West Station', 'Mithi River Bridge Pillar 12'], 6, 14, '{"boats": 3, "ambulances": 4, "ndrf_battalions": 1, "specialNotes": ["Severe river backflow into low-lying Kurla transit colonies"]}'::jsonb, 0.98, 5),
    ('inc-in-002', 'INC-IND-2026-102', 'Commercial High-Rise Fire & Smoke Inhalation at Connaught Place', 'FIRE', 89.50, 'CRITICAL', 'TRIAGED', 'zone-dl-ncr', ST_SetSRID(ST_MakePoint(77.2195, 28.6315), 4326), 28.6315, 77.2195, 'Statesman House, Barakhamba Road, Connaught Place, New Delhi', ARRAY['Barakhamba Metro Gate 3', 'Outer Circle CP'], 4, 9, '{"fire_trucks": 4, "ambulances": 3, "aerial_ladders": 1}'::jsonb, 0.95, 3),
    ('inc-in-003', 'INC-IND-2026-103', 'Silk Board - Outer Ring Road Waterlogging & Stranded Bus Extrication', 'FLOOD', 78.50, 'HIGH', 'REPORTED', 'zone-ka-blr', ST_SetSRID(ST_MakePoint(77.6229, 12.9176), 4326), 12.9176, 77.6229, 'Central Silk Board Flyover Underpass, Bengaluru', ARRAY['Silk Board Junction', 'Madiwala Lake Overflow'], 0, 8, '{"boats": 1, "ambulances": 2, "sar_teams": 1}'::jsonb, 0.92, 2);

-- 6. Prediction Alerts (IMD Monsoon Cloudburst & Cyclone Inundation)
INSERT INTO prediction_alerts (id, zone_id, risk_type, risk_score, severity_label, title, summary, predicted_window_start, predicted_window_end, recommended_actions, recommended_prepositioning)
VALUES
    ('pred-ind-01', 'zone-mh-mum', 'URBAN_INUNDATION', 92.0, 'CRITICAL', 'IMD Red Alert: 120mm/hr Cloudburst & Mithi Basin Overflow (Next 3h)', 'Doppler Radar telemetry at Colaba & Santacruz indicates severe squall line convergence over Mumbai suburban belt. High tide of 4.65m at 19:40 will prevent sea discharge.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '4 hours', '["Evacuate Kranti Nagar and Kurla Mithi riverbanks", "Deploy NDRF 5th BN inflatable rescue crafts to Kurla Depot", "Issue mobile cell broadcast to Ward L and Kurla West"]'::jsonb, '[{"resource_type": "NDRF_BATTALION", "target_station": "Kurla Basin Outpost", "quantity": 1}, {"resource_type": "AMBULANCE", "target_station": "KEM Hospital Parel", "quantity": 4}]'::jsonb),
    ('pred-ind-02', 'zone-od-bbs', 'CYCLONE_LANDFALL', 96.0, 'CRITICAL', 'Bay of Bengal Super-Cyclonic Storm Inundation Surge Warning', 'IMD Cyclone Warning Centre indicates Category-4 cyclone landfall within 45km of Puri/PNS coast. Storm surge expected +3.5m above astronomical tide.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '12 hours', '["Evacuate 300,000 residents from coastal zone 0-5km to Cyclone Shelters", "Pre-position 10 NDRF Battalions and Indian Coast Guard crafts", "Activate emergency food/water supply drop networks"]'::jsonb, '[{"resource_type": "NDRF_BATTALION", "target_station": "Puri Cyclone Command Base", "quantity": 3}]'::jsonb);
