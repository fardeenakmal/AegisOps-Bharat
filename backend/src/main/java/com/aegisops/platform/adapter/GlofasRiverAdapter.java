package com.aegisops.platform.adapter;

import com.aegisops.platform.enums.FeedSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
public class GlofasRiverAdapter implements HydrologicalAdapter {

    private static final Logger log = LoggerFactory.getLogger(GlofasRiverAdapter.class);
    private final RestClient restClient;

    public GlofasRiverAdapter() {
        this.restClient = RestClient.builder()
                .defaultHeader("User-Agent", "AegisOps-DisasterPlatform/2.0")
                .build();
    }

    @Override
    public DataFeedResult<RiverDischargeReport> fetchRiverDischarge(double latitude, double longitude, String basinName) {
        try {
            String url = String.format(
                    "https://flood-api.open-meteo.com/v1/flood?latitude=%.4f&longitude=%.4f&daily=river_discharge,river_discharge_mean,river_discharge_max&forecast_days=7&timezone=auto",
                    latitude, longitude);

            Map response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("daily")) {
                Map daily = (Map) response.get("daily");
                List discharges = (List) daily.get("river_discharge");
                List means = (List) daily.get("river_discharge_mean");
                List maxes = (List) daily.get("river_discharge_max");

                double current = discharges != null && !discharges.isEmpty() && discharges.get(0) instanceof Number n ? n.doubleValue() : 25.0;
                double mean = means != null && !means.isEmpty() && means.get(0) instanceof Number n ? n.doubleValue() : Math.max(5.0, current * 0.6);
                double max = maxes != null && !maxes.isEmpty() && maxes.get(0) instanceof Number n ? n.doubleValue() : current * 1.4;

                double ratio = current / Math.max(1.0, mean);
                String floodRisk = "NORMAL";
                boolean imminent = false;

                if (ratio >= 3.0 || current > 2500) {
                    floodRisk = "20_YEAR_FLOOD";
                    imminent = true;
                } else if (ratio >= 2.0 || current > 1200) {
                    floodRisk = "5_YEAR_FLOOD";
                    imminent = true;
                } else if (ratio >= 1.5 || current > 600) {
                    floodRisk = "2_YEAR_FLOOD";
                }

                RiverDischargeReport report = new RiverDischargeReport(
                        latitude, longitude, current, mean, max, floodRisk, imminent,
                        basinName != null ? basinName : "River Basin Monitor", Instant.now().toString()
                );
                return DataFeedResult.live(report, FeedSource.CWC_GLOFAS, "Live Copernicus GloFAS Hydro Telemetry");
            }
        } catch (Exception ex) {
            log.warn("GloFAS Flood API failed: {}. Providing hydrological baseline.", ex.getMessage());
        }

        RiverDischargeReport baseline = new RiverDischargeReport(
                latitude, longitude, 165.4, 85.0, 220.0, "NORMAL", false,
                basinName != null ? basinName : "River Basin Monitor", Instant.now().toString()
        );
        return DataFeedResult.fallback(baseline, FeedSource.CWC_GLOFAS, "Fallback Baseline (Hydrological Stream Unreachable)");
    }
}

