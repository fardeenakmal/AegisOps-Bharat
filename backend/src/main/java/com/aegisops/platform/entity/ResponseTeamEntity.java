package com.aegisops.platform.entity;

import com.aegisops.platform.enums.TeamStatus;
import com.aegisops.platform.enums.TeamType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "response_teams")
public class ResponseTeamEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "call_sign", length = 128, nullable = false, unique = true)
    private String callSign;

    @Enumerated(EnumType.STRING)
    @Column(name = "team_type", length = 64, nullable = false)
    private TeamType teamType;

    @Column(name = "zone_id", length = 64, nullable = false)
    private String zoneId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private TeamStatus status = TeamStatus.AVAILABLE;

    @Column(name = "latitude", precision = 10, scale = 7, nullable = false)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7, nullable = false)
    private BigDecimal longitude;

    @Column(name = "base_station_name", length = 255, nullable = false)
    private String baseStationName;

    @Column(name = "crew_capacity")
    private Integer crewCapacity = 4;

    @Column(name = "equipment_specs", columnDefinition = "JSON")
    private String equipmentSpecs;

    @Column(name = "contact_radio", length = 64)
    private String contactRadio;

    @Column(name = "last_ping_at")
    private Instant lastPingAt = Instant.now();

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public ResponseTeamEntity() {}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (lastPingAt == null) lastPingAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCallSign() { return callSign; }
    public void setCallSign(String callSign) { this.callSign = callSign; }

    public TeamType getTeamType() { return teamType; }
    public void setTeamType(TeamType teamType) { this.teamType = teamType; }

    public String getZoneId() { return zoneId; }
    public void setZoneId(String zoneId) { this.zoneId = zoneId; }

    public TeamStatus getStatus() { return status; }
    public void setStatus(TeamStatus status) { this.status = status; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getBaseStationName() { return baseStationName; }
    public void setBaseStationName(String baseStationName) { this.baseStationName = baseStationName; }

    public Integer getCrewCapacity() { return crewCapacity; }
    public void setCrewCapacity(Integer crewCapacity) { this.crewCapacity = crewCapacity; }

    public String getEquipmentSpecs() { return equipmentSpecs; }
    public void setEquipmentSpecs(String equipmentSpecs) { this.equipmentSpecs = equipmentSpecs; }

    public String getContactRadio() { return contactRadio; }
    public void setContactRadio(String contactRadio) { this.contactRadio = contactRadio; }

    public Instant getLastPingAt() { return lastPingAt; }
    public void setLastPingAt(Instant lastPingAt) { this.lastPingAt = lastPingAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    // Jackson serialization aliases for UI compatibility
    public TeamType getType() { return teamType; }
    public Integer getCrewCount() { return crewCapacity; }
}

