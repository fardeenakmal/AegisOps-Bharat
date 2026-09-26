package com.aegisops.platform.adapter;

public record SeismicEvent(
        String id,
        String title,
        String place,
        double magnitude,
        double depthKm,
        double latitude,
        double longitude,
        String eventTime,
        boolean tsunamiFlag
) {}

