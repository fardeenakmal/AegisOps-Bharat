# PostGIS Spatial Database Design & Data Model

## 1. Overview
AegisOps uses **PostgreSQL 16+ with PostGIS 3.4+** as its primary transactional and spatial datastore. PostGIS provides first-class support for geographic coordinates (`GEOMETRY(Point, 4326)` and `GEOMETRY(MultiPolygon, 4326)`), enabling sub-millisecond radius searches, spatial deduplication, and administrative boundary containment queries.

---

## 2. Entity Relationship Diagram (Conceptual)

```
       ┌───────────────┐
       │     ZONES     │◄─────────────────┐
       └───────┬───────┘                  │
               │ 1:N                      │
       ┌───────▼───────┐                  │
       │   INCIDENTS   │◄──┐              │
       └───────┬───────┘   │              │
               │ 1:N       │ 1:N          │
       ┌───────▼───────┐   │              │
       │    REPORTS    ├───┘              │
       └───────────────┘                  │
               │                          │
       ┌───────▼───────┐                  │
       │   RESOURCES   │──────────────────┤
       └───────┬───────┘                  │
               │ 1:N                      │
       ┌───────▼───────┐                  │
       │  DISPATCHES   │                  │
       └───────────────┘                  │
                                          │
       ┌───────────────┐                  │
       │   HOSPITALS   │──────────────────┘
       └───────────────┘
```

---

## 3. Data Dictionary

### 3.1 `zones`
Stores hierarchical administrative boundaries (`city`, `state`, `national`).
- `id` (VARCHAR(64), PK): Unique zone identifier (e.g. `zone-city-1`).
- `name` (VARCHAR(255)): Human-readable zone name.
- `level` (`zone_level` ENUM): `'city'`, `'state'`, or `'national'`.
- `parent_zone_id` (VARCHAR(64), FK → `zones.id`): Parent jurisdiction reference.
- `code` (VARCHAR(32), UNIQUE): Administrative code (e.g. `CITY-METRO-01`).
- `center_location` (GEOMETRY(Point, 4326)): Spatial centroid of the zone.
- `boundary_geometry` (GEOMETRY(MultiPolygon, 4326)): Boundary polygon for geo-fencing.
- `population` (INT): Census population count.

### 3.2 `incidents` (Aggregate Root)
Represents a real-world disaster event formed by single or clustered citizen reports.
- `id` (VARCHAR(64), PK): Unique incident ID.
- `tracking_code` (VARCHAR(32), UNIQUE): Human-readable public code (e.g. `INC-2026-9041`).
- `title` (VARCHAR(255)): Incident title.
- `type` (`incident_type` ENUM): `'FLOOD'`, `'FIRE'`, `'STRUCTURAL_COLLAPSE'`, `'GAS_LEAK'`, `'ROAD_ACCIDENT'`, `'MEDICAL_EMERGENCY'`, etc.
- `severity_score` (NUMERIC(5,2), CHECK 0-100): Multi-factor fused urgency score.
- `severity_label` (`severity_label` ENUM): `'LOW'`, `'MEDIUM'`, `'HIGH'`, `'CRITICAL'`.
- `status` (`incident_status` ENUM): `'REPORTED'`, `'TRIAGED'`, `'DISPATCHED'`, `'ON_SCENE'`, `'CONTAINED'`, `'RESOLVED'`, `'CLOSED'`.
- `zone_id` (VARCHAR(64), FK → `zones.id`): Associated zone.
- `canonical_location` (GEOMETRY(Point, 4326)): Spatial coordinate point.
- `canonical_latitude` / `canonical_longitude` (NUMERIC(10,7)).
- `estimated_casualties` (INT): Casualty count extracted from NLP/field updates.
- `estimated_trapped` (INT): Trapped individual count.
- `needs_summary` (JSONB): Structured needs (e.g. `{"boats": 2, "ambulances": 3}`).
- `model_confidence` (NUMERIC(4,3)): AI classification confidence.
- `report_count` (INT): Number of linked corroborating citizen reports.
- `sla_target_minutes` (INT): Dynamic countdown SLA threshold (e.g. 10m for Critical).

### 3.3 `reports`
Individual citizen submissions.
- `id` (VARCHAR(64), PK): Report ID.
- `tracking_id` (VARCHAR(32), UNIQUE): Citizen tracking ID (e.g. `TRK-2026-1044`).
- `incident_id` (VARCHAR(64), FK → `incidents.id`): Clustered incident root.
- `raw_text` (TEXT): Original citizen description.
- `detected_language` (VARCHAR(16)): Detected language code.
- `raw_location` (GEOMETRY(Point, 4326)): Submitted GPS location.
- `media_urls` (TEXT[]): Uploaded photo/video URLs.
- `authenticity_score` (NUMERIC(4,3)): Spam/stock image detection score.
- `is_spam` (BOOLEAN): Spam flag.
- `status` (`report_status` ENUM): `'PENDING_VERIFICATION'`, `'VERIFIED'`, `'MERGED_DUPLICATE'`, `'SPAM_REJECTED'`.

