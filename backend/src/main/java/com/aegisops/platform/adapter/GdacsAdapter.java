package com.aegisops.platform.adapter;

import com.aegisops.platform.enums.FeedSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Component
public class GdacsAdapter {

    private static final Logger log = LoggerFactory.getLogger(GdacsAdapter.class);
    private final RestClient restClient;

    public GdacsAdapter() {
        this.restClient = RestClient.builder()
                .defaultHeader("User-Agent", "AegisOps-DisasterPlatform/2.0")
                .build();
    }

    public DataFeedResult<List<GdacsAlert>> fetchActiveAlerts() {
        List<GdacsAlert> list = new ArrayList<>();
        try {
            String url = "https://www.gdacs.org/xml/rss.xml";
            String xml = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            if (xml != null && xml.contains("<item>")) {
                String[] items = xml.split("<item>");
                for (int i = 1; i < items.length; i++) {
                    String item = items[i];
                    String title = extractTag(item, "title");
                    String desc = extractTag(item, "description");
                    String link = extractTag(item, "link");
                    String pubDate = extractTag(item, "pubDate");
                    String eventType = extractTag(item, "gdacs:eventtype");
                    String alertLevel = extractTag(item, "gdacs:alertlevel");
                    String cap = extractTag(item, "gdacs:cap");

                    double lat = 0.0;
                    double lon = 0.0;
                    String latStr = extractTag(item, "geo:lat");
                    String lonStr = extractTag(item, "geo:long");
                    if (!latStr.isEmpty() && !lonStr.isEmpty()) {
                        try {
                            lat = Double.parseDouble(latStr);
                            lon = Double.parseDouble(lonStr);
                        } catch (NumberFormatException ignored) {}
                    } else {
                        String pointStr = extractTag(item, "georss:point");
                        if (!pointStr.isEmpty()) {
                            String[] parts = pointStr.trim().split("\\s+");
                            if (parts.length >= 2) {
                                try {
                                    lat = Double.parseDouble(parts[0]);
                                    lon = Double.parseDouble(parts[1]);
                                } catch (NumberFormatException ignored) {}
                            }
                        }
                    }

                    String id = "gdacs-" + (link.contains("eventid=") ? link.substring(link.indexOf("eventid=") + 8) : ("item-" + i));
                    if (id.contains("&")) id = id.substring(0, id.indexOf("&"));

                    list.add(new GdacsAlert(
                            id, title, desc, link, pubDate, eventType, alertLevel.isEmpty() ? "Green" : alertLevel, lat, lon, cap
                    ));
                }
                return DataFeedResult.live(list, FeedSource.GDACS, "Live GDACS Global Disaster Alert & Coordination Stream");
            }
        } catch (Exception ex) {
            log.warn("GDACS RSS API unavailable: {}", ex.getMessage());
            return DataFeedResult.fallback(list, FeedSource.GDACS, "GDACS Network Offline (0 events)");
        }

        return DataFeedResult.live(list, FeedSource.GDACS, "Live GDACS Global Disaster Alert & Coordination Stream");
    }

    private String extractTag(String text, String tag) {
        String open = "<" + tag;
        int start = text.indexOf(open);
        if (start == -1) return "";
        int tagEnd = text.indexOf(">", start);
        if (tagEnd == -1) return "";
        String close = "</" + tag + ">";
        int end = text.indexOf(close, tagEnd);
        if (end == -1) return "";
        return text.substring(tagEnd + 1, end).trim();
    }
}

