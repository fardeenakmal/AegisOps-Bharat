package com.aegisops.platform.entity;

import com.aegisops.platform.enums.FeedSource;
import com.aegisops.platform.enums.RiskType;
import com.aegisops.platform.enums.SeverityLevel;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "alerts")
public class AlertEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "zone_id", length = 64, nullable = false)
    private String zoneId;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_type", length = 64, nullable = false)
    private RiskType riskType;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 32, nullable = false)
    private SeverityLevel severity = SeverityLevel.MEDIUM;

    @Column(name = "risk_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal riskScore;

    @Column(name = "title", length = 1000, nullable = false)
    private String title;

    @Column(name = "summary", columnDefinition = "TEXT", nullable = false)
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_feed", length = 64, nullable = false)
    private FeedSource sourceFeed;

    @Column(name = "is_live", nullable = false)
    private Boolean isLive = true;

    @Column(name = "data_disclaimer", length = 1000)
    private String dataDisclaimer;

    @Column(name = "recommended_actions", columnDefinition = "JSON")
    private String recommendedActions;

    @Column(name = "recommended_prepositioning", columnDefinition = "JSON")
    private String recommendedPrepositioning;

    @Column(name = "valid_from")
    private Instant validFrom = Instant.now();

    @Column(name = "valid_to")
    private Instant validTo;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public AlertEntity() {}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (validFrom == null) validFrom = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getZoneId() { return zoneId; }
    public void setZoneId(String zoneId) { this.zoneId = zoneId; }

    public RiskType getRiskType() { return riskType; }
    public void setRiskType(RiskType riskType) { this.riskType = riskType; }

    public SeverityLevel getSeverity() { return severity; }
    public void setSeverity(SeverityLevel severity) { this.severity = severity; }

    public BigDecimal getRiskScore() { return riskScore; }
    public void setRiskScore(BigDecimal riskScore) { this.riskScore = riskScore; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public FeedSource getSourceFeed() { return sourceFeed; }
    public void setSourceFeed(FeedSource sourceFeed) { this.sourceFeed = sourceFeed; }

    public Boolean getIsLive() { return isLive; }
    public void setIsLive(Boolean live) { isLive = live; }

    public String getDataDisclaimer() { return dataDisclaimer; }
    public void setDataDisclaimer(String dataDisclaimer) { this.dataDisclaimer = dataDisclaimer; }

    public String getRecommendedActions() { return recommendedActions; }
    public void setRecommendedActions(String recommendedActions) { this.recommendedActions = recommendedActions; }

    public String getRecommendedPrepositioning() { return recommendedPrepositioning; }
    public void setRecommendedPrepositioning(String recommendedPrepositioning) { this.recommendedPrepositioning = recommendedPrepositioning; }

    public Instant getValidFrom() { return validFrom; }
    public void setValidFrom(Instant validFrom) { this.validFrom = validFrom; }

    public Instant getValidTo() { return validTo; }
    public void setValidTo(Instant validTo) { this.validTo = validTo; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

