package com.aegisops.platform.adapter;

public record GovernmentAlertItem(
        String identifier,
        String sender,
        String headline,
        String description,
        String instruction,
        String severity,
        String urgency,
        String areaDescription,
        String sentAt
) {}

