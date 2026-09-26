package com.aegisops.platform.repository;

import com.aegisops.platform.entity.AlertEntity;
import com.aegisops.platform.enums.SeverityLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<AlertEntity, String> {
    List<AlertEntity> findByIsActiveTrueOrderByRiskScoreDescCreatedAtDesc();
    List<AlertEntity> findByZoneIdAndIsActiveTrue(String zoneId);
    List<AlertEntity> findBySeverityAndIsActiveTrue(SeverityLevel severity);
}

