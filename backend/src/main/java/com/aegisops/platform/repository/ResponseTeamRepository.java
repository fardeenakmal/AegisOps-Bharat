package com.aegisops.platform.repository;

import com.aegisops.platform.entity.ResponseTeamEntity;
import com.aegisops.platform.enums.TeamStatus;
import com.aegisops.platform.enums.TeamType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ResponseTeamRepository extends JpaRepository<ResponseTeamEntity, String> {
    Optional<ResponseTeamEntity> findByCallSign(String callSign);
    List<ResponseTeamEntity> findByStatus(TeamStatus status);
    List<ResponseTeamEntity> findByTeamType(TeamType teamType);
    List<ResponseTeamEntity> findByZoneId(String zoneId);
    List<ResponseTeamEntity> findByZoneIdAndStatus(String zoneId, TeamStatus status);
}

