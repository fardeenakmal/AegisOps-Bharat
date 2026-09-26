-- =============================================================================
-- AegisOps Platform: Initial Data Seed (India Administrative & Emergency Fleet)
-- BCrypt password for all seeded users: "Password@123"
-- Hash: $2a$12$1/N4gKqA3s56Z3t7f5q72uT60xV6aYm9oZqBw8X7v9kY2cO5mD6S6
-- =============================================================================

-- 1. Seed Administrative Risk Zones across India
INSERT INTO risk_zones (id, code, name, level, parent_zone_id, latitude, longitude, population, risk_score, current_risk_level, primary_hazard)
VALUES
    ('zone-ndma-in', 'NDMA-HQ', 'National Disaster Management Authority (NDMA)', 'NATIONAL', NULL, 28.6139000, 77.2090000, 1428627663, 65.00, 'HIGH', 'CYCLONE'),
    ('zone-mh-mum', 'BMC-MUM-01', 'Brihanmumbai Municipal Corp (BMC) Disaster Cell', 'CITY', 'zone-ndma-in', 19.0760000, 72.8777000, 21000000, 82.50, 'CRITICAL', 'FLOOD'),
    ('zone-dl-ncr', 'DDMA-DEL-02', 'Delhi Disaster Management Authority (DDMA)', 'CITY', 'zone-ndma-in', 28.6139000, 77.2090000, 33000000, 74.00, 'HIGH', 'FIRE'),
    ('zone-ka-blr', 'BBMP-BLR-03', 'Bruhat Bengaluru Mahanagara Palike (BBMP) War Room', 'CITY', 'zone-ndma-in', 12.9716000, 77.5946000, 13600000, 58.00, 'MEDIUM', 'FLOOD'),
    ('zone-tn-chn', 'GCC-CHN-04', 'Greater Chennai Corporation (GCC) Disaster Cell', 'CITY', 'zone-ndma-in', 13.0827000, 80.2707000, 11500000, 68.00, 'HIGH', 'CYCLONE'),
    ('zone-od-bbs', 'OSDMA-OD-05', 'Odisha State Disaster Management Authority (OSDMA)', 'STATE', 'zone-ndma-in', 20.2961000, 85.8245000, 47000000, 88.00, 'CRITICAL', 'CYCLONE'),
    ('zone-wb-kol', 'KMC-KOL-06', 'Kolkata Municipal Corporation (KMC) Emergency Cell', 'CITY', 'zone-ndma-in', 22.5726000, 88.3639000, 15000000, 54.00, 'MEDIUM', 'FLOOD');

