package com.aegisops.platform.adapter;

public record LiveWeatherReport(
        double latitude,
        double longitude,
        double temperatureCelsius,
        double relativeHumidityPercent,
        double precipitationMmHr,
        double rainMmHr,
        double windSpeedKmh,
        double windGustsKmh,
        double surfacePressureHpa,
        String weatherDescription,
        boolean isExtremeWeather,
        String timestamp
) {}

