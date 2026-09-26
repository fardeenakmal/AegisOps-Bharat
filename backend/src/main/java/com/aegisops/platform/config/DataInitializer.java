package com.aegisops.platform.config;

import com.aegisops.platform.entity.*;
import com.aegisops.platform.enums.*;
import com.aegisops.platform.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RiskZoneRepository zoneRepository;
    private final UserRepository userRepository;
    private final ResponseTeamRepository teamRepository;
    private final EmergencyRequestRepository requestRepository;
    private final AlertRepository alertRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            RiskZoneRepository zoneRepository,
            UserRepository userRepository,
            ResponseTeamRepository teamRepository,
            EmergencyRequestRepository requestRepository,
            AlertRepository alertRepository,
            PasswordEncoder passwordEncoder) {
        this.zoneRepository = zoneRepository;
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.requestRepository = requestRepository;
        this.alertRepository = alertRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (zoneRepository.count() > 0) {
            log.info("Database already seeded with {} zones. Skipping seed initialization.", zoneRepository.count());
            return;
        }

        log.info("Seeding authoritative India emergency data into AegisOps database...");

        // 1. Seed Risk Zones
        RiskZoneEntity ndma = new RiskZoneEntity("zone-ndma-in", "NDMA-HQ", "National Disaster Management Authority (NDMA)", "NATIONAL", BigDecimal.valueOf(28.6139), BigDecimal.valueOf(77.2090));
        ndma.setPopulation(1428627663L);
        ndma.setRiskScore(BigDecimal.valueOf(65.00));
        ndma.setCurrentRiskLevel("HIGH");
        ndma.setPrimaryHazard("CYCLONE");

        RiskZoneEntity mum = new RiskZoneEntity("zone-mh-mum", "BMC-MUM-01", "Brihanmumbai Municipal Corp (BMC) Disaster Cell", "CITY", BigDecimal.valueOf(19.0760), BigDecimal.valueOf(72.8777));
        mum.setParentZoneId("zone-ndma-in");
        mum.setPopulation(21000000L);
        mum.setRiskScore(BigDecimal.valueOf(82.50));
        mum.setCurrentRiskLevel("CRITICAL");
        mum.setPrimaryHazard("FLOOD");

        RiskZoneEntity del = new RiskZoneEntity("zone-dl-ncr", "DDMA-DEL-02", "Delhi Disaster Management Authority (DDMA)", "CITY", BigDecimal.valueOf(28.6139), BigDecimal.valueOf(77.2090));
        del.setParentZoneId("zone-ndma-in");
        del.setPopulation(33000000L);
        del.setRiskScore(BigDecimal.valueOf(74.00));
        del.setCurrentRiskLevel("HIGH");
        del.setPrimaryHazard("FIRE");

        RiskZoneEntity blr = new RiskZoneEntity("zone-ka-blr", "BBMP-BLR-03", "Bruhat Bengaluru Mahanagara Palike (BBMP) War Room", "CITY", BigDecimal.valueOf(12.9716), BigDecimal.valueOf(77.5946));
        blr.setParentZoneId("zone-ndma-in");
        blr.setPopulation(13600000L);
        blr.setRiskScore(BigDecimal.valueOf(58.00));
        blr.setCurrentRiskLevel("MEDIUM");
        blr.setPrimaryHazard("FLOOD");

        RiskZoneEntity chn = new RiskZoneEntity("zone-tn-chn", "GCC-CHN-04", "Greater Chennai Corporation (GCC) Disaster Cell", "CITY", BigDecimal.valueOf(13.0827), BigDecimal.valueOf(80.2707));
        chn.setParentZoneId("zone-ndma-in");
        chn.setPopulation(11500000L);
        chn.setRiskScore(BigDecimal.valueOf(68.00));
        chn.setCurrentRiskLevel("HIGH");
        chn.setPrimaryHazard("CYCLONE");

        RiskZoneEntity bbs = new RiskZoneEntity("zone-od-bbs", "OSDMA-OD-05", "Odisha State Disaster Management Authority (OSDMA)", "STATE", BigDecimal.valueOf(20.2961), BigDecimal.valueOf(85.8245));
        bbs.setParentZoneId("zone-ndma-in");
        bbs.setPopulation(47000000L);
        bbs.setRiskScore(BigDecimal.valueOf(88.00));
        bbs.setCurrentRiskLevel("CRITICAL");
        bbs.setPrimaryHazard("CYCLONE");

        RiskZoneEntity kol = new RiskZoneEntity("zone-wb-kol", "KMC-KOL-06", "Kolkata Municipal Corporation (KMC) Emergency Cell", "CITY", BigDecimal.valueOf(22.5726), BigDecimal.valueOf(88.3639));
        kol.setParentZoneId("zone-ndma-in");
        kol.setPopulation(15000000L);
        kol.setRiskScore(BigDecimal.valueOf(54.00));
        kol.setCurrentRiskLevel("MEDIUM");
        kol.setPrimaryHazard("FLOOD");

        zoneRepository.saveAll(List.of(ndma, mum, del, blr, chn, bbs, kol));

        // 2. Seed Users
        String encodedPassword = passwordEncoder.encode("Password@123");

        UserEntity admin = new UserEntity();
        admin.setId("usr-admin-01");
        admin.setUsername("admin");
        admin.setEmail("admin@ndma.gov.in");
        admin.setPasswordHash(encodedPassword);
        admin.setFullName("Director General NDMA");
        admin.setRole(UserRole.ADMIN);
        admin.setZoneId("zone-ndma-in");
        admin.setPhoneNumber("+91-11-2670-1700");
        admin.setOrganization("National Disaster Management Authority");
        admin.setIsActive(true);

        UserEntity dispMum = new UserEntity();
        dispMum.setId("usr-disp-mum");
        dispMum.setUsername("dispatcher_mum");
        dispMum.setEmail("ops.mumbai@ndma.gov.in");
        dispMum.setPasswordHash(encodedPassword);
        dispMum.setFullName("Capt. Rajesh Kadam");
        dispMum.setRole(UserRole.DISPATCHER);
        dispMum.setZoneId("zone-mh-mum");
        dispMum.setPhoneNumber("+91-98201-91100");
        dispMum.setOrganization("BMC Emergency Operations Center");
        dispMum.setIsActive(true);

        UserEntity dispDel = new UserEntity();
        dispDel.setId("usr-disp-del");
        dispDel.setUsername("dispatcher_del");
        dispDel.setEmail("ops.delhi@ndma.gov.in");
        dispDel.setPasswordHash(encodedPassword);
        dispDel.setFullName("Sunil Mehra");
        dispDel.setRole(UserRole.DISPATCHER);
        dispDel.setZoneId("zone-dl-ncr");
        dispDel.setPhoneNumber("+91-11-2386-0000");
        dispDel.setOrganization("Delhi Disaster Management Cell");
        dispDel.setIsActive(true);

        UserEntity respNdrf = new UserEntity();
        respNdrf.setId("usr-resp-ndrf");
        respNdrf.setUsername("responder_ndrf");
        respNdrf.setEmail("5bn.ndrf@gov.in");
        respNdrf.setPasswordHash(encodedPassword);
        respNdrf.setFullName("Commandant Anup Kumar");
        respNdrf.setRole(UserRole.FIELD_RESPONDER);
        respNdrf.setZoneId("zone-mh-mum");
        respNdrf.setPhoneNumber("+91-94230-11200");
        respNdrf.setOrganization("5th Battalion NDRF (Pune/Mumbai)");
        respNdrf.setIsActive(true);

        UserEntity respAls = new UserEntity();
        respAls.setId("usr-resp-als");
        respAls.setUsername("responder_als");
        respAls.setEmail("als09.108@emri.in");
        respAls.setPasswordHash(encodedPassword);
        respAls.setFullName("Dr. Ramesh Patil");
        respAls.setRole(UserRole.FIELD_RESPONDER);
        respAls.setZoneId("zone-mh-mum");
        respAls.setPhoneNumber("+91-98200-10809");
        respAls.setOrganization("108 EMRI ALS Ambulance Crew");
        respAls.setIsActive(true);

        UserEntity citizen = new UserEntity();
        citizen.setId("usr-public-01");
        citizen.setUsername("citizen_guest");
        citizen.setEmail("citizen@aegisops.in");
        citizen.setPasswordHash(encodedPassword);
        citizen.setFullName("Public Citizen Reporter");
        citizen.setRole(UserRole.PUBLIC);
        citizen.setZoneId("zone-mh-mum");
        citizen.setPhoneNumber("+91-98765-43210");
        citizen.setOrganization("Civilian");
        citizen.setIsActive(true);

        userRepository.saveAll(List.of(admin, dispMum, dispDel, respNdrf, respAls, citizen));

        // 3. Seed Response Teams
        ResponseTeamEntity team1 = new ResponseTeamEntity();
        team1.setId("team-ndrf-5bn");
        team1.setCallSign("5TH BN NDRF (QRT-ALPHA)");
        team1.setTeamType(TeamType.NDRF_BATTALION);
        team1.setZoneId("zone-mh-mum");
        team1.setStatus(TeamStatus.AVAILABLE);
        team1.setLatitude(BigDecimal.valueOf(19.0720));
        team1.setLongitude(BigDecimal.valueOf(72.8680));
        team1.setBaseStationName("NDRF Regional Response Centre, Andheri East");
        team1.setCrewCapacity(18);
        team1.setEquipmentSpecs("{\"inflatable_boats\": 4, \"deep_diving_gear\": true, \"thermal_drones\": 2, \"hydraulic_cutters\": true}");
        team1.setContactRadio("NDRF-CH-01 (VHF 156.8MHz)");

        ResponseTeamEntity team2 = new ResponseTeamEntity();
        team2.setId("team-108-als");
        team2.setCallSign("GVK-108 ALS AMBULANCE (MUM-09)");
        team2.setTeamType(TeamType.AMBULANCE);
        team2.setZoneId("zone-mh-mum");
        team2.setStatus(TeamStatus.AVAILABLE);
        team2.setLatitude(BigDecimal.valueOf(19.0100));
        team2.setLongitude(BigDecimal.valueOf(72.8450));
        team2.setBaseStationName("Parel Trauma Emergency Station, Mumbai");
        team2.setCrewCapacity(3);
        team2.setEquipmentSpecs("{\"ventilators\": 2, \"defibrillator\": true, \"suction_apparatus\": true, \"stretchers\": 2}");
        team2.setContactRadio("108-DISPATCH-CH-4");

        ResponseTeamEntity team3 = new ResponseTeamEntity();
        team3.setId("team-mfb-tower");
        team3.setCallSign("MUMBAI FIRE BRIGADE (TURNTABLE-70M)");
        team3.setTeamType(TeamType.FIRE_TRUCK);
        team3.setZoneId("zone-mh-mum");
        team3.setStatus(TeamStatus.AVAILABLE);
        team3.setLatitude(BigDecimal.valueOf(19.0150));
        team3.setLongitude(BigDecimal.valueOf(72.8350));
        team3.setBaseStationName("Byculla Fire Command HQ");
        team3.setCrewCapacity(6);
        team3.setEquipmentSpecs("{\"bronto_skylift_meters\": 70, \"high_pressure_foam\": true, \"water_tanker_litres\": 8000}");
        team3.setContactRadio("MFB-CONTROL-101");

        ResponseTeamEntity team4 = new ResponseTeamEntity();
        team4.setId("team-boat-sdrf");
        team4.setCallSign("SDRF FLOOD RESCUE CRAFT (MAHA-04)");
        team4.setTeamType(TeamType.RESCUE_BOAT);
        team4.setZoneId("zone-mh-mum");
        team4.setStatus(TeamStatus.AVAILABLE);
        team4.setLatitude(BigDecimal.valueOf(19.0650));
        team4.setLongitude(BigDecimal.valueOf(72.8850));
        team4.setBaseStationName("Mithi River Basin Outpost, Kurla");
        team4.setCrewCapacity(4);
        team4.setEquipmentSpecs("{\"gemini_inflatable_boats\": 2, \"life_jackets\": 40, \"underwater_cameras\": true}");
        team4.setContactRadio("SDRF-TAC-03");

        ResponseTeamEntity team5 = new ResponseTeamEntity();
        team5.setId("team-ndrf-8bn");
        team5.setCallSign("8TH BN NDRF (DELHI NCR COMMAND)");
        team5.setTeamType(TeamType.NDRF_BATTALION);
        team5.setZoneId("zone-dl-ncr");
        team5.setStatus(TeamStatus.AVAILABLE);
        team5.setLatitude(BigDecimal.valueOf(28.6500));
        team5.setLongitude(BigDecimal.valueOf(77.3400));
        team5.setBaseStationName("NDRF Base, Ghaziabad / Delhi Border");
        team5.setCrewCapacity(22);
        team5.setEquipmentSpecs("{\"collapse_rescue_radar\": true, \"sniffer_canines\": 4, \"pneumatic_lifting_bags\": true}");
        team5.setContactRadio("NDRF-NCR-PRIMARY");

        ResponseTeamEntity team6 = new ResponseTeamEntity();
        team6.setId("team-dfs-foam");
        team6.setCallSign("DELHI FIRE SERVICE (HEAVY FOAM TENDER)");
        team6.setTeamType(TeamType.FIRE_TRUCK);
        team6.setZoneId("zone-dl-ncr");
        team6.setStatus(TeamStatus.AVAILABLE);
        team6.setLatitude(BigDecimal.valueOf(28.6300));
        team6.setLongitude(BigDecimal.valueOf(77.2200));
        team6.setBaseStationName("Connaught Circus Fire Station, Delhi");
        team6.setCrewCapacity(5);
        team6.setEquipmentSpecs("{\"foam_compound_litres\": 5000, \"water_monitor_gpm\": 2500}");
        team6.setContactRadio("DFS-CONTROL-101");

        teamRepository.saveAll(List.of(team1, team2, team3, team4, team5, team6));

        // 4. Seed Emergency Requests
        EmergencyRequestEntity req1 = new EmergencyRequestEntity();
        req1.setId("req-ind-001");
        req1.setTrackingCode("REQ-IND-2026-101");
        req1.setTitle("Flash Inundation & Submerged Transit Colonies at Kurla");
        req1.setDescription("Rapid water level rise from Mithi river backflow into residential ground floors. 14 residents trapped including infants on roof.");
        req1.setIncidentType("FLOOD");
        req1.setPriorityScore(BigDecimal.valueOf(94.00));
        req1.setPriorityLevel(PriorityLevel.CRITICAL);
        req1.setCategory(RequestCategory.LIFE_THREATENING);
        req1.setStatus(RequestStatus.REPORTED);
        req1.setZoneId("zone-mh-mum");
        req1.setLatitude(BigDecimal.valueOf(19.0680));
        req1.setLongitude(BigDecimal.valueOf(72.8790));
        req1.setAddress("Kurla Railway Subway & CST Road Junction, Mumbai");
        req1.setReporterName("Aakash Verma");
        req1.setReporterContact("+91-98200-11223");
        req1.setEstimatedCasualties(6);
        req1.setEstimatedTrapped(14);
        req1.setIsLifeThreatening(true);
        req1.setDetectedLanguage("hi");
        req1.setSlaTargetMinutes(10);
        req1.setSlaDeadline(Instant.now().plus(10, ChronoUnit.MINUTES));
        req1.setNeedsSummary("{\"boats\": 3, \"ambulances\": 4, \"ndrf_battalions\": 1}");

        EmergencyRequestEntity req2 = new EmergencyRequestEntity();
        req2.setId("req-ind-002");
        req2.setTrackingCode("REQ-IND-2026-102");
        req2.setTitle("Commercial High-Rise Fire & Dense Smoke Inhalation");
        req2.setDescription("Fire spreading across 4th and 5th floors with toxic electrical smoke. Multiple office workers trapped on upper terrace.");
        req2.setIncidentType("FIRE");
        req2.setPriorityScore(BigDecimal.valueOf(89.50));
        req2.setPriorityLevel(PriorityLevel.CRITICAL);
        req2.setCategory(RequestCategory.LIFE_THREATENING);
        req2.setStatus(RequestStatus.REPORTED);
        req2.setZoneId("zone-dl-ncr");
        req2.setLatitude(BigDecimal.valueOf(28.6315));
        req2.setLongitude(BigDecimal.valueOf(77.2195));
        req2.setAddress("Statesman House, Barakhamba Road, Connaught Place, New Delhi");
        req2.setReporterName("Rohit Sharma");
        req2.setReporterContact("+91-98111-22334");
        req2.setEstimatedCasualties(4);
        req2.setEstimatedTrapped(9);
        req2.setIsLifeThreatening(true);
        req2.setDetectedLanguage("en");
        req2.setSlaTargetMinutes(10);
        req2.setSlaDeadline(Instant.now().plus(10, ChronoUnit.MINUTES));
        req2.setNeedsSummary("{\"fire_trucks\": 4, \"ambulances\": 3, \"aerial_ladders\": 1}");

        EmergencyRequestEntity req3 = new EmergencyRequestEntity();
        req3.setId("req-ind-003");
        req3.setTrackingCode("REQ-IND-2026-103");
        req3.setTitle("Silk Board Flyover Underpass Heavy Waterlogging");
        req3.setDescription("Two passenger transport buses stalled in 4 feet water under flyover. Commuters stranded, no severe injuries reported.");
        req3.setIncidentType("FLOOD");
        req3.setPriorityScore(BigDecimal.valueOf(68.00));
        req3.setPriorityLevel(PriorityLevel.HIGH);
        req3.setCategory(RequestCategory.PROPERTY_DAMAGE);
        req3.setStatus(RequestStatus.REPORTED);
        req3.setZoneId("zone-ka-blr");
        req3.setLatitude(BigDecimal.valueOf(12.9176));
        req3.setLongitude(BigDecimal.valueOf(77.6229));
        req3.setAddress("Central Silk Board Flyover Underpass, Bengaluru");
        req3.setReporterName("Deepak Gowda");
        req3.setReporterContact("+91-94480-33445");
        req3.setEstimatedCasualties(0);
        req3.setEstimatedTrapped(8);
        req3.setIsLifeThreatening(false);
        req3.setDetectedLanguage("kn");
        req3.setSlaTargetMinutes(20);
        req3.setSlaDeadline(Instant.now().plus(20, ChronoUnit.MINUTES));
        req3.setNeedsSummary("{\"boats\": 1, \"ambulances\": 2}");

        requestRepository.saveAll(List.of(req1, req2, req3));

        // 5. Seed Authoritative Alerts
        AlertEntity alert = new AlertEntity();
        alert.setId("alt-imd-01");
        alert.setZoneId("zone-mh-mum");
        alert.setRiskType(RiskType.URBAN_INUNDATION);
        alert.setSeverity(SeverityLevel.CRITICAL);
        alert.setRiskScore(BigDecimal.valueOf(92.00));
        alert.setTitle("IMD Red Alert: 120mm/hr Cloudburst & Mithi Basin Overflow");
        alert.setSummary("Doppler Radar telemetry indicates severe squall line convergence over Mumbai suburban belt. High astronomical tide of 4.65m prevents sea discharge.");
        alert.setSourceFeed(FeedSource.OPEN_METEO);
        alert.setIsLive(true);
        alert.setDataDisclaimer("Live Open-Meteo Doppler Radar Telemetry");
        alert.setRecommendedActions("[\"Evacuate Kranti Nagar and Kurla Mithi riverbanks\", \"Deploy NDRF 5th BN inflatable rescue craft\", \"Issue mobile cell broadcast to Ward L\"]");
        alert.setRecommendedPrepositioning("[{\"resource_type\": \"NDRF_BATTALION\", \"target_station\": \"Kurla Basin Outpost\", \"quantity\": 1}, {\"resource_type\": \"AMBULANCE\", \"target_station\": \"KEM Hospital Parel\", \"quantity\": 4}]");
        alert.setValidFrom(Instant.now());
        alert.setValidTo(Instant.now().plus(6, ChronoUnit.HOURS));
        alert.setIsActive(true);

        alertRepository.save(alert);

        log.info("AegisOps initial data seeding completed successfully.");
    }
}
