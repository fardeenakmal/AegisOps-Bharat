package com.aegisops.platform.controller;

import com.aegisops.platform.dto.EmergencyRequestInput;
import com.aegisops.platform.dto.OverrideInput;
import com.aegisops.platform.entity.EmergencyRequestEntity;
import com.aegisops.platform.enums.PriorityLevel;
import com.aegisops.platform.enums.RequestStatus;
import com.aegisops.platform.service.EmergencyRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class EmergencyRequestController {

    private final EmergencyRequestService requestService;

    public EmergencyRequestController(EmergencyRequestService requestService) {
        this.requestService = requestService;
    }

    // Intake citizen request / report (supports both /api/requests and /api/reports)
    @PostMapping({"/requests", "/reports"})
    public ResponseEntity<?> submitEmergencyRequest(@RequestBody Map<String, Object> body) {
        try {
            String rawText = String.valueOf(body.getOrDefault("rawText", body.getOrDefault("description", "")));
            BigDecimal lat = body.get("latitude") != null ? new BigDecimal(String.valueOf(body.get("latitude"))) : null;
            BigDecimal lon = body.get("longitude") != null ? new BigDecimal(String.valueOf(body.get("longitude"))) : null;

            if (rawText.isBlank() || lat == null || lon == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "rawText, latitude, and longitude are required"));
            }

            EmergencyRequestInput input = new EmergencyRequestInput(
                    (String) body.get("title"),
                    (String) body.get("description"),
                    rawText,
                    lat,
                    lon,
                    (String) body.get("reportedAddress"),
                    (String) body.get("reporterName"),
                    (String) body.get("reporterContact"),
                    (String) body.get("zoneId"),
                    (String) body.get("incidentType"),
                    null,
                    body.get("estimatedCasualties") instanceof Number n ? n.intValue() : null,
                    body.get("estimatedTrapped") instanceof Number n ? n.intValue() : null,
                    Boolean.TRUE.equals(body.get("isLifeThreatening"))
            );

            EmergencyRequestEntity created = requestService.submitRequest(input);

            return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "trackingId", created.getTrackingCode(),
                    "request", created,
                    "incident", created,
                    "report", Map.of(
                            "id", "rep-" + created.getId(),
                            "trackingId", created.getTrackingCode(),
                            "incidentId", created.getId(),
                            "status", "VERIFIED"
                    ),
                    "isDuplicate", false,
                    "message", "Emergency request verified, triaged, and ingested into national command queue."
            ));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // Dashboard incident feed (supports both /api/incidents and /api/requests)
    @GetMapping({"/incidents", "/requests"})
    public ResponseEntity<List<EmergencyRequestEntity>> getRequests(
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) PriorityLevel severity,
            @RequestParam(required = false) String type
    ) {
        List<EmergencyRequestEntity> list = requestService.getRequests(zone, status, severity, type);
        return ResponseEntity.ok(list);
    }

    // Single incident detail
    @GetMapping({"/incidents/{id}", "/requests/{id}"})
    public ResponseEntity<?> getRequestById(@PathVariable String id) {
        return requestService.getRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Tracking status check by tracking code
    @GetMapping("/reports/{trackingCode}/status")
    public ResponseEntity<?> getReportStatus(@PathVariable String trackingCode) {
        return requestService.getRequestByTrackingCode(trackingCode)
                .map(req -> ResponseEntity.ok(Map.of(
                        "report", Map.of(
                                "trackingId", req.getTrackingCode(),
                                "incidentId", req.getId(),
                                "status", "VERIFIED"
                        ),
                        "incident", req,
                        "incidentStatus", req.getStatus().name(),
                        "priorityLevel", req.getPriorityLevel().name(),
                        "etaMinutes", req.getSlaTargetMinutes()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    // Dispatcher Manual Override
    @PatchMapping({"/incidents/{id}", "/requests/{id}"})
    public ResponseEntity<?> manualOverride(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            String reason = (String) body.get("overrideReason");
            if (reason == null || reason.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "An overrideReason is required for audit integrity"));
            }

            BigDecimal score = body.get("severityScore") != null ? new BigDecimal(String.valueOf(body.get("severityScore")))
                    : (body.get("priorityScore") != null ? new BigDecimal(String.valueOf(body.get("priorityScore"))) : null);

            PriorityLevel level = null;
            if (body.get("severityLabel") != null) {
                level = PriorityLevel.valueOf(String.valueOf(body.get("severityLabel")).toUpperCase());
            } else if (body.get("priorityLevel") != null) {
                level = PriorityLevel.valueOf(String.valueOf(body.get("priorityLevel")).toUpperCase());
            }

            RequestStatus status = null;
            if (body.get("status") != null) {
                status = RequestStatus.valueOf(String.valueOf(body.get("status")).toUpperCase());
            }

            OverrideInput override = new OverrideInput(
                    score,
                    level,
                    null,
                    status,
                    reason,
                    (String) body.get("actorId"),
                    (String) body.get("actorName")
            );

            EmergencyRequestEntity updated = requestService.manualOverride(id, override);
            return ResponseEntity.ok(updated);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}

