package com.aegisops.platform.adapter;

public interface HydrologicalAdapter {
    DataFeedResult<RiverDischargeReport> fetchRiverDischarge(double latitude, double longitude, String basinName);
}

