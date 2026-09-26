package com.aegisops.platform.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "aegisops.region")
public class RegionConfig {

    private String defaultCode = "INDIA";
    private Double defaultCenterLat = 22.0;
    private Double defaultCenterLon = 78.9629;
    private Integer defaultZoom = 5;
    private Bounds bounds = new Bounds(6.0, 37.5, 68.0, 97.5);

    public static class Bounds {
        private Double minLat;
        private Double maxLat;
        private Double minLon;
        private Double maxLon;

        public Bounds() {}

        public Bounds(Double minLat, Double maxLat, Double minLon, Double maxLon) {
            this.minLat = minLat;
            this.maxLat = maxLat;
            this.minLon = minLon;
            this.maxLon = maxLon;
        }

        public Double getMinLat() { return minLat; }
        public void setMinLat(Double minLat) { this.minLat = minLat; }

        public Double getMaxLat() { return maxLat; }
        public void setMaxLat(Double maxLat) { this.maxLat = maxLat; }

        public Double getMinLon() { return minLon; }
        public void setMinLon(Double minLon) { this.minLon = minLon; }

        public Double getMaxLon() { return maxLon; }
        public void setMaxLon(Double maxLon) { this.maxLon = maxLon; }

        public boolean contains(Double lat, Double lon) {
            if (lat == null || lon == null) return false;
            return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
        }
    }

    public String getDefaultCode() { return defaultCode; }
    public void setDefaultCode(String defaultCode) { this.defaultCode = defaultCode; }

    public Double getDefaultCenterLat() { return defaultCenterLat; }
    public void setDefaultCenterLat(Double defaultCenterLat) { this.defaultCenterLat = defaultCenterLat; }

    public Double getDefaultCenterLon() { return defaultCenterLon; }
    public void setDefaultCenterLon(Double defaultCenterLon) { this.defaultCenterLon = defaultCenterLon; }

    public Integer getDefaultZoom() { return defaultZoom; }
    public void setDefaultZoom(Integer defaultZoom) { this.defaultZoom = defaultZoom; }

    public Bounds getBounds() { return bounds; }
    public void setBounds(Bounds bounds) { this.bounds = bounds; }
}