### 3.4 `resources`
Emergency fleet vehicles and squads.
- `id` (VARCHAR(64), PK): Resource ID.
- `call_sign` (VARCHAR(64), UNIQUE): Vehicle radio callsign (e.g. `MEDIC-ONE (ALS)`).
- `type` (`resource_type` ENUM): `'AMBULANCE'`, `'FIRE_TRUCK'`, `'RESCUE_BOAT'`, `'SAR_TEAM'`, `'HAZMAT_CREW'`.
- `status` (`resource_status` ENUM): `'AVAILABLE'`, `'DISPATCHED'`, `'ON_SCENE'`, `'BUSY'`, `'MAINTENANCE'`.
- `current_location` (GEOMETRY(Point, 4326)): Live GPS location.
- `base_station_name` (VARCHAR(255)): Station/depot name.
- `equipment_specs` (JSONB): Tactical capabilities.

### 3.5 `dispatches`
Assignments of resources to incidents.
- `id` (VARCHAR(64), PK): Dispatch ID.
- `incident_id` (VARCHAR(64), FK → `incidents.id`).
- `resource_id` (VARCHAR(64), FK → `resources.id`).
- `status` (`dispatch_status` ENUM): `'ASSIGNED'`, `'EN_ROUTE'`, `'ON_SCENE'`, `'COMPLETED'`.
- `task_brief` (TEXT): Actionable briefing generated for field responders.
- `equipment_checklist` (JSONB): Safety checklist items.
- `estimated_arrival_minutes` (INT): Calculated travel ETA.

### 3.6 `hospitals`
Emergency medical centers.
- `id` (VARCHAR(64), PK).
- `name` (VARCHAR(255)).
- `location` (GEOMETRY(Point, 4326)).
- `total_beds` / `available_beds` (INT).
- `total_icu_beds` / `available_icu_beds` (INT).
- `trauma_center_level` (INT): Level 1, 2, or 3.
- `mass_casualty_mode` (BOOLEAN): Surge trigger flag.
- `bloodBankStatus` (JSONB): Blood reserve inventory.

### 3.7 `prediction_alerts`
Spatiotemporal predictive hazard models.
- `id` (VARCHAR(64), PK).
- `zone_id` (VARCHAR(64), FK → `zones.id`).
- `risk_type` (`risk_type` ENUM): `'FLOOD_SPREAD'`, `'WILDFIRE_PROPAGATION'`.
- `risk_score` (NUMERIC(5,2), 0-100).
- `affected_polygon` (GEOMETRY(Polygon, 4326)): Predicted hazard boundary.
- `recommended_prepositioning` (JSONB): Staging recommendations.

### 3.8 `audit_logs`
Immutable record of all AI decisions and operator overrides.
- `id` (VARCHAR(64), PK).
- `entity_type` (VARCHAR(64)): `'INCIDENT'`, `'REPORT'`, `'DISPATCH'`.
- `entity_id` (VARCHAR(64)).
- `action` (VARCHAR(64)): e.g. `'AI_SEVERITY_FUSED'`, `'OPERATOR_MANUAL_OVERRIDE'`.
- `actor_type` (VARCHAR(32)): `'AI_PIPELINE'` or `'HUMAN_OPERATOR'`.
- `actor_id` / `actor_name` (VARCHAR).
- `override_reason` (TEXT): Mandatory operator justification.
- `previous_value` / `new_value` (JSONB).

---

## 4. Spatial Indexing Strategy
To guarantee sub-second GIS queries under heavy disaster query loads, spatial indexes (`USING GIST`) are established on all geometry columns:
```sql
CREATE INDEX idx_zones_boundary ON zones USING GIST(boundary_geometry);
CREATE INDEX idx_incidents_canonical_loc ON incidents USING GIST(canonical_location);
CREATE INDEX idx_reports_raw_loc ON reports USING GIST(raw_location);
CREATE INDEX idx_resources_current_loc ON resources USING GIST(current_location);
CREATE INDEX idx_hospitals_loc ON hospitals USING GIST(location);
CREATE INDEX idx_prediction_affected_poly ON prediction_alerts USING GIST(affected_polygon);
```
