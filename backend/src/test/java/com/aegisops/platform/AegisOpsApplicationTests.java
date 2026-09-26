package com.aegisops.platform;

import com.aegisops.platform.dto.EmergencyRequestInput;
import com.aegisops.platform.entity.EmergencyRequestEntity;
import com.aegisops.platform.enums.PriorityLevel;
import com.aegisops.platform.enums.RequestCategory;
import com.aegisops.platform.service.EmergencyRequestService;
import com.aegisops.platform.service.HeuristicPriorityScoringEngine;
import com.aegisops.platform.service.MultilingualTriageService;
import com.aegisops.platform.service.PriorityScoringEngine;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AegisOpsApplicationTests {

    @Autowired
    private HeuristicPriorityScoringEngine scoringEngine;

    @Autowired
    private MultilingualTriageService triageService;

    @Autowired
    private EmergencyRequestService requestService;

    @Test
    void contextLoads() {
        assertNotNull(scoringEngine);
        assertNotNull(triageService);
        assertNotNull(requestService);
    }

    @Test
    void testPriorityScoring_LifeThreatening_StructuralCollapse() {
        PriorityScoringEngine.ScoringResult result = scoringEngine.evaluatePriority(
                "STRUCTURAL_COLLAPSE", RequestCategory.LIFE_THREATENING, 4, 3, 5, true
        );

        assertNotNull(result);
        assertEquals(PriorityLevel.CRITICAL, result.priorityLevel());
        assertEquals(RequestCategory.LIFE_THREATENING, result.category());
        assertTrue(result.priorityScore().doubleValue() >= 80.0, "Score should be >= 80 for trapped victims in collapse");
        assertEquals(10, result.slaTargetMinutes(), "Critical incidents must target 10-minute SLA");
    }

    @Test
    void testMultilingualTriage_HindiDevanagariWithTrappedVictims() {
        String hindiReport = "कुर्ला में भारी बारिश से ५ लोग पानी में फंसे हैं, जल्दी मदद भेजो!";
        MultilingualTriageService.TriageResult result = triageService.processText(hindiReport);

        assertEquals("hi", result.detectedLanguage());
        assertEquals("FLOOD", result.incidentType());
        assertTrue(result.estimatedTrapped() >= 5 || result.isLifeThreatening());
        assertEquals(RequestCategory.LIFE_THREATENING, result.category());
    }

    @Test
    void testEmergencyRequestIntakeWorkflow() {
        EmergencyRequestInput input = new EmergencyRequestInput(
                "Test High Rise Fire",
                "Fire on 4th floor with 2 people trapped",
                "Fire on 4th floor with 2 people trapped",
                BigDecimal.valueOf(28.6315),
                BigDecimal.valueOf(77.2195),
                "Connaught Place, New Delhi",
                "Rajesh Kumar",
                "+91-98111-22334",
                "zone-dl-ncr",
                "FIRE",
                RequestCategory.LIFE_THREATENING,
                0,
                2,
                true
        );

        EmergencyRequestEntity created = requestService.submitRequest(input);

        assertNotNull(created.getId());
        assertNotNull(created.getTrackingCode());
        assertEquals("FIRE", created.getIncidentType());
        assertTrue(created.getPriorityScore().doubleValue() >= 80.0);
        assertEquals(PriorityLevel.CRITICAL, created.getPriorityLevel());
        assertEquals(10, created.getSlaTargetMinutes());
    }
}

