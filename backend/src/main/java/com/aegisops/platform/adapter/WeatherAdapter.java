package com.aegisops.platform.adapter;

public interface WeatherAdapter {
    DataFeedResult<LiveWeatherReport> fetchLiveWeather(double latitude, double longitude);
}

