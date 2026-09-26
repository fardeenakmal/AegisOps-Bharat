package com.aegisops.platform.adapter;

import java.util.List;

public interface GovernmentAlertAdapter {
    DataFeedResult<List<GovernmentAlertItem>> fetchActiveAlerts();
}

