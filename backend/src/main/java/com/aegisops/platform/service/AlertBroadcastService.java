package com.aegisops.platform.service;

import com.aegisops.platform.entity.AlertEntity;
import com.aegisops.platform.entity.AssignmentEntity;
import com.aegisops.platform.entity.EmergencyRequestEntity;
import com.aegisops.platform.entity.ResponseTeamEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class AlertBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(AlertBroadcastService.class);
    private final SimpMessagingTemplate messagingTemplate;

    public AlertBroadcastService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastAlert(AlertEntity alert) {
        try {
            Map<String, Object> payload = Map.of(
                    "type", "ALERT_ISSUED",
                    "timestamp", Instant.now().toString(),
                    "data", alert
            );
            messagingTemplate.convertAndSend("/topic/alerts", payload);
            if (alert.getZoneId() != null) {
                messagingTemplate.convertAndSend("/topic/zones/" + alert.getZoneId(), payload);
            }
        } catch (Exception ex) {
            log.warn("STOMP broadcast alert error: {}", ex.getMessage());
        }
    }

    public void broadcastRequestEvent(String eventType, EmergencyRequestEntity request) {
        try {
            Map<String, Object> payload = Map.of(
                    "type", eventType,
                    "timestamp", Instant.now().toString(),
                    "data", request
            );
            messagingTemplate.convertAndSend("/topic/requests", payload);
            if (request.getZoneId() != null) {
                messagingTemplate.convertAndSend("/topic/zones/" + request.getZoneId(), payload);
            }
            if ("CRITICAL".equalsIgnoreCase(request.getPriorityLevel().name())) {
                messagingTemplate.convertAndSend("/topic/alerts", Map.of(
                        "type", "CRITICAL_REQUEST_INTAKE",
                        "timestamp", Instant.now().toString(),
                        "data", request
                ));
            }
        } catch (Exception ex) {
            log.warn("STOMP broadcast request error: {}", ex.getMessage());
        }
    }

    public void broadcastTeamStatus(ResponseTeamEntity team, AssignmentEntity assignment) {
        try {
            Map<String, Object> payload = Map.of(
                    "type", "TEAM_STATUS_CHANGED",
                    "timestamp", Instant.now().toString(),
                    "data", Map.of(
                            "team", team,
                            "assignment", assignment != null ? assignment : Map.of()
                    )
            );
            messagingTemplate.convertAndSend("/topic/teams", payload);
        } catch (Exception ex) {
            log.warn("STOMP broadcast team error: {}", ex.getMessage());
        }
    }
}

