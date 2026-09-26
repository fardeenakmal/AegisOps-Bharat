package com.aegisops.platform.controller;

import com.aegisops.platform.entity.AlertEntity;
import com.aegisops.platform.entity.AuditLogEntity;
import com.aegisops.platform.enums.FeedSource;
import com.aegisops.platform.enums.RiskType;
import com.aegisops.platform.enums.SeverityLevel;
import com.aegisops.platform.repository.AlertRepository;
import com.aegisops.platform.repository.AuditLogRepository;
import com.aegisops.platform.service.AlertBroadcastService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class AlertController {

    private final AlertRepository alertRepository;
    private final AlertBroadcastService broadcastService;
    private final AuditLogRepository auditLogRepository;

    public AlertController(
            AlertRepository alertRepository,
            AlertBroadcastService broadcastService,
            AuditLogRepository auditLogRepository) {
        this.alertRepository = alertRepository;
        this.broadcastService = broadcastService;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<AlertEntity>> getAlerts() {
        return ResponseEntity.ok(alertRepository.findByIsActiveTrueOrderByRiskScoreDescCreatedAtDesc());
    }

    @PostMapping({"/alerts/broadcast", "/cap/broadcast"})
    public ResponseEntity<?> broadcastAlert(@RequestBody Map<String, Object> body) {
        try {
            String zoneId = (String) body.getOrDefault("zoneId", "zone-ndma-in");
            String headline = (String) body.getOrDefault("headline", "Emergency Alert");
            String description = (String) body.getOrDefault("description", "Safety advisory issued.");
            String sevStr = (String) body.getOrDefault("severity", "CRITICAL");
            SeverityLevel severity = SeverityLevel.valueOf(sevStr.toUpperCase());

            AlertEntity alert = new AlertEntity();
            alert.setId("alt-bcast-" + UUID.randomUUID().toString().substring(0, 8));
            alert.setZoneId(zoneId);
            alert.setRiskType(RiskType.URBAN_INUNDATION);
            alert.setSeverity(severity);
            alert.setRiskScore(severity == SeverityLevel.CRITICAL ? BigDecimal.valueOf(95.0) : BigDecimal.valueOf(75.0));
            alert.setTitle(headline);
            alert.setSummary(description);
            alert.setSourceFeed(FeedSource.SIMULATION);
            alert.setIsLive(false);
            alert.setDataDisclaimer("Civil Defense Broadcast (Operator Originated)");
            alert.setValidFrom(Instant.now());
            alert.setValidTo(Instant.now().plus(24, ChronoUnit.HOURS));
            alert.setIsActive(true);

            AlertEntity saved = alertRepository.save(alert);
            broadcastService.broadcastAlert(saved);

            return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "broadcast", saved,
                    "alert", saved,
                    "message", "Emergency broadcast pushed to national dashboards and cell towers."
            ));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogEntity>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findTop100ByOrderByCreatedAtDesc());
    }
}

