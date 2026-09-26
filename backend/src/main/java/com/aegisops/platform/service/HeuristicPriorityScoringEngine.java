package com.aegisops.platform.service;

import com.aegisops.platform.enums.PriorityLevel;
import com.aegisops.platform.enums.RequestCategory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * v1 Heuristic / Rules-Based Priority Scoring Engine.
 * Priority hierarchy: Life-Threatening > Property Damage > Informational.
 * Leaves a clean extension point for v2 Python/ONNX ML models.
 */
@Service
public class HeuristicPriorityScoringEngine implements PriorityScoringEngine {

    @Override
    public ScoringResult evaluatePriority(
            String incidentType,
            RequestCategory requestedCategory,
            int reportCount,
            int estimatedCasualties,
            int estimatedTrapped,
            boolean lifeThreatening
    ) {
        // 1. Determine effective category
        RequestCategory effectiveCategory = requestedCategory != null ? requestedCategory : RequestCategory.PROPERTY_DAMAGE;
        if (lifeThreatening || estimatedCasualties > 0 || estimatedTrapped > 0) {
            effectiveCategory = RequestCategory.LIFE_THREATENING;
        }

        // 2. Base weight by category and incident type
        double baseScore;
        switch (effectiveCategory) {
            case LIFE_THREATENING -> {
                baseScore = 80.0;
                if ("STRUCTURAL_COLLAPSE".equalsIgnoreCase(incidentType) || "FIRE".equalsIgnoreCase(incidentType)) {
                    baseScore = 85.0;
                } else if ("EARTHQUAKE".equalsIgnoreCase(incidentType) || "FLOOD".equalsIgnoreCase(incidentType)) {
                    baseScore = 82.0;
                }
            }
            case PROPERTY_DAMAGE -> {
                baseScore = 50.0;
                if ("FLOOD".equalsIgnoreCase(incidentType) || "CYCLONE".equalsIgnoreCase(incidentType)) {
                    baseScore = 60.0;
                }
            }
            case INFORMATIONAL -> baseScore = 20.0;
            default -> baseScore = 40.0;
        }

        // 3. Casualty impact (up to +15)
        double casualtyBoost = Math.min(15.0, estimatedCasualties * 4.0);

        // 4. Trapped victims impact (up to +15)
        double trappedBoost = Math.min(15.0, estimatedTrapped * 4.5);

        // 5. Corroboration boost (diminishing returns, up to +10)
        double corroborationBoost = Math.min(10.0, (Math.log(Math.max(1, reportCount)) / Math.log(2)) * 3.5);

        double totalRaw = baseScore + casualtyBoost + trappedBoost + corroborationBoost;
        double finalScore = Math.min(100.0, Math.max(10.0, totalRaw));

        BigDecimal score = BigDecimal.valueOf(finalScore).setScale(2, RoundingMode.HALF_UP);

        // 6. Map to PriorityLevel & SLA Target Minutes
        PriorityLevel level;
        int slaMinutes;

        if (finalScore >= 80.0) {
            level = PriorityLevel.CRITICAL;
            slaMinutes = 10;
        } else if (finalScore >= 60.0) {
            level = PriorityLevel.HIGH;
            slaMinutes = 20;
        } else if (finalScore >= 40.0) {
            level = PriorityLevel.MEDIUM;
            slaMinutes = 45;
        } else {
            level = PriorityLevel.LOW;
            slaMinutes = 90;
        }

        String rationale = String.format(
                "Base [%.0f] + Casualties [%.1f] + Trapped [%.1f] + Corroboration [%.1f] -> Final [%s]",
                baseScore, casualtyBoost, trappedBoost, corroborationBoost, score
        );

        return new ScoringResult(score, level, effectiveCategory, slaMinutes, rationale);
    }
}

