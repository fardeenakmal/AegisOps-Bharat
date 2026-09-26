package com.aegisops.platform.repository;

import com.aegisops.platform.entity.EmergencyRequestEntity;
import com.aegisops.platform.enums.PriorityLevel;
import com.aegisops.platform.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyRequestRepository extends JpaRepository<EmergencyRequestEntity, String> {
    Optional<EmergencyRequestEntity> findByTrackingCode(String trackingCode);

    List<EmergencyRequestEntity> findByStatusNotOrderByPriorityScoreDescReportedAtDesc(RequestStatus status);

    List<EmergencyRequestEntity> findByZoneIdAndStatusNot(String zoneId, RequestStatus status);

    List<EmergencyRequestEntity> findByPriorityLevel(PriorityLevel priorityLevel);

    @Query("SELECT r FROM EmergencyRequestEntity r WHERE " +
           "(:zoneId IS NULL OR :zoneId = 'zone-ndma-in' OR :zoneId = 'ALL' OR r.zoneId = :zoneId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:priorityLevel IS NULL OR r.priorityLevel = :priorityLevel) AND " +
           "(:incidentType IS NULL OR r.incidentType = :incidentType) " +
           "ORDER BY r.priorityScore DESC, r.reportedAt DESC")
    List<EmergencyRequestEntity> findFiltered(
            @Param("zoneId") String zoneId,
            @Param("status") RequestStatus status,
            @Param("priorityLevel") PriorityLevel priorityLevel,
            @Param("incidentType") String incidentType
    );
}

