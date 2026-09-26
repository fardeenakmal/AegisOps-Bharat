package com.aegisops.platform.entity;

import com.aegisops.platform.enums.AssignmentStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "assignments")
public class AssignmentEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "request_id", length = 64, nullable = false)
    private String requestId;

    @Column(name = "team_id", length = 64, nullable = false)
    private String teamId;

    @Column(name = "assigned_by_user_id", length = 64)
    private String assignedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private AssignmentStatus status = AssignmentStatus.ASSIGNED;

    @Column(name = "task_brief", columnDefinition = "TEXT", nullable = false)
    private String taskBrief;

    @Column(name = "estimated_arrival_minutes")
    private Integer estimatedArrivalMinutes;

    @Column(name = "route_distance_meters", precision = 10, scale = 2)
    private BigDecimal routeDistanceMeters;

    @Column(name = "route_geometry_geojson", columnDefinition = "LONGTEXT")
    private String routeGeometryGeoJson;

    @Column(name = "assigned_at")
    private Instant assignedAt = Instant.now();

    @Column(name = "en_route_at")
    private Instant enRouteAt;

    @Column(name = "on_scene_at")
    private Instant onSceneAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "responder_notes", columnDefinition = "TEXT")
    private String responderNotes;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public AssignmentEntity() {}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (assignedAt == null) assignedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public String getAssignedByUserId() { return assignedByUserId; }
    public void setAssignedByUserId(String assignedByUserId) { this.assignedByUserId = assignedByUserId; }

    public AssignmentStatus getStatus() { return status; }
    public void setStatus(AssignmentStatus status) { this.status = status; }

    public String getTaskBrief() { return taskBrief; }
    public void setTaskBrief(String taskBrief) { this.taskBrief = taskBrief; }

    public Integer getEstimatedArrivalMinutes() { return estimatedArrivalMinutes; }
    public void setEstimatedArrivalMinutes(Integer estimatedArrivalMinutes) { this.estimatedArrivalMinutes = estimatedArrivalMinutes; }

    public BigDecimal getRouteDistanceMeters() { return routeDistanceMeters; }
    public void setRouteDistanceMeters(BigDecimal routeDistanceMeters) { this.routeDistanceMeters = routeDistanceMeters; }

    public String getRouteGeometryGeoJson() { return routeGeometryGeoJson; }
    public void setRouteGeometryGeoJson(String routeGeometryGeoJson) { this.routeGeometryGeoJson = routeGeometryGeoJson; }

    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }

    public Instant getEnRouteAt() { return enRouteAt; }
    public void setEnRouteAt(Instant enRouteAt) { this.enRouteAt = enRouteAt; }

    public Instant getOnSceneAt() { return onSceneAt; }
    public void setOnSceneAt(Instant onSceneAt) { this.onSceneAt = onSceneAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getResponderNotes() { return responderNotes; }
    public void setResponderNotes(String responderNotes) { this.responderNotes = responderNotes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