-- 2. Seed Users across all 4 target roles (Admin, Dispatcher, Field Responder, Public)
INSERT INTO users (id, username, email, password_hash, full_name, role, zone_id, phone_number, organization, is_active)
VALUES
    ('usr-admin-01', 'admin', 'admin@ndma.gov.in', '$2a$12$vT8WpQ63rP59Z5x9t6u82uT60xV6aYm9oZqBw8X7v9kY2cO5mD6S6', 'Director General NDMA', 'ADMIN', 'zone-ndma-in', '+91-11-2670-1700', 'National Disaster Management Authority', true),
    ('usr-disp-mum', 'dispatcher_mum', 'ops.mumbai@ndma.gov.in', '$2a$12$vT8WpQ63rP59Z5x9t6u82uT60xV6aYm9oZqBw8X7v9kY2cO5mD6S6', 'Capt. Rajesh Kadam', 'DISPATCHER', 'zone-mh-mum', '+91-98201-91100', 'BMC Emergency Operations Center', true),
    ('usr-disp-del', 'dispatcher_del', 'ops.delhi@ndma.gov.in', '$2a$12$vT8WpQ63rP59Z5x9t6u82uT60xV6aYm9oZqBw8X7v9kY2cO5mD6S6', 'Sunil Mehra', 'DISPATCHER', 'zone-dl-ncr', '+91-11-2386-0000', 'Delhi Disaster Management Cell', true),
    ('usr-resp-ndrf', 'responder_ndrf', '5bn.ndrf@gov.in', '$2a$12$vT8WpQ63rP59Z5x9t6u82uT60xV6aYm9oZqBw8X7v9kY2cO5mD6S6', 'Commandant Anup Kumar', 'FIELD_RESPONDER', 'zone-mh-mum', '+91-94230-11200', '5th Battalion NDRF (Pune/Mumbai)', true),
    ('usr-resp-als', 'responder_als', 'als09.108@emri.in', '$2a$12$vT8WpQ63rP59Z5x9t6u82uT60xV6aYm9oZqBw8X7v9kY2cO5mD6S6', 'Dr. Ramesh Patil', 'FIELD_RESPONDER', 'zone-mh-mum', '+91-98200-10809', '108 EMRI ALS Ambulance Crew', true),
    ('usr-public-01', 'citizen_guest', 'citizen@aegisops.in', '$2a$12$vT8WpQ63rP59Z5x9t6u82uT60xV6aYm9oZqBw8X7v9kY2cO5mD6S6', 'Public Citizen Reporter', 'PUBLIC', 'zone-mh-mum', '+91-98765-43210', 'Civilian', true);

-- 3. Seed Emergency Response Teams
INSERT INTO response_teams (id, call_sign, team_type, zone_id, status, latitude, longitude, base_station_name, crew_capacity, equipment_specs, contact_radio)
VALUES
    ('team-ndrf-5bn', '5TH BN NDRF (QRT-ALPHA)', 'NDRF_BATTALION', 'zone-mh-mum', 'AVAILABLE', 19.0720000, 72.8680000, 'NDRF Regional Response Centre, Andheri East', 18, '{"inflatable_boats": 4, "deep_diving_gear": true, "thermal_drones": 2, "hydraulic_cutters": true}', 'NDRF-CH-01 (VHF 156.8MHz)'),
    ('team-108-als', 'GVK-108 ALS AMBULANCE (MUM-09)', 'AMBULANCE', 'zone-mh-mum', 'AVAILABLE', 19.0100000, 72.8450000, 'Parel Trauma Emergency Station, Mumbai', 3, '{"ventilators": 2, "defibrillator": true, "suction_apparatus": true, "stretchers": 2}', '108-DISPATCH-CH-4'),
    ('team-mfb-tower', 'MUMBAI FIRE BRIGADE (TURNTABLE-70M)', 'FIRE_TRUCK', 'zone-mh-mum', 'AVAILABLE', 19.0150000, 72.8350000, 'Byculla Fire Command HQ', 6, '{"bronto_skylift_meters": 70, "high_pressure_foam": true, "water_tanker_litres": 8000}', 'MFB-CONTROL-101'),
    ('team-boat-sdrf', 'SDRF FLOOD RESCUE CRAFT (MAHA-04)', 'RESCUE_BOAT', 'zone-mh-mum', 'AVAILABLE', 19.0650000, 72.8850000, 'Mithi River Basin Outpost, Kurla', 4, '{"gemini_inflatable_boats": 2, "life_jackets": 40, "underwater_cameras": true}', 'SDRF-TAC-03'),
    ('team-ndrf-8bn', '8TH BN NDRF (DELHI NCR COMMAND)', 'NDRF_BATTALION', 'zone-dl-ncr', 'AVAILABLE', 28.6500000, 77.3400000, 'NDRF Base, Ghaziabad / Delhi Border', 22, '{"collapse_rescue_radar": true, "sniffer_canines": 4, "pneumatic_lifting_bags": true}', 'NDRF-NCR-PRIMARY'),
    ('team-dfs-foam', 'DELHI FIRE SERVICE (HEAVY FOAM TENDER)', 'FIRE_TRUCK', 'zone-dl-ncr', 'AVAILABLE', 28.6300000, 77.2200000, 'Connaught Circus Fire Station, Delhi', 5, '{"foam_compound_litres": 5000, "water_monitor_gpm": 2500}', 'DFS-CONTROL-101');

