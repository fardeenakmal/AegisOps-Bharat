package com.aegisops.platform.service;

import com.aegisops.platform.adapter.GeocodingAdapter;
import com.aegisops.platform.dto.EmergencyRequestInput;
import com.aegisops.platform.dto.OverrideInput;
import com.aegisops.platform.entity.AuditLogEntity;
import com.aegisops.platform.entity.EmergencyRequestEntity;
import com.aegisops.platform.enums.PriorityLevel;
import com.aegisops.platform.enums.RequestCategory;
import com.aegisops.platform.enums.RequestStatus;
import com.aegisops.platform.repository.AuditLogRepository;
import com.aegisops.platform.repository.EmergencyRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmergencyRequestService {

    private final EmergencyRequestRepository requestRepository;
    private final PriorityScoringEngine priorityScoringEngine;
    private final MultilingualTriageService triageService;
    private final GeocodingAdapter geocodingAdapter;
    private final AlertBroadcastService broadcastService;
    private final AuditLogRepository auditLogRepository;

    public EmergencyRequestService(
            EmergencyRequestRepository requestRepository,
            PriorityScoringEngine priorityScoringEngine,
            MultilingualTriageService triageService,
            GeocodingAdapter geocodingAdapter,
            AlertBroadcastService broadcastService,
            AuditLogRepository auditLogRepository) {
        this.requestRepository = requestRepository;
        this.priorityScoringEngine = priorityScoringEngine;
        this.triageService = triageService;
        this.geocodingAdapter = geocodingAdapter;
        this.broadcastService = broadcastService;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public EmergencyRequestEntity submitRequest(EmergencyRequestInput input) {
        String id = "req-" + UUID.randomUUID().toString().substring(0, 8);
        String trackingCode = "REQ-IND-" + (1000 + (int)(Math.random() * 9000));

        String rawText = input.rawText() != null ? input.rawText() : input.description();
        if (rawText == null) rawText = "";

        // 1. Multilingual Triage (Indic normalization & entity extraction)
        MultilingualTriageService.TriageResult triage = triageService.processText(rawText);

        String effectiveType = input.incidentType() != null && !input.incidentType().isBlank()
                ? input.incidentType() : triage.incidentType();

        int casualties = input.estimatedCasualties() != null ? input.estimatedCasualties() : triage.estimatedCasualties();
        int trapped = input.estimatedTrapped() != null ? input.estimatedTrapped() : triage.estimatedTrapped();
        boolean isLifeThreatening = (input.isLifeThreatening() != null && input.isLifeThreatening()) || triage.isLifeThreatening();

        RequestCategory category = input.category() != null ? input.category() : triage.category();

        // 2. Auto-Priority Scoring Engine
        PriorityScoringEngine.ScoringResult scoring = priorityScoringEngine.evaluatePriority(
                effectiveType, category, 1, casualties, trapped, isLifeThreatening
        );

        // 3. Address resolution
        String address = input.reportedAddress();
        if ((address == null || address.isBlank() || address.contains("Coordinates:")) && input.latitude() != null && input.longitude() != null) {
            address = geocodingAdapter.reverseGeocode(input.latitude().doubleValue(), input.longitude().doubleValue()).data().displayName();
        }
        if (address == null || address.isBlank()) {
            address = String.format("%.4f°N, %.4f°E", input.latitude(), input.longitude());
        }

        String title = input.title();
        if (title == null || title.isBlank()) {
            title = effectiveType + " Emergency reported at " + (address.length() > 50 ? address.substring(0, 50) + "..." : address);
        }

        EmergencyRequestEntity entity = new EmergencyRequestEntity();
        entity.setId(id);
        entity.setTrackingCode(trackingCode);
        entity.setTitle(title);
        entity.setDescription(rawText);
        entity.setIncidentType(effectiveType);
        entity.setPriorityScore(scoring.priorityScore());
        entity.setPriorityLevel(scoring.priorityLevel());
        entity.setCategory(scoring.category());
        entity.setStatus(RequestStatus.REPORTED);
        entity.setZoneId(input.zoneId() != null ? input.zoneId() : "zone-mh-mum");
        entity.setLatitude(input.latitude() != null ? input.latitude() : BigDecimal.valueOf(19.0760));
        entity.setLongitude(input.longitude() != null ? input.longitude() : BigDecimal.valueOf(72.8777));
        entity.setAddress(address);
        entity.setReporterName(input.reporterName() != null ? input.reporterName() : "Citizen Reporter");
        entity.setReporterContact(input.reporterContact());
        entity.setEstimatedCasualties(casualties);
        entity.setEstimatedTrapped(trapped);
        entity.setIsLifeThreatening(isLifeThreatening);
        entity.setDetectedLanguage(triage.detectedLanguage());
        entity.setSlaTargetMinutes(scoring.slaTargetMinutes());
        entity.setSlaDeadline(Instant.now().plus(scoring.slaTargetMinutes(), ChronoUnit.MINUTES));
        entity.setReportedAt(Instant.now());
        entity.setNeedsSummary(String.format("{\"rationale\": \"%s\"}", scoring.scoringRationale()));

        EmergencyRequestEntity saved = requestRepository.save(entity);

        // 4. Real-time STOMP Broadcast
        broadcastService.broadcastRequestEvent("REQUEST_CREATED", saved);

        return saved;
    }

    public List<EmergencyRequestEntity> getRequests(String zoneId, RequestStatus status, PriorityLevel priorityLevel, String incidentType) {
        return requestRepository.findFiltered(zoneId, status, priorityLevel, incidentType);
    }

    public Optional<EmergencyRequestEntity> getRequestById(String id) {
        return requestRepository.findById(id);
    }

    public Optional<EmergencyRequestEntity> getRequestByTrackingCode(String trackingCode) {
        return requestRepository.findByTrackingCode(trackingCode);
    }

    @Transactional
    public EmergencyRequestEntity manualOverride(String id, OverrideInput override) {
        EmergencyRequestEntity entity = requestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + id));

        String prevVal = String.format("{\"score\": %s, \"level\": \"%s\", \"status\": \"%s\"}",
                entity.getPriorityScore(), entity.getPriorityLevel(), entity.getStatus());

        if (override.priorityScore() != null) entity.setPriorityScore(override.priorityScore());
        if (override.priorityLevel() != null) entity.setPriorityLevel(override.priorityLevel());
        if (override.category() != null) entity.setCategory(override.category());
        if (override.status() != null) entity.setStatus(override.status());

        entity.setManualOverride(true);
        entity.setOverrideReason(override.overrideReason() != null ? override.overrideReason() : "Dispatcher Manual Triage Override");
        entity.setOverriddenBy(override.actorName() != null ? override.actorName() : "Operator");

        EmergencyRequestEntity updated = requestRepository.save(entity);

        // Audit Trail
        AuditLogEntity audit = new AuditLogEntity(
                "audit-" + UUID.randomUUID().toString().substring(0, 8),
                "EMERGENCY_REQUEST",
                id,
                "MANUAL_OVERRIDE",
                override.actorId() != null ? override.actorId() : "dispatcher",
                override.actorName() != null ? override.actorName() : "Dispatcher",
                override.overrideReason()
        );
        audit.setPreviousValue(prevVal);
        audit.setNewValue(String.format("{\"score\": %s, \"level\": \"%s\", \"status\": \"%s\"}",
                updated.getPriorityScore(), updated.getPriorityLevel(), updated.getStatus()));
        auditLogRepository.save(audit);

        broadcastService.broadcastRequestEvent("REQUEST_OVERRIDDEN", updated);

        return updated;
    }
}

