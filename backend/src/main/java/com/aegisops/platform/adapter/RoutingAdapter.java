package com.aegisops.platform.adapter;

public interface RoutingAdapter {
    DataFeedResult<TacticalRoute> calculateEmergencyRoute(double originLat, double originLon, double destLat, double destLon);
}

