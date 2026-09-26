-- =============================================================================
-- AegisOps Platform: Initial Schema Migration
-- Database: MySQL 8+
-- Target Entities: RiskZone, User, EmergencyRequest, ResponseTeam, Assignment, Alert, AuditLog
-- =============================================================================

CREATE TABLE IF NOT EXISTS risk_zones (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(32) NOT NULL,
    parent_zone_id VARCHAR(64),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    population BIGINT DEFAULT 0,
    risk_score DECIMAL(5, 2) DEFAULT 0.0,
    current_risk_level VARCHAR(32) DEFAULT 'LOW',
    primary_hazard VARCHAR(64) DEFAULT 'FLOOD',
    boundary_geojson LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_risk_zones_level (level),
    INDEX idx_risk_zones_parent (parent_zone_id),
    INDEX idx_risk_zones_coords (latitude, longitude),
    CONSTRAINT fk_risk_zones_parent FOREIGN KEY (parent_zone_id) REFERENCES risk_zones (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'PUBLIC',
    zone_id VARCHAR(64),
    phone_number VARCHAR(32),
    organization VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_zone (zone_id),
    CONSTRAINT fk_users_zone FOREIGN KEY (zone_id) REFERENCES risk_zones (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS emergency_requests (
    id VARCHAR(64) PRIMARY KEY,
    tracking_code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    incident_type VARCHAR(64) NOT NULL,
    priority_score DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
    priority_level VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    category VARCHAR(32) NOT NULL DEFAULT 'PROPERTY_DAMAGE',
    status VARCHAR(32) NOT NULL DEFAULT 'REPORTED',
    zone_id VARCHAR(64) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    address TEXT NOT NULL,
    reporter_name VARCHAR(128),
    reporter_contact VARCHAR(64),
    estimated_casualties INT DEFAULT 0,
    estimated_trapped INT DEFAULT 0,
    is_life_threatening BOOLEAN DEFAULT FALSE,
    detected_language VARCHAR(16) DEFAULT 'en',
    sla_target_minutes INT DEFAULT 20,
    sla_deadline TIMESTAMP NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    manual_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    overridden_by VARCHAR(128),
    report_count INT DEFAULT 1,
    needs_summary JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_emergency_requests_status (status),
    INDEX idx_emergency_requests_priority (priority_level, priority_score),
    INDEX idx_emergency_requests_zone (zone_id),
    INDEX idx_emergency_requests_coords (latitude, longitude),
    CONSTRAINT fk_emergency_requests_zone FOREIGN KEY (zone_id) REFERENCES risk_zones (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS response_teams (
    id VARCHAR(64) PRIMARY KEY,
    call_sign VARCHAR(128) NOT NULL UNIQUE,
    team_type VARCHAR(64) NOT NULL,
    zone_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    base_station_name VARCHAR(255) NOT NULL,
    crew_capacity INT DEFAULT 4,
    equipment_specs JSON,
    contact_radio VARCHAR(64),
    last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_response_teams_status (status),
    INDEX idx_response_teams_type (team_type),
    INDEX idx_response_teams_zone (zone_id),
    CONSTRAINT fk_response_teams_zone FOREIGN KEY (zone_id) REFERENCES risk_zones (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL,
    team_id VARCHAR(64) NOT NULL,
    assigned_by_user_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'ASSIGNED',
    task_brief TEXT NOT NULL,
    estimated_arrival_minutes INT,
    route_distance_meters DECIMAL(10, 2),
    route_geometry_geojson LONGTEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    en_route_at TIMESTAMP NULL,
    on_scene_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    responder_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assignments_request (request_id),
    INDEX idx_assignments_team (team_id),
    INDEX idx_assignments_status (status),
    CONSTRAINT fk_assignments_request FOREIGN KEY (request_id) REFERENCES emergency_requests (id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignments_team FOREIGN KEY (team_id) REFERENCES response_teams (id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignments_user FOREIGN KEY (assigned_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    zone_id VARCHAR(64) NOT NULL,
    risk_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    risk_score DECIMAL(5, 2) NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    source_feed VARCHAR(64) NOT NULL,
    is_live BOOLEAN NOT NULL DEFAULT TRUE,
    data_disclaimer VARCHAR(255),
    recommended_actions JSON,
    recommended_prepositioning JSON,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alerts_zone (zone_id),
    INDEX idx_alerts_active_severity (is_active, severity),
    CONSTRAINT fk_alerts_zone FOREIGN KEY (zone_id) REFERENCES risk_zones (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(128),
    previous_value JSON,
    new_value JSON,
    override_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

