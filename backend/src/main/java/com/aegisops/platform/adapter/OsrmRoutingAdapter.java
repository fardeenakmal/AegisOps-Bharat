package com.aegisops.platform.adapter;

import com.aegisops.platform.enums.FeedSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class OsrmRoutingAdapter implements RoutingAdapter {

    private static final Logger log = LoggerFactory.getLogger(OsrmRoutingAdapter.class);
    private final RestClient restClient;

    public OsrmRoutingAdapter() {
        this.restClient = RestClient.builder()
                .defaultHeader("User-Agent", "AegisOps-DisasterPlatform/2.0")
                .build();
    }

    @Override
    public DataFeedResult<TacticalRoute> calculateEmergencyRoute(double originLat, double originLon, double destLat, double destLon) {
        try {
            String url = String.format(
                    "https://router.project-osrm.org/route/v1/driving/%.5f,%.5f;%.5f,%.5f?overview=full&geometries=geojson",
                    originLon, originLat, destLon, destLat
            );

            Map res = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (res != null && "Ok".equalsIgnoreCase(String.valueOf(res.get("code")))) {
                List routes = (List) res.get("routes");
                if (routes != null && !routes.isEmpty()) {
                    Map route = (Map) routes.get(0);
                    double distance = toDouble(route.get("distance"), 5000.0);
                    double durationSeconds = toDouble(route.get("duration"), 600.0);
                    int etaMinutes = Math.max(2, (int) Math.round(durationSeconds / 60.0));

                    Map geom = (Map) route.get("geometry");
                    String geomStr = geom != null ? geom.toString() : "{}";

                    TacticalRoute tr = new TacticalRoute(distance, etaMinutes, "OSRM Open Emergency Road Corridor", geomStr, false);
                    return DataFeedResult.live(tr, FeedSource.OSRM, "OSRM Public Road Network Routing");
                }
            }
        } catch (Exception ex) {
            log.warn("OSRM routing API notice: {}. Using Haversine distance estimation.", ex.getMessage());
        }

        // Haversine fallback
        double distKm = haversineKm(originLat, originLon, destLat, destLon);
        double distMeters = distKm * 1000.0 * 1.35; // 1.35 road winding factor
        int etaMinutes = Math.max(3, (int) Math.round((distMeters / 1000.0) / 45.0 * 60.0)); // assume 45 km/h emergency speed

        TacticalRoute fallback = new TacticalRoute(
                distMeters, etaMinutes, "Direct Line Routing (OSRM Network Offline)", "{}", false
        );
        return DataFeedResult.fallback(fallback, FeedSource.OSRM, "Haversine Fallback Route");
    }

    private double toDouble(Object val, double def) {
        if (val instanceof Number n) return n.doubleValue();
        return def;
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

