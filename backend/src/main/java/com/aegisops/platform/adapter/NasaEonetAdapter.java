package com.aegisops.platform.adapter;

import com.aegisops.platform.enums.FeedSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class NasaEonetAdapter {

    private static final Logger log = LoggerFactory.getLogger(NasaEonetAdapter.class);
    private final RestClient restClient;

    public NasaEonetAdapter() {
        this.restClient = RestClient.builder()
                .defaultHeader("User-Agent", "AegisOps-DisasterPlatform/2.0")
                .build();
    }

    public DataFeedResult<List<NaturalEvent>> fetchOpenEvents() {
        List<NaturalEvent> list = new ArrayList<>();
        try {
            String url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=60";
            String jsonStr = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            if (jsonStr != null && !jsonStr.isBlank()) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map response = mapper.readValue(jsonStr, Map.class);
                if (response != null && response.containsKey("events")) {
                List events = (List) response.get("events");
                for (Object evObj : events) {
                    if (evObj instanceof Map ev) {
                        String id = String.valueOf(ev.get("id"));
                        String title = String.valueOf(ev.get("title"));
                        String link = String.valueOf(ev.getOrDefault("link", ""));

                        String catId = "hazard";
                        String catTitle = "Natural Hazard";
                        if (ev.get("categories") instanceof List cats && !cats.isEmpty()) {
                            if (cats.get(0) instanceof Map catMap) {
                                catId = String.valueOf(catMap.getOrDefault("id", "hazard"));
                                catTitle = String.valueOf(catMap.getOrDefault("title", "Natural Hazard"));
                            }
                        }

                        double lat = 0.0;
                        double lon = 0.0;
                        String date = "";
                        Double mag = null;
                        String magUnit = null;

                        if (ev.get("geometry") instanceof List geoms && !geoms.isEmpty()) {
                            // Take latest geometry point
                            Object latestGeom = geoms.get(geoms.size() - 1);
                            if (latestGeom instanceof Map gm) {
                                date = String.valueOf(gm.getOrDefault("date", ""));
                                if (gm.get("coordinates") instanceof List coords && coords.size() >= 2) {
                                    lon = ((Number) coords.get(0)).doubleValue();
                                    lat = ((Number) coords.get(1)).doubleValue();
                                }
                                if (gm.get("magnitudeValue") instanceof Number mv) {
                                    mag = mv.doubleValue();
                                }
                                if (gm.containsKey("magnitudeUnit")) {
                                    magUnit = String.valueOf(gm.get("magnitudeUnit"));
                                }
                            }
                        }

                        if (lat != 0.0 || lon != 0.0) {
                            list.add(new NaturalEvent(
                                    id, title, catId, catTitle, lat, lon, date, link, mag, magUnit
                            ));
                        }
                    }
                }
                return DataFeedResult.live(list, FeedSource.NASA_EONET, "Live NASA EONET v3 Earth Observatory Stream");
            }
        }
        } catch (Exception ex) {
            log.warn("NASA EONET API unavailable: {}", ex.getMessage());
            return DataFeedResult.fallback(list, FeedSource.NASA_EONET, "NASA EONET Network Offline (0 events)");
        }

        return DataFeedResult.live(list, FeedSource.NASA_EONET, "Live NASA EONET v3 Earth Observatory Stream");
    }
}
