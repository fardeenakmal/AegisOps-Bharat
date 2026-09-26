package com.aegisops.platform.dto;

import com.aegisops.platform.enums.RiskType;

public record SimulationInput(
        String zoneId,
        RiskType riskType,
        Double windSpeedKmh,
        Double precipitationMmHr,
        Double riverGaugeSurgePercent,
        Double latitude,
        Double longitude,
        Double earthquakeMagnitude,
        Double hypocenterDepthKm,
        String scenarioName,
        String customSummary,
        Boolean injectIncidents,
        Integer estimatedCasualties,
        Integer estimatedTrapped
) {
    public SimulationInput(
            String zoneId,
            RiskType riskType,
            Double windSpeedKmh,
            Double precipitationMmHr,
            Double riverGaugeSurgePercent,
            Double latitude,
            Double longitude
    ) {
        this(zoneId, riskType, windSpeedKmh, precipitationMmHr, riverGaugeSurgePercent,
             latitude, longitude, null, null, null, null, false, 0, 0);
    }
}
