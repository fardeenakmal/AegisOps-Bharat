package com.aegisops.platform.service;

import com.aegisops.platform.enums.PriorityLevel;
import com.aegisops.platform.enums.RequestCategory;

import java.math.BigDecimal;

public interface PriorityScoringEngine {

    record ScoringResult(
            BigDecimal priorityScore,
            PriorityLevel priorityLevel,
            RequestCategory category,
            int slaTargetMinutes,
            String scoringRationale
    ) {}

    ScoringResult evaluatePriority(
            String incidentType,
            RequestCategory requestedCategory,
            int reportCount,
            int estimatedCasualties,
            int estimatedTrapped,
            boolean lifeThreatening
    );
}

