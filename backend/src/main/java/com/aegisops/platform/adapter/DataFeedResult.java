package com.aegisops.platform.adapter;

import com.aegisops.platform.enums.FeedSource;
import java.time.Instant;

public record DataFeedResult<T>(
        T data,
        FeedSource source,
        boolean isLive,
        String disclaimer,
        Instant fetchedAt
) {
    public static <T> DataFeedResult<T> live(T data, FeedSource source, String disclaimer) {
        return new DataFeedResult<>(data, source, true, disclaimer, Instant.now());
    }

    public static <T> DataFeedResult<T> fallback(T data, FeedSource source, String disclaimer) {
        return new DataFeedResult<>(data, source, false, disclaimer, Instant.now());
    }
}

