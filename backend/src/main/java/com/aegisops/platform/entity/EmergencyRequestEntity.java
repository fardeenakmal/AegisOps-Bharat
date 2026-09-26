package com.aegisops.platform.entity;

import com.aegisops.platform.enums.PriorityLevel;
import com.aegisops.platform.enums.RequestCategory;
import com.aegisops.platform.enums.RequestStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "emergency_requests")
public class EmergencyRequestEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "tracking_code", length = 32, nullable = false, unique = true)
    private String trackingCode;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "incident_type", length = 64, nullable = false)
    private String incidentType;

    @Column(name = "priority_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal priorityScore = BigDecimal.valueOf(50.0);

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_level", length = 32, nullable = false)
    private PriorityLevel priorityLevel = PriorityLevel.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 32, nullable = false)
    private RequestCategory category = RequestCategory.PROPERTY_DAMAGE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private RequestStatus status = RequestStatus.REPORTED;

    @Column(name = "zone_id", length = 64, nullable = false)
    private String zoneId;

    @Column(name = "latitude", precision = 10, scale = 7, nullable = false)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7, nullable = false)
    private BigDecimal longitude;

    @Column(name = "address", columnDefinition = "TEXT", nullable = false)
    private String address;

    @Column(name = "reporter_name", length = 128)
    private String reporterName;

    @Column(name = "reporter_contact", length = 64)
    private String reporterContact;

    @Column(name = "estimated_casualties")
    private Integer estimatedCasualties = 0;

    @Column(name = "estimated_trapped")
    private Integer estimatedTrapped = 0;

    @Column(name = "is_life_threatening")
    private Boolean isLifeThreatening = false;

    @Column(name = "detected_language", length = 16)
    private String detectedLanguage = "en";

    @Column(name = "sla_target_minutes")
    private Integer slaTargetMinutes = 20;

    @Column(name = "sla_deadline")
    private Instant slaDeadline;

    @Column(name = "reported_at")
    private Instant reportedAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "manual_override")
    private Boolean manualOverride = false;

    @Column(name = "override_reason", columnDefinition = "TEXT")
    private String overrideReason;

    @Column(name = "overridden_by", length = 128)
    private String overriddenBy;

    @Column(name = "report_count")
    private Integer reportCount = 1;

    @Column(name = "needs_summary", columnDefinition = "JSON")
    private String needsSummary;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public EmergencyRequestEntity() {}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (reportedAt == null) reportedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTrackingCode() { return trackingCode; }
    public void setTrackingCode(String trackingCode) { this.trackingCode = trackingCode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIncidentType() { return incidentType; }
    public void setIncidentType(String incidentType) { this.incidentType = incidentType; }

    public BigDecimal getPriorityScore() { return priorityScore; }
    public void setPriorityScore(BigDecimal priorityScore) { this.priorityScore = priorityScore; }

    public PriorityLevel getPriorityLevel() { return priorityLevel; }
    public void setPriorityLevel(PriorityLevel priorityLevel) { this.priorityLevel = priorityLevel; }

    public RequestCategory getCategory() { return category; }
    public void setCategory(RequestCategory category) { this.category = category; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public String getZoneId() { return zoneId; }
    public void setZoneId(String zoneId) { this.zoneId = zoneId; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }

    public String getReporterContact() { return reporterContact; }
    public void setReporterContact(String reporterContact) { this.reporterContact = reporterContact; }

    public Integer getEstimatedCasualties() { return estimatedCasualties; }
    public void setEstimatedCasualties(Integer estimatedCasualties) { this.estimatedCasualties = estimatedCasualties; }

    public Integer getEstimatedTrapped() { return estimatedTrapped; }
    public void setEstimatedTrapped(Integer estimatedTrapped) { this.estimatedTrapped = estimatedTrapped; }

    public Boolean getIsLifeThreatening() { return isLifeThreatening; }
    public void setIsLifeThreatening(Boolean lifeThreatening) { isLifeThreatening = lifeThreatening; }

    public String getDetectedLanguage() { return detectedLanguage; }
    public void setDetectedLanguage(String detectedLanguage) { this.detectedLanguage = detectedLanguage; }

    public Integer getSlaTargetMinutes() { return slaTargetMinutes; }
    public void setSlaTargetMinutes(Integer slaTargetMinutes) { this.slaTargetMinutes = slaTargetMinutes; }

    public Instant getSlaDeadline() { return slaDeadline; }
    public void setSlaDeadline(Instant slaDeadline) { this.slaDeadline = slaDeadline; }

    public Instant getReportedAt() { return reportedAt; }
    public void setReportedAt(Instant reportedAt) { this.reportedAt = reportedAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public Boolean getManualOverride() { return manualOverride; }
    public void setManualOverride(Boolean manualOverride) { this.manualOverride = manualOverride; }

    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }

    public String getOverriddenBy() { return overriddenBy; }
    public void setOverriddenBy(String overriddenBy) { this.overriddenBy = overriddenBy; }

    public Integer getReportCount() { return reportCount; }
    public void setReportCount(Integer reportCount) { this.reportCount = reportCount; }

    public String getNeedsSummary() { return needsSummary; }
    public void setNeedsSummary(String needsSummary) { this.needsSummary = needsSummary; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    // Jackson serialization aliases for UI and backward compatibility
    public String getType() { return incidentType; }
    public String getSeverityLabel() { return priorityLevel != null ? priorityLevel.name() : "MEDIUM"; }
    public BigDecimal getSeverityScore() { return priorityScore; }
}

