package com.aegisops.platform.dto;

import com.aegisops.platform.enums.RiskType;

public record SimulationInput(
        String zoneId,
        RiskType riskType,
        Double windSpeedKmh,
        Double precipitationMmHr,
        Double riverGaugeSurgePercent,
        Double latitude,
        Double longitude
) {}