-- 4. Seed Representative Emergency Requests with Auto-Priority Scores
INSERT INTO emergency_requests (id, tracking_code, title, description, incident_type, priority_score, priority_level, category, status, zone_id, latitude, longitude, address, reporter_name, reporter_contact, estimated_casualties, estimated_trapped, is_life_threatening, detected_language, sla_target_minutes, sla_deadline, needs_summary)
VALUES
    ('req-ind-001', 'REQ-IND-2026-101', 'Flash Inundation & Submerged Transit Colonies at Kurla', 'Rapid water level rise from Mithi river backflow into residential ground floors. 14 residents trapped including infants on roof.', 'FLOOD', 94.00, 'CRITICAL', 'LIFE_THREATENING', 'REPORTED', 'zone-mh-mum', 19.0680000, 72.8790000, 'Kurla Railway Subway & CST Road Junction, Mumbai', 'Aakash Verma', '+91-98200-11223', 6, 14, true, 'hi', 10, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 10 MINUTE), '{"boats": 3, "ambulances": 4, "ndrf_battalions": 1}'),
    ('req-ind-002', 'REQ-IND-2026-102', 'Commercial High-Rise Fire & Dense Smoke Inhalation', 'Fire spreading across 4th and 5th floors with toxic electrical smoke. Multiple office workers trapped on upper terrace.', 'FIRE', 89.50, 'CRITICAL', 'LIFE_THREATENING', 'REPORTED', 'zone-dl-ncr', 28.6315000, 77.2195000, 'Statesman House, Barakhamba Road, Connaught Place, New Delhi', 'Rohit Sharma', '+91-98111-22334', 4, 9, true, 'en', 10, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 10 MINUTE), '{"fire_trucks": 4, "ambulances": 3, "aerial_ladders": 1}'),
    ('req-ind-003', 'REQ-IND-2026-103', 'Silk Board Flyover Underpass Heavy Waterlogging', 'Two passenger transport buses stalled in 4 feet water under flyover. Commuters stranded, no severe injuries reported.', 'FLOOD', 68.00, 'HIGH', 'PROPERTY_DAMAGE', 'REPORTED', 'zone-ka-blr', 12.9176000, 77.6229000, 'Central Silk Board Flyover Underpass, Bengaluru', 'Deepak Gowda', '+91-94480-33445', 0, 8, false, 'kn', 20, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 20 MINUTE), '{"boats": 1, "ambulances": 2}');

-- 5. Seed Authoritative Alerts with Provenance Transparency
INSERT INTO alerts (id, zone_id, risk_type, severity, risk_score, title, summary, source_feed, is_live, data_disclaimer, recommended_actions, recommended_prepositioning, valid_from, valid_to, is_active)
VALUES
    ('alt-imd-01', 'zone-mh-mum', 'URBAN_INUNDATION', 'CRITICAL', 92.00, 'IMD Red Alert: 120mm/hr Cloudburst & Mithi Basin Overflow', 'Doppler Radar telemetry indicates severe squall line convergence over Mumbai suburban belt. High astronomical tide of 4.65m prevents sea discharge.', 'OPEN_METEO', true, 'Live Open-Meteo Doppler Radar Telemetry', '["Evacuate Kranti Nagar and Kurla Mithi riverbanks", "Deploy NDRF 5th BN inflatable rescue craft", "Issue mobile cell broadcast to Ward L"]', '[{"resource_type": "NDRF_BATTALION", "target_station": "Kurla Basin Outpost", "quantity": 1}, {"resource_type": "AMBULANCE", "target_station": "KEM Hospital Parel", "quantity": 4}]', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 6 HOUR), true);

