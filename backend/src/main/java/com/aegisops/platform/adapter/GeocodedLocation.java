package com.aegisops.platform.adapter;

public record GeocodedLocation(
        String displayName,
        String road,
        String suburb,
        String city,
        String state,
        String country,
        double latitude,
        double longitude
) {}

