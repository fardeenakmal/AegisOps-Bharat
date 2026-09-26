package com.aegisops.platform.dto;

import com.aegisops.platform.entity.ResponseTeamEntity;

public record SuggestedTeamDto(
        ResponseTeamEntity team,
        double distanceMeters,
        int etaMinutes,
        String routeGeometryGeoJson,
        boolean isReroutedForFlood
) {}

