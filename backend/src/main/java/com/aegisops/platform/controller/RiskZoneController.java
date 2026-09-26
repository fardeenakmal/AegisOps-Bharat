package com.aegisops.platform.controller;

import com.aegisops.platform.dto.SimulationInput;
import com.aegisops.platform.entity.AlertEntity;
import com.aegisops.platform.entity.RiskZoneEntity;
import com.aegisops.platform.enums.RiskType;
import com.aegisops.platform.service.RiskZoneService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RiskZoneController {

    private final RiskZoneService zoneService;

    public RiskZoneController(RiskZoneService zoneService) {
        this.zoneService = zoneService;
    }

    @GetMapping("/zones")
    public ResponseEntity<List<RiskZoneEntity>> getZones() {
        return ResponseEntity.ok(zoneService.getAllZones());
    }

    @GetMapping("/predictions")
    public ResponseEntity<List<AlertEntity>> getPredictions(@RequestParam(required = false) String zone) {
        return ResponseEntity.ok(zoneService.getActiveAlerts(zone));
    }

    @PostMapping("/predictions/simulate")
    public ResponseEntity<?> simulatePrediction(@RequestBody Map<String, Object> body) {
        try {
            String zoneId = (String) body.get("zoneId");
            String riskTypeStr = (String) body.getOrDefault("riskType", "FLOOD");
            RiskType riskType = RiskType.valueOf(riskTypeStr.toUpperCase());

            Double wind = body.get("windSpeedKmh") instanceof Number n ? n.doubleValue() : null;
            Double precip = body.get("precipitationMmHr") instanceof Number n ? n.doubleValue() : null;
            Double surge = body.get("riverGaugeSurgePercent") instanceof Number n ? n.doubleValue() : null;
            Double lat = body.get("latitude") instanceof Number n ? n.doubleValue() : null;
            Double lon = body.get("longitude") instanceof Number n ? n.doubleValue() : null;

            SimulationInput input = new SimulationInput(zoneId, riskType, wind, precip, surge, lat, lon);
            AlertEntity alert = zoneService.simulateHazard(input);

            return ResponseEntity.status(201).body(alert);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}

