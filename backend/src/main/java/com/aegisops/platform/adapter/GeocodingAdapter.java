package com.aegisops.platform.adapter;

import java.util.List;

public interface GeocodingAdapter {
    DataFeedResult<GeocodedLocation> reverseGeocode(double latitude, double longitude);
    DataFeedResult<List<GeocodedLocation>> searchLocation(String query);
}

