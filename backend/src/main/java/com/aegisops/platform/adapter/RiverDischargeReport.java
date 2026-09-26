package com.aegisops.platform.adapter;

public record RiverDischargeReport(
        double latitude,
        double longitude,
        double riverDischargeM3s,
        double meanDischargeM3s,
        double maxForecastDischargeM3s,
        String floodRiskCategory,
        boolean isFloodingImminent,
        String riverBasinName,
        String timestamp
) {}
