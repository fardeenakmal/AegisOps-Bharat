package com.aegisops.platform.service;

import com.aegisops.platform.adapter.*;
import com.aegisops.platform.config.RegionConfig;
import com.aegisops.platform.dto.SimulationInput;
import com.aegisops.platform.entity.AlertEntity;
import com.aegisops.platform.entity.EmergencyRequestEntity;
import com.aegisops.platform.entity.RiskZoneEntity;
import com.aegisops.platform.enums.*;
import com.aegisops.platform.repository.AlertRepository;
import com.aegisops.platform.repository.EmergencyRequestRepository;
import com.aegisops.platform.repository.RiskZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RiskZoneService {

    private static final Logger log = LoggerFactory.getLogger(RiskZoneService.class);

    private final RiskZoneRepository zoneRepository;
    private final AlertRepository alertRepository;
    private final EmergencyRequestRepository requestRepository;
    private final WeatherAdapter weatherAdapter;
    private final SeismicAdapter seismicAdapter;
    private final HydrologicalAdapter hydrologicalAdapter;
    private final GovernmentAlertAdapter governmentAlertAdapter;
    private final NasaEonetAdapter nasaEonetAdapter;
    private final GdacsAdapter gdacsAdapter;
    private final AlertBroadcastService broadcastService;
    private final RegionConfig regionConfig;

    public RiskZoneService(
            RiskZoneRepository zoneRepository,
            AlertRepository alertRepository,
            EmergencyRequestRepository requestRepository,
            WeatherAdapter weatherAdapter,
            SeismicAdapter seismicAdapter,
            HydrologicalAdapter hydrologicalAdapter,
            GovernmentAlertAdapter governmentAlertAdapter,
            NasaEonetAdapter nasaEonetAdapter,
            GdacsAdapter gdacsAdapter,
            AlertBroadcastService broadcastService,
            RegionConfig regionConfig) {
        this.zoneRepository = zoneRepository;
        this.alertRepository = alertRepository;
        this.requestRepository = requestRepository;
        this.weatherAdapter = weatherAdapter;
        this.seismicAdapter = seismicAdapter;
        this.hydrologicalAdapter = hydrologicalAdapter;
        this.governmentAlertAdapter = governmentAlertAdapter;
        this.nasaEonetAdapter = nasaEonetAdapter;
        this.gdacsAdapter = gdacsAdapter;
        this.broadcastService = broadcastService;
        this.regionConfig = regionConfig;
    }

    public List<RiskZoneEntity> getAllZones() {
        return zoneRepository.findAll();
    }

    public List<AlertEntity> getActiveAlerts(String zoneId) {
        if (zoneId != null && !zoneId.isBlank() && !"zone-ndma-in".equals(zoneId) && !"ALL".equals(zoneId)) {
            return alertRepository.findByZoneIdAndIsActiveTrue(zoneId);
        }
        return alertRepository.findByIsActiveTrueOrderByRiskScoreDescCreatedAtDesc();
    }

    @Transactional
    public AlertEntity simulateHazard(SimulationInput input) {
        String alertId = "alt-sim-" + UUID.randomUUID().toString().substring(0, 8);
        String zoneId = input.zoneId() != null ? input.zoneId() : "zone-mh-mum";
        RiskZoneEntity zone = zoneRepository.findById(zoneId).orElse(null);

        double lat = input.latitude() != null ? input.latitude()
                : (zone != null ? zone.getLatitude().doubleValue() : 19.0760);
        double lon = input.longitude() != null ? input.longitude()
                : (zone != null ? zone.getLongitude().doubleValue() : 72.8777);

        DataFeedResult<LiveWeatherReport> weatherResult = weatherAdapter.fetchLiveWeather(lat, lon);
        LiveWeatherReport weather = weatherResult.data();

        double effectivePrecip = input.precipitationMmHr() != null ? input.precipitationMmHr()
                : (weather != null && weather.precipitationMmHr() > 0 ? weather.precipitationMmHr() : 65.0);
        double effectiveWind = input.windSpeedKmh() != null ? input.windSpeedKmh()
                : (weather != null && weather.windSpeedKmh() > 0 ? weather.windSpeedKmh() : 70.0);

        RiskType riskType = input.riskType() != null ? input.riskType() : RiskType.FLOOD;
        double rawRiskScore;
        SeverityLevel severity;
        String title;
        String summary;
        String recommendedActionsJson;
        String recommendedPrepositioningJson;

        String zoneName = zone != null ? zone.getName() : "Command Sector";

        switch (riskType) {
            case FLOOD, URBAN_INUNDATION -> {
                double surge = input.riverGaugeSurgePercent() != null ? input.riverGaugeSurgePercent() : 75.0;
                rawRiskScore = Math.min(99.0, 52.0 + surge * 0.32 + effectivePrecip * 0.22);
                severity = rawRiskScore >= 80.0 ? SeverityLevel.CRITICAL : SeverityLevel.HIGH;
                title = input.scenarioName() != null && !input.scenarioName().isBlank()
                        ? input.scenarioName()
                        : String.format("Hydro Drill: Flash Flood & River Overflow (%.0f%% Surge, %.1f mm/hr)", surge, effectivePrecip);
                summary = input.customSummary() != null && !input.customSummary().isBlank()
                        ? input.customSummary()
                        : String.format("Simulation model at %s (%.4f°N, %.4f°E) projects critical urban inundation exceeding 1.8m in lowlands. Water ingress in transit underpasses.", zoneName, lat, lon);
                recommendedActionsJson = "[\"Issue Red Inundation Advisory\", \"Pre-position Inflatable Gemini Rescue Boats\", \"Deploy 1500 GPM dewatering pumps at railway subway underpasses\", \"Mobilize NDRF 5th Battalion for low-lying evacuations\"]";
                recommendedPrepositioningJson = "[{\"resourceType\": \"NDRF_BATTALION\", \"quantity\": 3, \"targetStation\": \"Bandra East Relief Hub\"}, {\"resourceType\": \"QUICK_RESPONSE_TEAM\", \"quantity\": 4, \"targetStation\": \"Kurla EOC Station\"}, {\"resourceType\": \"FIRE_SERVICE\", \"quantity\": 2, \"targetStation\": \"Dharavi Fire Depot\"}]";
            }
            case CYCLONE -> {
                rawRiskScore = Math.min(99.0, 62.0 + effectiveWind * 0.22);
                severity = SeverityLevel.CRITICAL;
                title = input.scenarioName() != null && !input.scenarioName().isBlank()
                        ? input.scenarioName()
                        : String.format("Cyclone Drill: Category-4 Coastal Landfall (%.0f km/h Gales)", effectiveWind);
                summary = input.customSummary() != null && !input.customSummary().isBlank()
                        ? input.customSummary()
                        : String.format("Atmospheric gale propagation model predicts Category-4 Cyclonic landfall near %s with 3.5m storm surges, structural gale loading, and telecom mast collapse.", zoneName);
                recommendedActionsJson = "[\"Trigger Coastal Evacuation within 5 km of shoreline\", \"Suspend harbor, ferry and port operations\", \"Pre-stage heavy tree-clearing chainsaws and mobile generators\", \"Activate multi-agency civil defense cyclone shelters\"]";
                recommendedPrepositioningJson = "[{\"resourceType\": \"NDRF_BATTALION\", \"quantity\": 4, \"targetStation\": \"Coastal Defence Enclave\"}, {\"resourceType\": \"SDRF_UNIT\", \"quantity\": 3, \"targetStation\": \"Harbor Command Pier\"}, {\"resourceType\": \"ALS_AMBULANCE\", \"quantity\": 5, \"targetStation\": \"District Apex Trauma Centre\"}]";
            }
            case EARTHQUAKE, AFTERSHOCK -> {
                double mag = input.earthquakeMagnitude() != null ? input.earthquakeMagnitude() : 6.8;
                double depth = input.hypocenterDepthKm() != null ? input.hypocenterDepthKm() : 12.0;
                rawRiskScore = Math.min(99.0, 48.0 + mag * 6.8 - Math.min(10.0, depth * 0.2));
                severity = SeverityLevel.CRITICAL;
                title = input.scenarioName() != null && !input.scenarioName().isBlank()
                        ? input.scenarioName()
                        : String.format("Seismic Drill: M%.1f Intraplate Earthquake at Depth %.0f km", mag, depth);
                summary = input.customSummary() != null && !input.customSummary().isBlank()
                        ? input.customSummary()
                        : String.format("Simulated violent ground motion (MMI VIII) in %s basin. Multiple structural pancake collapses, gas mains fractured, and elevated aftershock probability within 48h.", zoneName);
                recommendedActionsJson = "[\"Initiate Immediate Structural Integrity Audits on Bridges and Flyovers\", \"Deploy acoustic life-detectors and search canines\", \"Reserve 40% of district trauma ICU beds for crush syndrome patients\", \"Issue Aftershock Safety Bulletin: Drop, Cover, and Hold On\"]";
                recommendedPrepositioningJson = "[{\"resourceType\": \"URBAN_SEARCH_AND_RESCUE\", \"quantity\": 4, \"targetStation\": \"Central Civil Defence Depot\"}, {\"resourceType\": \"ALS_AMBULANCE\", \"quantity\": 8, \"targetStation\": \"Apex Medical College\"}, {\"resourceType\": \"FIRE_SERVICE\", \"quantity\": 4, \"targetStation\": \"Municipal Fire HQ\"}]";
            }
            case STRUCTURAL_COLLAPSE -> {
                rawRiskScore = 91.0;
                severity = SeverityLevel.CRITICAL;
                title = input.scenarioName() != null && !input.scenarioName().isBlank()
                        ? input.scenarioName()
                        : "Structural Collapse Drill: Multi-Story Complex Pancake Failure";
                summary = input.customSummary() != null && !input.customSummary().isBlank()
                        ? input.customSummary()
                        : String.format("Catastrophic vertical load-bearing column failure in %s. Estimated 25+ civilian casualties trapped in void spaces beneath reinforced concrete slabs.", zoneName);
                recommendedActionsJson = "[\"Deploy Hydraulic Spreaders, Cutters, and Jaws of Life\", \"Establish 100-ton crane hoisting perimeter\", \"Implement Rapid On-Scene Triage Sorting Post\", \"Alert Regional Trauma Centers for inbound severe trauma admissions\"]";
                recommendedPrepositioningJson = "[{\"resourceType\": \"NDRF_BATTALION\", \"quantity\": 2, \"targetStation\": \"USAR Strike Base\"}, {\"resourceType\": \"ALS_AMBULANCE\", \"quantity\": 6, \"targetStation\": \"District General Hospital\"}]";
            }
            case GAS_LEAK -> {
                rawRiskScore = 94.0;
                severity = SeverityLevel.CRITICAL;
                title = input.scenarioName() != null && !input.scenarioName().isBlank()
                        ? input.scenarioName()
                        : "Hazmat Drill: Industrial Ammonia / Toxic Vapor Cloud Plume";
                summary = input.customSummary() != null && !input.customSummary().isBlank()
                        ? input.customSummary()
                        : String.format("Ruptured pressurized storage sphere in %s industrial corridor. Toxic vapor dispersion model projects 3.5 km windward contamination corridor.", zoneName);
                recommendedActionsJson = "[\"Enforce 3 km Windward Cordon and Public Evacuation\", \"Broadcast Immediate Shelter-in-Place & Damp Cloth Respiratory Advisory\", \"Deploy Hazmat Decontamination Tents and Water Fog Curtains\", \"Pre-stock Bronchodilators and Oxygen Cylinders at Sector Clinics\"]";
                recommendedPrepositioningJson = "[{\"resourceType\": \"HAZMAT_DECON_UNIT\", \"quantity\": 3, \"targetStation\": \"Industrial Fire Outpost\"}, {\"resourceType\": \"ALS_AMBULANCE\", \"quantity\": 6, \"targetStation\": \"Sub-District Hospital\"}]";
            }
            case FIRE -> {
                rawRiskScore = 86.0;
                severity = SeverityLevel.CRITICAL;
                title = input.scenarioName() != null && !input.scenarioName().isBlank()
                        ? input.scenarioName()
                        : "Urban Fire Drill: Commercial High-Rise 5-Alarm Conflagration";
                summary = input.customSummary() != null && !input.customSummary().isBlank()
                        ? input.customSummary()
                        : String.format("Major structure fire rapidly spreading through multi-tier composite cladding in %s. Dense smoke obstructing emergency stairways.", zoneName);
                recommendedActionsJson = "[\"Deploy 70-meter Aerial Hydraulic Turntable Platforms\", \"Connect High-Volume Hydrant Boosters to Municipal Main\", \"Alert State Burn ICU Network for inbound inhalational injury patients\", \"Cut Gas and Grid Power to Incident Block\"]";
                recommendedPrepositioningJson = "[{\"resourceType\": \"FIRE_SERVICE\", \"quantity\": 6, \"targetStation\": \"Central Fire Brigade\"}, {\"resourceType\": \"ALS_AMBULANCE\", \"quantity\": 4, \"targetStation\": \"Municipal Trauma Unit\"}]";
            }
            case ROAD_ACCIDENT -> {
                rawRiskScore = 80.0;
                severity = SeverityLevel.HIGH;
                title = input.scenarioName() != null && !input.scenarioName().isBlank()
                        ? input.scenarioName()
                        : "Mass Transit Drill: High-Speed Passenger Train Collision & Derailment";
                summary = input.customSummary() != null && !input.customSummary().isBlank()
                        ? input.customSummary()
                        : String.format("Multi-coach derailment on main arterial railway corridor in %s. Multiple passenger coaches capsized with structural entrapment.", zoneName);
                recommendedActionsJson = "[\"Trigger Mass Casualty Incident (MCI) Code across all District Hospitals\", \"Deploy Railway Accident Relief Train (ART) and Cold-Cutting Gear\", \"Establish On-Scene Red/Yellow/Green Field Hospital\", \"Coordinate Air Ambulance Liftoffs for Critical Trauma Cases\"]";
                recommendedPrepositioningJson = "[{\"resourceType\": \"ALS_AMBULANCE\", \"quantity\": 8, \"targetStation\": \"Civil Hospital Trauma Wing\"}, {\"resourceType\": \"QUICK_RESPONSE_TEAM\", \"quantity\": 3, \"targetStation\": \"Railway Police Depot\"}]";
            }
            case LANDSLIDE -> {
                rawRiskScore = 84.0;
                severity = SeverityLevel.CRITICAL;
                title = input.scenarioName() != null && !input.scenarioName().isBlank()
                        ? input.scenarioName()
                        : "Geological Drill: Massive Slope Failure & Highway Debris Blockade";
                summary = input.customSummary() != null && !input.customSummary().isBlank()
                        ? input.customSummary()
                        : String.format("Slope saturation triggering 85,000 cu.m debris flow across primary mountain access corridor in %s. Vehicular transit fully blocked.", zoneName);
                recommendedActionsJson = "[\"Deploy Heavy Earth-Movers, Bulldozers, and Rock Breakers\", \"Conduct Drone Aerial LiDAR Mapping for Secondary Mudslides\", \"Establish Emergency Heli-Pad for Vital Supply Air-Drops\", \"Evacuate Vulnerable Downhill Habitations to Geologically Stable Zones\"]";
                recommendedPrepositioningJson = "[{\"resourceType\": \"NDRF_BATTALION\", \"quantity\": 2, \"targetStation\": \"Hill Station Base Camp\"}, {\"resourceType\": \"ALS_AMBULANCE\", \"quantity\": 3, \"targetStation\": \"Valley Community Health Centre\"}]";
            }
            default -> {
                rawRiskScore = 75.0;
                severity = SeverityLevel.HIGH;
                title = input.scenarioName() != null && !input.scenarioName().isBlank()
                        ? input.scenarioName()
                        : "Multi-Hazard Civil Defense Simulation Drill";
                summary = String.format("Civil defense preparedness exercise in %s sector under variable atmospheric and seismic telemetry.", zoneName);
                recommendedActionsJson = "[\"Pre-position Quick Response Teams\", \"Alert Civil Defense Volunteers\", \"Inspect Emergency Shelters\"]";
                recommendedPrepositioningJson = "[{\"resourceType\": \"QUICK_RESPONSE_TEAM\", \"quantity\": 2, \"targetStation\": \"Sector EOC\"}]";
            }
        }

        BigDecimal riskScore = BigDecimal.valueOf(rawRiskScore).setScale(2, RoundingMode.HALF_UP);

        AlertEntity alert = new AlertEntity();
        alert.setId(alertId);
        alert.setZoneId(zoneId);
        alert.setRiskType(riskType);
        alert.setSeverity(severity);
        alert.setRiskScore(riskScore);
        alert.setTitle(title);
        alert.setSummary(summary);
        alert.setSourceFeed(FeedSource.SIMULATION);
        alert.setIsLive(false);
        alert.setDataDisclaimer("Civil Defense Simulation Drill (Synthetic Exercise Sandbox)");
        alert.setRecommendedActions(recommendedActionsJson);
        alert.setRecommendedPrepositioning(recommendedPrepositioningJson);
        alert.setValidFrom(Instant.now());
        alert.setValidTo(Instant.now().plus(6, ChronoUnit.HOURS));
        alert.setIsActive(true);

        AlertEntity saved = alertRepository.save(alert);

        // Update Zone score for drill awareness
        if (zone != null) {
            zone.setRiskScore(riskScore);
            zone.setCurrentRiskLevel(severity.name());
            zoneRepository.save(zone);
        }

        broadcastService.broadcastAlert(saved);

        // Spawn synthetic distress calls if requested
        if (Boolean.TRUE.equals(input.injectIncidents())) {
            injectSimulatedIncidents(zoneId, riskType, title, lat, lon, input.estimatedCasualties(), input.estimatedTrapped());
        }

        return saved;
    }

    private void injectSimulatedIncidents(String zoneId, RiskType riskType, String scenarioTitle, double lat, double lon, Integer userCasualties, Integer userTrapped) {
        int casualties = userCasualties != null ? userCasualties : 4;
        int trapped = userTrapped != null ? userTrapped : 8;

        List<EmergencyRequestEntity> drillList = new ArrayList<>();

        // Incident 1: Critical direct victim entrapment
        EmergencyRequestEntity req1 = new EmergencyRequestEntity();
        String id1 = "req-sim-" + UUID.randomUUID().toString().substring(0, 8);
        req1.setId(id1);
        req1.setTrackingCode("REQ-SIM-" + (System.currentTimeMillis() % 100000));
        req1.setTitle("DRILL: " + scenarioTitle + " — Multiple Victims Entrapped");
        req1.setDescription(String.format("SIMULATED EMERGENCY CALL (Devanagari: बचाओ! यहां %d लोग फंसे हैं): Distress callers report %d individuals trapped and %d injured at sector focal point due to %s. High urgency response requested.",
                trapped, trapped, casualties, riskType.name()));
        req1.setIncidentType(riskType.name());
        req1.setPriorityScore(BigDecimal.valueOf(95.0));
        req1.setPriorityLevel(PriorityLevel.CRITICAL);
        req1.setCategory(RequestCategory.LIFE_THREATENING);
        req1.setStatus(RequestStatus.REPORTED);
        req1.setZoneId(zoneId);
        req1.setLatitude(BigDecimal.valueOf(lat + 0.0085));
        req1.setLongitude(BigDecimal.valueOf(lon + 0.0062));
        req1.setAddress("Drill Site Alpha, Central Sector Corridor");
        req1.setReporterName("Civil Defence Drill Operator (Synthetic)");
        req1.setReporterContact("+91-112-SIM-001");
        req1.setEstimatedCasualties(casualties);
        req1.setEstimatedTrapped(trapped);
        req1.setIsLifeThreatening(true);
        req1.setDetectedLanguage("hi");
        req1.setCreatedAt(Instant.now());
        req1.setUpdatedAt(Instant.now());
        drillList.add(req1);

        // Incident 2: Infrastructure / Evacuation corridor blocked
        EmergencyRequestEntity req2 = new EmergencyRequestEntity();
        String id2 = "req-sim-" + UUID.randomUUID().toString().substring(0, 8);
        req2.setId(id2);
        req2.setTrackingCode("REQ-SIM-" + ((System.currentTimeMillis() + 101) % 100000));
        req2.setTitle("DRILL: Transit Highway Severed & Evacuation Route Blocked");
        req2.setDescription(String.format("SIMULATED DISPATCH NOTICE: Primary transit arterial blocked by secondary hazard debris. 6 passenger vehicles stranded, 2 medical emergency transit requests waiting.", riskType.name()));
        req2.setIncidentType(riskType.name());
        req2.setPriorityScore(BigDecimal.valueOf(82.0));
        req2.setPriorityLevel(PriorityLevel.HIGH);
        req2.setCategory(RequestCategory.PROPERTY_DAMAGE);
        req2.setStatus(RequestStatus.REPORTED);
        req2.setZoneId(zoneId);
        req2.setLatitude(BigDecimal.valueOf(lat - 0.0095));
        req2.setLongitude(BigDecimal.valueOf(lon - 0.0080));
        req2.setAddress("Drill Site Bravo, Highway Sector Junction");
        req2.setReporterName("Traffic Warden Volunteer (Synthetic)");
        req2.setReporterContact("+91-112-SIM-002");
        req2.setEstimatedCasualties(1);
        req2.setEstimatedTrapped(2);
        req2.setIsLifeThreatening(false);
        req2.setDetectedLanguage("en");
        req2.setCreatedAt(Instant.now());
        req2.setUpdatedAt(Instant.now());
        drillList.add(req2);

        for (EmergencyRequestEntity r : drillList) {
            EmergencyRequestEntity saved = requestRepository.save(r);
            broadcastService.broadcastRequestEvent("REQUEST_CREATED", saved);
        }
    }

    @Transactional
    public Map<String, Object> clearSimulationData() {
        // 1. Delete simulated alerts
        List<AlertEntity> simAlerts = alertRepository.findAll().stream()
                .filter(a -> a.getSourceFeed() == FeedSource.SIMULATION || (a.getId() != null && a.getId().startsWith("alt-sim-")))
                .toList();
        int deletedAlerts = simAlerts.size();
        alertRepository.deleteAll(simAlerts);

        // 2. Delete simulated requests
        List<EmergencyRequestEntity> simRequests = requestRepository.findAll().stream()
                .filter(r -> (r.getId() != null && r.getId().startsWith("req-sim-"))
                        || (r.getTrackingCode() != null && r.getTrackingCode().contains("-SIM-"))
                        || (r.getReporterName() != null && r.getReporterName().contains("Synthetic")))
                .toList();
        int deletedRequests = simRequests.size();
        requestRepository.deleteAll(simRequests);

        // 3. Reset risk zones that were elevated by simulation
        List<RiskZoneEntity> zones = zoneRepository.findAll();
        for (RiskZoneEntity z : zones) {
            z.setRiskScore(BigDecimal.valueOf(50.0));
            z.setCurrentRiskLevel("MEDIUM");
            zoneRepository.save(z);
        }

        return Map.of(
                "success", true,
                "deletedAlerts", deletedAlerts,
                "deletedRequests", deletedRequests,
                "message", "Simulation drill sandbox successfully cleared. Live operational baseline restored."
        );
    }

    @Transactional
    public Map<String, Object> syncExternalFeeds() {
        log.info("Synchronizing multi-source disaster feeds (USGS, Open-Meteo, GloFAS, NDMA Sachet)...");

        // 1. Ingest USGS Earthquakes
        DataFeedResult<List<SeismicEvent>> seismicResult = seismicAdapter.fetchRecentEarthquakes(regionConfig.getBounds());
        int quakesIngested = 0;
        for (SeismicEvent eq : seismicResult.data()) {
            String alertId = "alt-usgs-" + eq.id();
            if (alertRepository.findById(alertId).isEmpty()) {
                double rawScore = Math.min(99.0, 45.0 + eq.magnitude() * 7.5 - Math.min(15.0, eq.depthKm() * 0.15));
                SeverityLevel sev = rawScore >= 80 ? SeverityLevel.CRITICAL : (rawScore >= 60 ? SeverityLevel.HIGH : SeverityLevel.MEDIUM);

                AlertEntity alert = new AlertEntity();
                alert.setId(alertId);
                alert.setZoneId("zone-ndma-in");
                alert.setRiskType(RiskType.EARTHQUAKE);
                alert.setSeverity(sev);
                alert.setRiskScore(BigDecimal.valueOf(rawScore).setScale(2, RoundingMode.HALF_UP));
                alert.setTitle(safeTruncate("USGS Seismic Telemetry: " + eq.title(), 950));
                alert.setSummary(String.format("Magnitude %.1f earthquake registered at depth %.1f km near %s. Tsunami Flag: %s",
                        eq.magnitude(), eq.depthKm(), eq.place(), eq.tsunamiFlag() ? "ACTIVE" : "NONE"));
                alert.setSourceFeed(FeedSource.USGS_SEISMIC);
                alert.setIsLive(seismicResult.isLive());
                alert.setDataDisclaimer(seismicResult.disclaimer());
                alert.setValidFrom(Instant.now());
                alert.setValidTo(Instant.now().plus(24, ChronoUnit.HOURS));
                alert.setIsActive(true);

                AlertEntity saved = alertRepository.save(alert);
                broadcastService.broadcastAlert(saved);
                quakesIngested++;
            }
        }

        // 2. Ingest NASA EONET Natural Events (Wildfires, Storms, Floods)
        DataFeedResult<List<NaturalEvent>> eonetResult = nasaEonetAdapter.fetchOpenEvents();
        int eonetIngested = 0;
        for (NaturalEvent ev : eonetResult.data()) {
            String alertId = "alt-eonet-" + ev.id();
            if (alertRepository.findById(alertId).isEmpty()) {
                RiskType riskType = switch (ev.category().toLowerCase()) {
                    case "wildfires" -> RiskType.FIRE;
                    case "severestorms" -> RiskType.CYCLONE;
                    case "floods" -> RiskType.FLOOD;
                    case "landslides" -> RiskType.LANDSLIDE;
                    default -> RiskType.OTHER;
                };

                double score = 75.0;
                if (ev.magnitude() != null) {
                    score = Math.min(96.0, Math.max(60.0, 50.0 + ev.magnitude() * 0.4));
                }

                AlertEntity alert = new AlertEntity();
                alert.setId(alertId);
                alert.setZoneId("zone-ndma-in");
                alert.setRiskType(riskType);
                alert.setSeverity(score >= 85 ? SeverityLevel.CRITICAL : SeverityLevel.HIGH);
                alert.setRiskScore(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP));
                alert.setTitle(safeTruncate("NASA EONET Satellite: " + ev.title(), 950));
                alert.setSummary(String.format("Natural hazard detected by NASA satellite sensors at (%.4f°N, %.4f°E). Category: %s. Event date: %s",
                        ev.latitude(), ev.longitude(), ev.categoryTitle(), ev.date()));
                alert.setSourceFeed(FeedSource.NASA_EONET);
                alert.setIsLive(true);
                alert.setDataDisclaimer("Live NASA Earth Observatory Natural Event Tracker (EONET v3)");
                alert.setValidFrom(Instant.now());
                alert.setValidTo(Instant.now().plus(48, ChronoUnit.HOURS));
                alert.setIsActive(true);

                AlertEntity saved = alertRepository.save(alert);
                broadcastService.broadcastAlert(saved);
                eonetIngested++;
            }
        }

        // 3. Ingest GDACS Global Disaster Alerts (UN / European Commission)
        DataFeedResult<List<GdacsAlert>> gdacsResult = gdacsAdapter.fetchActiveAlerts();
        int gdacsIngested = 0;
        for (GdacsAlert gd : gdacsResult.data()) {
            String alertId = "alt-gdacs-" + gd.id();
            if (alertRepository.findById(alertId).isEmpty()) {
                SeverityLevel sev = "Red".equalsIgnoreCase(gd.alertLevel()) ? SeverityLevel.CRITICAL
                        : ("Orange".equalsIgnoreCase(gd.alertLevel()) ? SeverityLevel.HIGH : SeverityLevel.MEDIUM);

                RiskType rt = switch (gd.eventType().toUpperCase()) {
                    case "FL" -> RiskType.FLOOD;
                    case "TC" -> RiskType.CYCLONE;
                    case "EQ" -> RiskType.EARTHQUAKE;
                    default -> RiskType.OTHER;
                };

                AlertEntity alert = new AlertEntity();
                alert.setId(alertId);
                alert.setZoneId("zone-ndma-in");
                alert.setRiskType(rt);
                alert.setSeverity(sev);
                alert.setRiskScore(sev == SeverityLevel.CRITICAL ? BigDecimal.valueOf(94.00) : (sev == SeverityLevel.HIGH ? BigDecimal.valueOf(76.00) : BigDecimal.valueOf(55.00)));
                alert.setTitle(safeTruncate("GDACS Global Alert: " + gd.title(), 950));
                alert.setSummary(gd.description() != null ? gd.description() : "Global disaster telemetry alert recorded by GDACS.");
                alert.setSourceFeed(FeedSource.GDACS);
                alert.setIsLive(true);
                alert.setDataDisclaimer("Live GDACS UN / EC Multi-Hazard RSS Feed");
                alert.setValidFrom(Instant.now());
                alert.setValidTo(Instant.now().plus(48, ChronoUnit.HOURS));
                alert.setIsActive(true);

                AlertEntity saved = alertRepository.save(alert);
                broadcastService.broadcastAlert(saved);
                gdacsIngested++;
            }
        }

        // 4. Ingest NDMA Sachet Bulletins
        DataFeedResult<List<GovernmentAlertItem>> ndmaResult = governmentAlertAdapter.fetchActiveAlerts();
        int ndmaIngested = 0;
        for (GovernmentAlertItem item : ndmaResult.data()) {
            String alertId = "alt-gov-" + Math.abs(item.identifier().hashCode());
            if (alertRepository.findById(alertId).isEmpty()) {
                SeverityLevel sev = "CRITICAL".equalsIgnoreCase(item.severity()) ? SeverityLevel.CRITICAL : SeverityLevel.HIGH;
                AlertEntity alert = new AlertEntity();
                alert.setId(alertId);
                alert.setZoneId("zone-ndma-in");
                alert.setRiskType(RiskType.FLOOD);
                alert.setSeverity(sev);
                alert.setRiskScore(sev == SeverityLevel.CRITICAL ? BigDecimal.valueOf(92.00) : BigDecimal.valueOf(78.00));
                alert.setTitle(safeTruncate("Official Bulletin: " + item.headline(), 950));
                alert.setSummary(item.description() != null ? item.description() : "NDMA Public Hazard Bulletin.");
                alert.setSourceFeed(FeedSource.NDMA_SACHET);
                alert.setIsLive(ndmaResult.isLive());
                alert.setDataDisclaimer(ndmaResult.disclaimer());
                alert.setValidFrom(Instant.now());
                alert.setValidTo(Instant.now().plus(12, ChronoUnit.HOURS));
                alert.setIsActive(true);

                AlertEntity saved = alertRepository.save(alert);
                broadcastService.broadcastAlert(saved);
                ndmaIngested++;
            }
        }

        // 5. Purge any non-live mock alerts (keep only simulation drills created by user)
        List<AlertEntity> existing = alertRepository.findAll();
        for (AlertEntity a : existing) {
            if (!a.getIsLive() && a.getSourceFeed() != FeedSource.SIMULATION) {
                alertRepository.delete(a);
            }
        }

        return Map.of(
                "status", "SUCCESS",
                "seismicIngested", quakesIngested,
                "eonetIngested", eonetIngested,
                "gdacsIngested", gdacsIngested,
                "governmentAlertsIngested", ndmaIngested,
                "timestamp", Instant.now().toString()
        );
    }

    private String safeTruncate(String str, int maxLen) {
        if (str == null) return "";
        String trimmed = str.strip();
        return trimmed.length() <= maxLen ? trimmed : trimmed.substring(0, maxLen - 3) + "...";
    }
}
