package com.aegisops.platform.adapter;

public record EmergencyFacility(
        String id,
        String name,
        String type,
        double latitude,
        double longitude,
        int totalBeds,
        int availableBeds,
        int totalIcuBeds,
        int availableIcuBeds,
        boolean massCasualtyMode,
        String address,
        String contactPhone
) {}

