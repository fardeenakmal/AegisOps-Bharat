package com.aegisops.platform.adapter;

import com.aegisops.platform.config.RegionConfig;
import com.aegisops.platform.enums.FeedSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class UsgsSeismicAdapter implements SeismicAdapter {

    private static final Logger log = LoggerFactory.getLogger(UsgsSeismicAdapter.class);
    private final RestClient restClient;

    public UsgsSeismicAdapter() {
        this.restClient = RestClient.builder()
                .defaultHeader("User-Agent", "AegisOps-DisasterPlatform/2.0")
                .build();
    }

    @Override
    public DataFeedResult<List<SeismicEvent>> fetchRecentEarthquakes(RegionConfig.Bounds bounds) {
        List<SeismicEvent> events = new ArrayList<>();
        try {
            String url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";
            Map response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("features")) {
                List features = (List) response.get("features");
                for (Object item : features) {
                    if (item instanceof Map feat) {
                        Map props = (Map) feat.get("properties");
                        Map geom = (Map) feat.get("geometry");
                        if (props != null && geom != null && geom.containsKey("coordinates")) {
                            List coords = (List) geom.get("coordinates");
                            if (coords.size() >= 2) {
                                double lon = ((Number) coords.get(0)).doubleValue();
                                double lat = ((Number) coords.get(1)).doubleValue();
                                double depth = coords.size() >= 3 ? ((Number) coords.get(2)).doubleValue() : 10.0;

                                // Filter within specified region bounds
                                if (bounds == null || bounds.contains(lat, lon)) {
                                    String id = String.valueOf(props.getOrDefault("code", feat.get("id")));
                                    String title = String.valueOf(props.getOrDefault("title", "Earthquake"));
                                    String place = String.valueOf(props.getOrDefault("place", "Seismic Zone"));
                                    double mag = props.get("mag") instanceof Number n ? n.doubleValue() : 4.5;
                                    boolean tsunami = props.get("tsunami") instanceof Number n && n.intValue() == 1;
                                    long timeMs = props.get("time") instanceof Number n ? n.longValue() : System.currentTimeMillis();

                                    events.add(new SeismicEvent(
                                            id, title, place, mag, depth, lat, lon, Instant.ofEpochMilli(timeMs).toString(), tsunami
                                    ));
                                }
                            }
                        }
                    }
                }
                return DataFeedResult.live(events, FeedSource.USGS_SEISMIC, "Live USGS Earthquake Hazards Stream");
            }
        } catch (Exception ex) {
            log.warn("USGS Earthquake API request exception: {}", ex.getMessage());
            return DataFeedResult.fallback(events, FeedSource.USGS_SEISMIC, "USGS Network Offline (0 events recorded)");
        }

        return DataFeedResult.live(events, FeedSource.USGS_SEISMIC, "Live USGS Earthquake Hazards Stream");
    }
}

