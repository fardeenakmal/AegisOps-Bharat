package com.aegisops.platform.controller;

import com.aegisops.platform.adapter.DataFeedResult;
import com.aegisops.platform.adapter.RoutingAdapter;
import com.aegisops.platform.adapter.TacticalRoute;
import com.aegisops.platform.dto.SuggestedTeamDto;
import com.aegisops.platform.entity.AssignmentEntity;
import com.aegisops.platform.entity.ResponseTeamEntity;
import com.aegisops.platform.enums.AssignmentStatus;
import com.aegisops.platform.enums.TeamStatus;
import com.aegisops.platform.enums.TeamType;
import com.aegisops.platform.service.CoordinationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CoordinationController {

    private final CoordinationService coordinationService;
    private final RoutingAdapter routingAdapter;

    public CoordinationController(CoordinationService coordinationService, RoutingAdapter routingAdapter) {
        this.coordinationService = coordinationService;
        this.routingAdapter = routingAdapter;
    }

    // List response fleet units (supports both /api/teams and /api/resources)
    @GetMapping({"/teams", "/resources"})
    public ResponseEntity<List<ResponseTeamEntity>> getTeams(
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) TeamType type,
            @RequestParam(required = false) TeamStatus status
    ) {
        List<ResponseTeamEntity> list = coordinationService.getTeams(zone, type, status);
        return ResponseEntity.ok(list);
    }

    // Suggested nearest teams with OSRM road ETAs
    @GetMapping({"/teams/suggested/{id}", "/resources/suggested/{id}"})
    public ResponseEntity<List<SuggestedTeamDto>> getSuggestedTeams(@PathVariable String id) {
        try {
            List<SuggestedTeamDto> suggested = coordinationService.getSuggestedTeamsForRequest(id);
            return ResponseEntity.ok(suggested);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Dispatch team to emergency request
    @PostMapping({"/requests/{id}/dispatch", "/incidents/{id}/dispatch"})
    public ResponseEntity<?> dispatchTeam(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            String teamId = body.getOrDefault("teamId", body.get("resourceId"));
            if (teamId == null || teamId.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "teamId is required"));
            }

            AssignmentEntity assignment = coordinationService.dispatchTeam(
                    id,
                    teamId,
                    body.get("assignedByUserId"),
                    body.get("customTaskBrief")
            );

            return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "dispatch", assignment,
                    "assignment", assignment,
                    "message", "Tactical unit dispatched with active turn-by-turn routing."
            ));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // Update team / responder status
    @PatchMapping({"/teams/{id}/status", "/resources/{id}/status"})
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            String dispatchId = (String) body.get("dispatchId");
            String statusStr = (String) body.get("status");
            String notes = (String) body.get("notes");

            if (dispatchId != null && !dispatchId.isBlank()) {
                AssignmentStatus status = AssignmentStatus.valueOf(statusStr.toUpperCase());
                AssignmentEntity updated = coordinationService.updateAssignmentStatus(dispatchId, status, notes);
                return ResponseEntity.ok(updated);
            }

            return ResponseEntity.ok(Map.of("status", "SUCCESS", "unitId", id));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // Tactical Road Route Query
    @GetMapping("/routes/tactical")
    public ResponseEntity<?> getTacticalRoute(
            @RequestParam double originLat,
            @RequestParam double originLon,
            @RequestParam double destLat,
            @RequestParam double destLon
    ) {
        DataFeedResult<TacticalRoute> result = routingAdapter.calculateEmergencyRoute(originLat, originLon, destLat, destLon);
        return ResponseEntity.ok(result.data());
    }
}

