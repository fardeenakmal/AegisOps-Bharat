package com.aegisops.platform.adapter;

import com.aegisops.platform.enums.FeedSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class NominatimGeocodingAdapter implements GeocodingAdapter {

    private static final Logger log = LoggerFactory.getLogger(NominatimGeocodingAdapter.class);
    private final RestClient restClient;

    public NominatimGeocodingAdapter() {
        this.restClient = RestClient.builder()
                .defaultHeader("User-Agent", "AegisOps-DisasterPlatform/2.0 (NDMA-Ops)")
                .build();
    }

    @Override
    public DataFeedResult<GeocodedLocation> reverseGeocode(double latitude, double longitude) {
        try {
            String url = String.format("https://nominatim.openstreetmap.org/reverse?format=json&lat=%.5f&lon=%.5f&zoom=18&addressdetails=1", latitude, longitude);
            Map res = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (res != null && res.containsKey("display_name")) {
                Map addr = (Map) res.getOrDefault("address", Map.of());
                GeocodedLocation loc = new GeocodedLocation(
                        String.valueOf(res.get("display_name")),
                        String.valueOf(addr.getOrDefault("road", "")),
                        String.valueOf(addr.getOrDefault("suburb", "")),
                        String.valueOf(addr.getOrDefault("city", addr.getOrDefault("town", ""))),
                        String.valueOf(addr.getOrDefault("state", "")),
                        String.valueOf(addr.getOrDefault("country", "India")),
                        latitude, longitude
                );
                return DataFeedResult.live(loc, FeedSource.NOMINATIM, "OpenStreetMap Nominatim Geocoder");
            }
        } catch (Exception ex) {
            log.warn("Nominatim reverse geocode notice: {}", ex.getMessage());
        }

        GeocodedLocation fallback = new GeocodedLocation(
                String.format("Coordinates: %.4f°N, %.4f°E", latitude, longitude),
                "", "", "", "", "India", latitude, longitude
        );
        return DataFeedResult.fallback(fallback, FeedSource.NOMINATIM, "Coordinate Fallback (Nominatim Throttled)");
    }

    @Override
    public DataFeedResult<List<GeocodedLocation>> searchLocation(String query) {
        List<GeocodedLocation> list = new ArrayList<>();
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://nominatim.openstreetmap.org/search?format=json&q=" + encoded + "&limit=5&addressdetails=1";
            List results = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(List.class);

            if (results != null) {
                for (Object item : results) {
                    if (item instanceof Map m) {
                        double lat = Double.parseDouble(String.valueOf(m.get("lat")));
                        double lon = Double.parseDouble(String.valueOf(m.get("lon")));
                        Map addr = (Map) m.getOrDefault("address", Map.of());
                        list.add(new GeocodedLocation(
                                String.valueOf(m.get("display_name")),
                                String.valueOf(addr.getOrDefault("road", "")),
                                String.valueOf(addr.getOrDefault("suburb", "")),
                                String.valueOf(addr.getOrDefault("city", addr.getOrDefault("town", ""))),
                                String.valueOf(addr.getOrDefault("state", "")),
                                String.valueOf(addr.getOrDefault("country", "India")),
                                lat, lon
                        ));
                    }
                }
                return DataFeedResult.live(list, FeedSource.NOMINATIM, "OpenStreetMap Nominatim Search");
            }
        } catch (Exception ex) {
            log.warn("Nominatim search notice: {}", ex.getMessage());
        }

        return DataFeedResult.fallback(list, FeedSource.NOMINATIM, "Search Offline");
    }
}

