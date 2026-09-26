package com.aegisops.platform.adapter;

import com.aegisops.platform.enums.FeedSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OpenMeteoWeatherAdapter implements WeatherAdapter {

    private static final Logger log = LoggerFactory.getLogger(OpenMeteoWeatherAdapter.class);
    private final RestClient restClient;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private record CacheEntry(LiveWeatherReport report, long expiresAt) {}

    public OpenMeteoWeatherAdapter() {
        this.restClient = RestClient.builder()
                .defaultHeader("User-Agent", "AegisOps-DisasterPlatform/2.0")
                .build();
    }

    @Override
    public DataFeedResult<LiveWeatherReport> fetchLiveWeather(double latitude, double longitude) {
        String cacheKey = String.format("%.3f,%.3f", latitude, longitude);
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && System.currentTimeMillis() < cached.expiresAt()) {
            return DataFeedResult.live(cached.report(), FeedSource.OPEN_METEO, "Cached Open-Meteo Telemetry");
        }

        try {
            String url = String.format(
                    "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_gusts_10m&timezone=auto",
                    latitude, longitude);

            Map response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("current")) {
                Map current = (Map) response.get("current");
                double temp = toDouble(current.get("temperature_2m"), 28.0);
                double humidity = toDouble(current.get("relative_humidity_2m"), 75.0);
                double precip = toDouble(current.get("precipitation"), 0.0);
                double rain = toDouble(current.get("rain"), 0.0);
                double wind = toDouble(current.get("wind_speed_10m"), 15.0);
                double gusts = toDouble(current.get("wind_gusts_10m"), 25.0);
                double pressure = toDouble(current.get("surface_pressure"), 1010.0);
                int code = toInt(current.get("weather_code"), 0);

                boolean isExtreme = wind > 60 || gusts > 80 || precip > 30 || rain > 25;
                String desc = interpretWeatherCode(code);

                LiveWeatherReport report = new LiveWeatherReport(
                        latitude, longitude, temp, humidity, precip, rain, wind, gusts, pressure, desc, isExtreme, Instant.now().toString()
                );

                cache.put(cacheKey, new CacheEntry(report, System.currentTimeMillis() + 5 * 60 * 1000));
                return DataFeedResult.live(report, FeedSource.OPEN_METEO, "Live Open-Meteo Telemetry");
            }
        } catch (Exception ex) {
            log.warn("Open-Meteo Weather API failed: {}. Providing calibrated baseline.", ex.getMessage());
        }

        LiveWeatherReport fallback = new LiveWeatherReport(
                latitude, longitude, 28.5, 78.0, 5.2, 4.8, 24.0, 38.0, 1009.0,
                "Monsoon Heavy Cloud Cover with Showers", false, Instant.now().toString()
        );
        return DataFeedResult.fallback(fallback, FeedSource.OPEN_METEO, "Fallback Baseline (Open-Meteo Unreachable)");
    }

    private double toDouble(Object val, double def) {
        if (val instanceof Number n) return n.doubleValue();
        return def;
    }

    private int toInt(Object val, int def) {
        if (val instanceof Number n) return n.intValue();
        return def;
    }

    private String interpretWeatherCode(int code) {
        if (code == 0) return "Clear Sky";
        if (code <= 3) return "Partly Cloudy to Overcast";
        if (code == 45 || code == 48) return "Dense Fog / Low Visibility";
        if (code >= 51 && code <= 55) return "Drizzle / Light Showers";
        if (code >= 61 && code <= 65) return "Heavy Rainfall / Monsoon Showers";
        if (code >= 80 && code <= 82) return "Intense Rain Showers / Downpour";
        if (code >= 95) return "Severe Thunderstorm with Squalls";
        return "Active Meteorological System";
    }
}

