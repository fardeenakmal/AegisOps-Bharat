package com.aegisops.platform.dto;

import com.aegisops.platform.enums.RequestCategory;
import java.math.BigDecimal;

public record EmergencyRequestInput(
        String title,
        String description,
        String rawText,
        BigDecimal latitude,
        BigDecimal longitude,
        String reportedAddress,
        String reporterName,
        String reporterContact,
        String zoneId,
        String incidentType,
        RequestCategory category,
        Integer estimatedCasualties,
        Integer estimatedTrapped,
        Boolean isLifeThreatening
) {}

