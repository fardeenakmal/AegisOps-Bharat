package com.aegisops.platform.adapter;

public record NaturalEvent(
        String id,
        String title,
        String category,
        String categoryTitle,
        double latitude,
        double longitude,
        String date,
        String link,
        Double magnitude,
        String magnitudeUnit
) {}

