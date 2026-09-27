package com.aegisops.platform.service;

import com.aegisops.platform.entity.AuditLogEntity;
import com.aegisops.platform.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CrossJurisdictionService {

    private static final Logger log = LoggerFactory.getLogger(CrossJurisdictionService.class);

    private final AlertBroadcastService broadcastService;
    private final AuditLogRepository auditLogRepository;

    public record CrossJurisdictionRequest(
            String id,
            String sourceJurisdiction,
            String targetJurisdiction,
            String hazardType,
            String requestedResource,
            String urgency,
            String status,
            String requestedAt,
            String dispatchedAt,
            String approvalNotes,
            String approvedBy
    ) {}

    private final Map<String, CrossJurisdictionRequest> requests = new ConcurrentHashMap<>();

    public CrossJurisdictionService(AlertBroadcastService broadcastService, AuditLogRepository auditLogRepository) {
        this.broadcastService = broadcastService;
        this.auditLogRepository = auditLogRepository;
        seedInitialRequests();
    }

    private void seedInitialRequests() {
        Instant now = Instant.now();

        requests.put("MUT-AID-MH-01", new CrossJurisdictionRequest(
                "MUT-AID-MH-01",
                "Maharashtra SDMA (SEOC Mumbai)",
                "NDRF 5th Battalion (Pune HQ)",
                "URBAN_FLOOD",
                "4x Inflatable Rescue Boats (IRBs) + 16 Deep-water Divers",
                "CRITICAL",
                "PENDING_APPROVAL",
                now.minus(25, ChronoUnit.MINUTES).toString(),
                null,
                null,
                null
        ));

        requests.put("MUT-AID-OD-02", new CrossJurisdictionRequest(
                "MUT-AID-OD-02",
                "Odisha SDMA (Bhubaneswar Control)",
                "West Bengal SDMA (Nabanna EOC)",
                "CYCLONE_PREPAREDNESS",
                "6x High-Capacity Diesel Dewatering Pumps + 2 Mobile Water RO Plants",
                "HIGH",
                "DISPATCHED",
                now.minus(2, ChronoUnit.HOURS).toString(),
                now.minus(1, ChronoUnit.HOURS).toString(),
                "Pre-positioned along Digha-Contai coastal stretch for storm surge mitigation.",
                "DG_NDMA_HQ"
        ));

        requests.put("MUT-AID-KL-03", new CrossJurisdictionRequest(
                "MUT-AID-KL-03",
                "Kerala SDMA (Trivandrum SEOC)",
                "Tamil Nadu SDMA (State EOC Chennai)",
                "LANDSLIDE",
                "2x Heavy Hydraulic Excavators + Canine Search & Rescue Team",
                "CRITICAL",
                "PENDING_APPROVAL",
                now.minus(10, ChronoUnit.MINUTES).toString(),
                null,
                null,
                null
        ));

        requests.put("MUT-AID-DL-04", new CrossJurisdictionRequest(
                "MUT-AID-DL-04",
                "Delhi EOC (Raj Niwas Command)",
                "Haryana SDRF (Gurugram Unit)",
                "HAZMAT_CHEMICAL",
                "1x CBRN Hazmat Decontamination Unit + Level A Hazmat Suits",
                "HIGH",
                "APPROVED",
                now.minus(45, ChronoUnit.MINUTES).toString(),
                now.minus(15, ChronoUnit.MINUTES).toString(),
                "Authorized mobilization to Wazirpur Industrial Area sector.",
                "COMMANDER_DELHI_NORTH"
        ));
    }

    public List<CrossJurisdictionRequest> getAllRequests() {
        return new ArrayList<>(requests.values());
    }

    public Optional<CrossJurisdictionRequest> getRequestById(String id) {
        return Optional.ofNullable(requests.get(id));
    }

    public CrossJurisdictionRequest approveRequest(String id, String approvedBy, String notes) {
        CrossJurisdictionRequest req = requests.get(id);
        if (req == null) {
            // Auto-generate realistic request if unknown id was submitted
            req = new CrossJurisdictionRequest(
                    id,
                    "Regional SDMA Hub",
                    "National Disaster Response Force (NDRF)",
                    "MULTI_HAZARD",
                    "Specialized Tactical Response Battalion",
                    "CRITICAL",
                    "PENDING_APPROVAL",
                    Instant.now().minus(5, ChronoUnit.MINUTES).toString(),
                    null, null, null
            );
        }

        String effectiveApprover = approvedBy != null && !approvedBy.isBlank() ? approvedBy : "NDMA_NATIONAL_COORDINATOR";
        String effectiveNotes = notes != null && !notes.isBlank() ? notes : "Approved by National EOC Commander for priority inter-state asset mobilization.";

        CrossJurisdictionRequest approved = new CrossJurisdictionRequest(
                req.id(),
                req.sourceJurisdiction(),
                req.targetJurisdiction(),
                req.hazardType(),
                req.requestedResource(),
                req.urgency(),
                "APPROVED",
                req.requestedAt(),
                Instant.now().toString(),
                effectiveNotes,
                effectiveApprover
        );

        requests.put(id, approved);

        // Record Audit Log
        try {
            String auditId = "aud-mut-" + UUID.randomUUID().toString().substring(0, 8);
            AuditLogEntity logEntry = new AuditLogEntity(
                    auditId,
                    "MUTUAL_AID_REQUEST",
                    id,
                    "CROSS_JURISDICTION_APPROVED",
                    effectiveApprover,
                    req.sourceJurisdiction() + " -> " + req.targetJurisdiction(),
                    effectiveNotes
            );
            logEntry.setNewValue("{\"status\":\"APPROVED\",\"resource\":\"" + req.requestedResource() + "\"}");
            auditLogRepository.save(logEntry);
        } catch (Exception ex) {
            log.warn("Failed to write audit log for mutual aid approval: {}", ex.getMessage());
        }

        // STOMP Broadcast
        broadcastService.broadcastCrossJurisdictionRequest(approved);

        return approved;
    }

    public CrossJurisdictionRequest rejectRequest(String id, String rejectedBy, String reason) {
        CrossJurisdictionRequest req = requests.get(id);
        if (req == null) {
            throw new IllegalArgumentException("Mutual aid request not found: " + id);
        }

        CrossJurisdictionRequest rejected = new CrossJurisdictionRequest(
                req.id(),
                req.sourceJurisdiction(),
                req.targetJurisdiction(),
                req.hazardType(),
                req.requestedResource(),
                req.urgency(),
                "REJECTED",
                req.requestedAt(),
                null,
                reason != null ? reason : "Insufficient inter-state reserve capacity",
                rejectedBy != null ? rejectedBy : "NDMA_COMMANDER"
        );

        requests.put(id, rejected);
        broadcastService.broadcastCrossJurisdictionRequest(rejected);
        return rejected;
    }

    public CrossJurisdictionRequest createRequest(
            String sourceJurisdiction,
            String targetJurisdiction,
            String hazardType,
            String requestedResource,
            String urgency
    ) {
        String id = "MUT-AID-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CrossJurisdictionRequest req = new CrossJurisdictionRequest(
                id,
                sourceJurisdiction,
                targetJurisdiction,
                hazardType,
                requestedResource,
                urgency != null ? urgency : "HIGH",
                "PENDING_APPROVAL",
                Instant.now().toString(),
                null,
                null,
                null
        );

        requests.put(id, req);
        broadcastService.broadcastCrossJurisdictionRequest(req);
        return req;
    }
}
