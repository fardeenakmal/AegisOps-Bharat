package com.aegisops.platform.adapter;

public record TacticalRoute(
        double distanceMeters,
        int durationMinutes,
        String summary,
        String geometryGeoJson,
        boolean detourAdvised
) {}

