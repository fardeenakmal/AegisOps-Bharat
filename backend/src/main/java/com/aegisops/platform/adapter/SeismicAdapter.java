package com.aegisops.platform.adapter;

import com.aegisops.platform.config.RegionConfig;
import java.util.List;

public interface SeismicAdapter {
    DataFeedResult<List<SeismicEvent>> fetchRecentEarthquakes(RegionConfig.Bounds bounds);
}

