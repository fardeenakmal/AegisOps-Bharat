package com.aegisops.platform.adapter;

public record GdacsAlert(
        String id,
        String title,
        String description,
        String link,
        String pubDate,
        String eventType,
        String alertLevel,
        double latitude,
        double longitude,
        String capUrl
) {}

