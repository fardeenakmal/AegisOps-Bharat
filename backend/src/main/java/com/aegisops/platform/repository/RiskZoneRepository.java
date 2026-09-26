package com.aegisops.platform.repository;

import com.aegisops.platform.entity.RiskZoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RiskZoneRepository extends JpaRepository<RiskZoneEntity, String> {
    Optional<RiskZoneEntity> findByCode(String code);
    List<RiskZoneEntity> findByLevel(String level);
    List<RiskZoneEntity> findByParentZoneId(String parentZoneId);
}

