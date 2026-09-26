package com.aegisops.platform.dto;

import com.aegisops.platform.enums.PriorityLevel;
import com.aegisops.platform.enums.RequestCategory;
import com.aegisops.platform.enums.RequestStatus;
import java.math.BigDecimal;

public record OverrideInput(
        BigDecimal priorityScore,
        PriorityLevel priorityLevel,
        RequestCategory category,
        RequestStatus status,
        String overrideReason,
        String actorId,
        String actorName
) {}

