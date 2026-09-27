package com.aegisops.platform.service;

import com.aegisops.platform.adapter.DataFeedResult;
import com.aegisops.platform.adapter.EmergencyFacility;
import com.aegisops.platform.adapter.OverpassOsmAdapter;
import com.aegisops.platform.entity.AuditLogEntity;
import com.aegisops.platform.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class HospitalCapacityService {

    private static final Logger log = LoggerFactory.getLogger(HospitalCapacityService.class);

    private final OverpassOsmAdapter overpassOsmAdapter;
    private final AlertBroadcastService broadcastService;
    private final AuditLogRepository auditLogRepository;

    // Cache of active facilities and overrides
    private final Map<String, EmergencyFacility> facilityRegistry = new ConcurrentHashMap<>();
    private final Map<String, HospitalOverride> overrides = new ConcurrentHashMap<>();

    public record HospitalOverride(
            Integer availableBeds,
            Integer availableIcuBeds,
            Integer totalBeds,
            Integer totalIcuBeds,
            Boolean massCasualtyMode,
            String lastUpdatedBy,
            java.time.Instant updatedAt
    ) {}

    public HospitalCapacityService(
            OverpassOsmAdapter overpassOsmAdapter,
            AlertBroadcastService broadcastService,
            AuditLogRepository auditLogRepository) {
        this.overpassOsmAdapter = overpassOsmAdapter;
        this.broadcastService = broadcastService;
        this.auditLogRepository = auditLogRepository;
    }

    public List<EmergencyFacility> getHospitals(double lat, double lon, int radiusMeters) {
        DataFeedResult<List<EmergencyFacility>> result = overpassOsmAdapter.fetchHospitals(lat, lon, radiusMeters);
        List<EmergencyFacility> baseList = result.data();

        List<EmergencyFacility> merged = new ArrayList<>();
        for (EmergencyFacility f : baseList) {
            facilityRegistry.put(f.id(), f);
            if (overrides.containsKey(f.id())) {
                merged.add(applyOverride(f, overrides.get(f.id())));
            } else {
                merged.add(f);
            }
        }

        // Include any overrides that might belong to this sector but weren't in base list
        for (Map.Entry<String, HospitalOverride> entry : overrides.entrySet()) {
            String id = entry.getKey();
            if (baseList.stream().noneMatch(f -> f.id().equals(id)) && facilityRegistry.containsKey(id)) {
                merged.add(applyOverride(facilityRegistry.get(id), entry.getValue()));
            }
        }

        return merged;
    }

    public Optional<EmergencyFacility> getHospitalById(String id) {
        EmergencyFacility f = facilityRegistry.get(id);
        if (f == null) {
            // Check overrides
            if (overrides.containsKey(id)) {
                return Optional.ofNullable(applyOverride(facilityRegistry.get(id), overrides.get(id)));
            }
            return Optional.empty();
        }
        if (overrides.containsKey(id)) {
            return Optional.of(applyOverride(f, overrides.get(id)));
        }
        return Optional.of(f);
    }

    public EmergencyFacility updateCapacity(
            String id,
            Integer availableBeds,
            Integer availableIcuBeds,
            Integer totalBeds,
            Integer totalIcuBeds,
            Boolean massCasualtyMode,
            String updatedBy,
            String reason
    ) {
        EmergencyFacility base = facilityRegistry.get(id);
        if (base == null) {
            // If not found in cache, construct placeholder or try default
            base = new EmergencyFacility(
                    id, "Emergency Hospital (" + id + ")", "TRAUMA_LEVEL_1",
                    19.0760, 72.8777,
                    totalBeds != null ? totalBeds : 500,
                    availableBeds != null ? availableBeds : 50,
                    totalIcuBeds != null ? totalIcuBeds : 80,
                    availableIcuBeds != null ? availableIcuBeds : 10,
                    massCasualtyMode != null && massCasualtyMode,
                    "Emergency Medical District", "+91-108"
            );
            facilityRegistry.put(id, base);
        }

        HospitalOverride currentOverride = overrides.get(id);
        int finalTotalBeds = totalBeds != null ? totalBeds : (currentOverride != null && currentOverride.totalBeds() != null ? currentOverride.totalBeds() : base.totalBeds());
        int finalAvailBeds = availableBeds != null ? availableBeds : (currentOverride != null && currentOverride.availableBeds() != null ? currentOverride.availableBeds() : base.availableBeds());
        int finalTotalIcu = totalIcuBeds != null ? totalIcuBeds : (currentOverride != null && currentOverride.totalIcuBeds() != null ? currentOverride.totalIcuBeds() : base.totalIcuBeds());
        int finalAvailIcu = availableIcuBeds != null ? availableIcuBeds : (currentOverride != null && currentOverride.availableIcuBeds() != null ? currentOverride.availableIcuBeds() : base.availableIcuBeds());
        boolean finalMci = massCasualtyMode != null ? massCasualtyMode : (currentOverride != null && currentOverride.massCasualtyMode() != null ? currentOverride.massCasualtyMode() : base.massCasualtyMode());

        HospitalOverride newOverride = new HospitalOverride(
                finalAvailBeds,
                finalAvailIcu,
                finalTotalBeds,
                finalTotalIcu,
                finalMci,
                updatedBy != null ? updatedBy : "DISPATCH_OPERATOR",
                java.time.Instant.now()
        );
        overrides.put(id, newOverride);

        EmergencyFacility updatedFacility = applyOverride(base, newOverride);
        facilityRegistry.put(id, updatedFacility);

        // Record Audit Log
        try {
            String auditId = "aud-hosp-" + UUID.randomUUID().toString().substring(0, 8);
            String action = Boolean.TRUE.equals(massCasualtyMode) ? "MCI_PROTOCOL_ACTIVATED" : "HOSPITAL_CAPACITY_UPDATED";
            AuditLogEntity logEntry = new AuditLogEntity(
                    auditId,
                    "HOSPITAL",
                    id,
                    action,
                    updatedBy != null ? updatedBy : "OPERATOR",
                    updatedFacility.name(),
                    reason != null ? reason : "Live bed/ICU capacity adjustment in AegisOps EOC"
            );
            logEntry.setNewValue(String.format("{\"availableBeds\":%d,\"availableIcuBeds\":%d,\"massCasualtyMode\":%b}",
                    finalAvailBeds, finalAvailIcu, finalMci));
            auditLogRepository.save(logEntry);
        } catch (Exception ex) {
            log.warn("Failed to write audit log for hospital capacity update: {}", ex.getMessage());
        }

        // Broadcast to WebSocket clients on /topic/hospitals
        broadcastService.broadcastHospitalCapacity(updatedFacility);

        return updatedFacility;
    }

    private EmergencyFacility applyOverride(EmergencyFacility base, HospitalOverride override) {
        if (override == null) return base;
        return new EmergencyFacility(
                base.id(),
                base.name(),
                base.type(),
                base.latitude(),
                base.longitude(),
                override.totalBeds() != null ? override.totalBeds() : base.totalBeds(),
                override.availableBeds() != null ? override.availableBeds() : base.availableBeds(),
                override.totalIcuBeds() != null ? override.totalIcuBeds() : base.totalIcuBeds(),
                override.availableIcuBeds() != null ? override.availableIcuBeds() : base.availableIcuBeds(),
                override.massCasualtyMode() != null ? override.massCasualtyMode() : base.massCasualtyMode(),
                base.address(),
                base.contactPhone()
        );
    }
}
